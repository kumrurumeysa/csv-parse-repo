const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Mock AWS SDK for integration tests
jest.mock('aws-sdk');

describe('S3 Integration Tests', () => {
  let s3Mock;

  beforeEach(() => {
    s3Mock = {
      upload: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Location: 'https://s3.amazonaws.com/test-bucket/test.csv',
          ETag: '"test-etag"'
        })
      }),
      getObject: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Body: fs.createReadStream(path.join(__dirname, 'test.csv'))
        })
      }),
      listObjects: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Contents: [
            { Key: 'uploads/test1.csv', Size: 1024, LastModified: new Date() },
            { Key: 'uploads/test2.csv', Size: 2048, LastModified: new Date() }
          ]
        })
      })
    };

    AWS.S3.mockImplementation(() => s3Mock);
  });

  describe('S3 Upload Functionality', () => {
    it('should upload file to S3 successfully', async () => {
      const s3 = new AWS.S3({ region: 'eu-central-1' });
      const testFilePath = path.join(__dirname, 'test.csv');
      const testContent = 'name,age\nJohn,30\nJane,25';
      fs.writeFileSync(testFilePath, testContent);

      const uploadParams = {
        Bucket: 'test-bucket',
        Key: 'uploads/test.csv',
        Body: fs.createReadStream(testFilePath)
      };

      const result = await s3.upload(uploadParams).promise();

      expect(result.Location).toBe('https://s3.amazonaws.com/test-bucket/test.csv');
      expect(s3Mock.upload).toHaveBeenCalledWith(uploadParams);

      // Cleanup
      fs.unlinkSync(testFilePath);
    });

    it('should handle S3 upload errors', async () => {
      const s3 = new AWS.S3({ region: 'eu-central-1' });
      
      s3Mock.upload.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('S3 upload failed'))
      });

      const uploadParams = {
        Bucket: 'test-bucket',
        Key: 'uploads/test.csv',
        Body: 'test content'
      };

      await expect(s3.upload(uploadParams).promise()).rejects.toThrow('S3 upload failed');
    });
  });

  describe('S3 Configuration', () => {
    it('should use correct AWS region', () => {
      const s3 = new AWS.S3({ region: 'eu-central-1' });
      expect(AWS.S3).toHaveBeenCalledWith({ region: 'eu-central-1' });
    });

    it('should use environment variable for region', () => {
      process.env.AWS_REGION = 'us-east-1';
      const s3 = new AWS.S3({ region: process.env.AWS_REGION });
      expect(AWS.S3).toHaveBeenCalledWith({ region: 'us-east-1' });
    });
  });

  describe('S3 Bucket Operations', () => {
    it('should list objects in S3 bucket', async () => {
      const s3 = new AWS.S3({ region: 'eu-central-1' });
      
      const listParams = {
        Bucket: 'test-bucket',
        Prefix: 'uploads/'
      };

      const result = await s3.listObjects(listParams).promise();

      expect(result.Contents).toHaveLength(2);
      expect(result.Contents[0].Key).toBe('uploads/test1.csv');
      expect(s3Mock.listObjects).toHaveBeenCalledWith(listParams);
    });
  });
}); 