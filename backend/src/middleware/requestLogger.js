const Logger = require('../utils/logger').default;

const requestLogger = (req, res, next) => {
  // Log the incoming request
  const userId = req.user ? req.user.id : null;
  Logger.logApiRequest(req, userId);

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    Logger.logApiResponse(req, res, data);
    return originalJson.call(this, data);
  };

  // Override res.status to capture status codes
  const originalStatus = res.status;
  res.status = function(code) {
    this.statusCode = code;
    return originalStatus.call(this, code);
  };

  next();
};

module.exports = requestLogger;