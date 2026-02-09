// src/controllers/uploadController.js
exports.uploadFile = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const f = req.file;
    return res.status(200).json({
      success: true,
      file: {
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        filename: f.filename,
        url: `/uploads/${f.filename}`
      }
    });
  } catch (err) {
    next(err);
  }
};
