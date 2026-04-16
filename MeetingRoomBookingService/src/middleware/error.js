module.exports = (err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.name || "Error",
    message: err.message || "Internal server error"
  });
};