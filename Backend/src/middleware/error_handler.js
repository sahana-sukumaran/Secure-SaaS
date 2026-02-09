// src/middleware/error_handler.js
module.exports = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(e => e.message)
      .join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Multer (file upload) errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size is 2MB.';
    } else {
      message = err.message || 'File upload error';
    }
  }

  // Custom file filter errors (thrown in middleware)
  if (err.message && err.message.includes('Invalid file type')) {
    statusCode = err.statusCode || 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
