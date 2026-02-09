const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = crypto.randomBytes(16).toString('hex') + Date.now();
    cb(null, uniqueName + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExt = ['.jpg', '.jpeg', '.png', '.pdf'];
  const allowedMime = ['image/jpeg', 'image/png', 'application/pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Invalid file type. Only JPG, PNG and PDF files are allowed.');
    err.statusCode = 400;
    cb(err);
  }
};

const limits = { fileSize: 2 * 1024 * 1024 }; // 2MB

const upload = multer({ storage, fileFilter, limits });

module.exports = {
  upload,
  single: upload.single('file'),
};
