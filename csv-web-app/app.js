const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'eu-central-1' });

const PORT = process.env.PORT || 3000;
const BUCKET = process.env.S3_BUCKET || 'case-bucket-ounass';

app.get('/', (req, res) => {
  res.send(`
    <h2>Upload CSV</h2>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  `);
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const results = [];

  // Read CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const key = `uploads/${req.file.originalname}`;

      // Upload S3
      const uploadParams = {
        Bucket: BUCKET,
        Key: key,
        Body: fs.createReadStream(filePath),
      };

      try {
        await s3.upload(uploadParams).promise();
        res.send(`<h3>Upload success!</h3><pre>${JSON.stringify(results, null, 2)}</pre>`);
      } catch (err) {
        console.error(err);
        res.status(500).send('Error uploading to S3');
      } finally {
        fs.unlinkSync(filePath);
      }
    });
});

app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));