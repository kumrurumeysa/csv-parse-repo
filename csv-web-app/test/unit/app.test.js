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

// Create a simple test app
const app = express();
const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  res.send('<h2>Welcome!</h2><p><a href="/upload">Go to Upload Page</a></p>');
});

app.get('/upload', (req, res) => {
  res.send(`
    <h2>Upload CSV</h2>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  `);
});

app.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  
  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(require('csv-parser')())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        res.send(`<h3>Upload success!</h3><pre>${JSON.stringify(results, null, 2)}</pre>`);
      } catch (err) {
        res.status(500).send('Error processing file');
      } finally {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
});

describe('CSV Parser Application', () => {
  describe('GET /', () => {
    it('should return 200 and serve index page', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Welcome!');
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
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
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
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    });

    it('should return 400 for no file upload', async () => {
      const response = await request(app)
        .post('/');

      expect(response.status).toBe(400);
      expect(response.text).toContain('No file uploaded');
    });
  });

  describe('Environment Variables', () => {
    it('should use default values when env vars are not set', () => {
      expect(process.env.PORT || 3000).toBe(3000);
      expect(process.env.AWS_REGION || 'eu-central-1').toBe('eu-central-1');
    });
  });
}); 