/**
 * Central error-handling middleware.
 * Always returns JSON so the frontend can parse errors uniformly.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  console.error(`[${req.method}] ${req.path} → ${status}: ${err.message}`);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
