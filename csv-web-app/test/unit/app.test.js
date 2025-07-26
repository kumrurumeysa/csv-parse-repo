const request = require('supertest');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Location: 'https://s3.amazonaws.com/test-bucket/test.csv' })
    })
  }))
}));

// Create test app
const app = require('../app');

describe('CSV Parser Application', () => {
  describe('GET /', () => {
    it('should return 200 and serve index page', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /upload', () => {
    it('should return 200 and serve upload form', async () => {
      const response = await request(app).get('/upload');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Upload CSV');
      expect(response.text).toContain('input type="file"');
    });
  });

  describe('POST /', () => {
    it('should handle CSV file upload successfully', async () => {
      // Create a test CSV file
      const testCsvPath = path.join(__dirname, 'test.csv');
      const testCsvContent = 'name,age,city\nJohn,30,New York\nJane,25,London';
      fs.writeFileSync(testCsvPath, testCsvContent);

      const response = await request(app)
        .post('/')
        .attach('file', testCsvPath);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Upload success!');
      expect(response.text).toContain('John');
      expect(response.text).toContain('Jane');

      // Cleanup
      fs.unlinkSync(testCsvPath);
    });

    it('should handle empty CSV file', async () => {
      const testCsvPath = path.join(__dirname, 'empty.csv');
      fs.writeFileSync(testCsvPath, '');

      const response = await request(app)
        .post('/')
        .attach('file', testCsvPath);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Upload success!');

      // Cleanup
      fs.unlinkSync(testCsvPath);
    });

    it('should return 400 for non-CSV file', async () => {
      const testFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(testFilePath, 'This is not a CSV file');

      const response = await request(app)
        .post('/')
        .attach('file', testFilePath);

      expect(response.status).toBe(400);

      // Cleanup
      fs.unlinkSync(testFilePath);
    });
  });

  describe('Environment Variables', () => {
    it('should use default values when env vars are not set', () => {
      expect(process.env.PORT || 3000).toBe(3000);
      expect(process.env.AWS_REGION || 'eu-central-1').toBe('eu-central-1');
    });
  });
}); 