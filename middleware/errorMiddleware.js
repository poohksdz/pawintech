const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // Only log non-404 errors to reduce noise from missing static assets
  if (res.statusCode !== 404) {
    console.error("🔥 Server Error:", err);
  }

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // NOTE: checking for invalid ObjectId moved to it's own middleware
  // See README for further info.

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
