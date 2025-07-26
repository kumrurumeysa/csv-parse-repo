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
const SHARED_DIR = process.env.SHARED_DIR || '/shared';

// Serve static files
app.use('/static', express.static(SHARED_DIR));

app.get('/upload', (req, res) => {
  res.send(`
    <h2>Upload CSV</h2>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  `);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(SHARED_DIR, 'index.html'));
});

app.post('/', upload.single('file'), async (req, res) => {
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

const indexHtml = path.join(SHARED_DIR, 'index.html');
if (!fs.existsSync(indexHtml)) {
  fs.writeFileSync(indexHtml, `
    <html>
      <head><title>CSV Upload App</title></head>
      <body>
        <h2>Welcome!</h2>
        <p><a href="/upload">Go to Upload Page</a></p>
      </body>
    </html>
  `, { mode: 0o644 });
}

app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));