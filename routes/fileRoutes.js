const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Multer setup for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @route POST /api/files/upload
 * @description Upload a file to a remote file server
 * @access Private
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Prepare form data for remote server
    const form = new FormData();
    form.append('file', req.file.buffer, req.file.originalname);

    // Send file to remote server (replace URL with your remote server endpoint)
    const remoteResponse = await axios.post('https://your-remote-server.com/upload', form, {
      headers: form.getHeaders()
    });

    res.status(200).json({ message: 'File uploaded to remote server', data: remoteResponse.data });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
});

/**
 * @route GET /api/files/:filename
 * @description Retrieve a file from a remote file server
 * @access Private
 */
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Fetch file from remote server (replace URL with your remote server endpoint)
    const fileResponse = await axios.get(`https://your-remote-server.com/files/${filename}`, {
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fileResponse.data.pipe(res);
  } catch (error) {
    res.status(404).json({ message: 'File not found on remote server', error: error.message });
  }
});

module.exports = router;
