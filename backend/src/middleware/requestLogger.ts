import Logger from '../utils/logger';

const requestLogger = (req: any, res: any, next: any) => {
  // Log the incoming request
  const userId = req.user ? req.user.id : null;
  Logger.logApiRequest(req, userId);

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data: any) {
    Logger.logApiResponse(req, res, data);
    return originalJson.call(this, data);
  };

  // Override res.status to capture status codes
  const originalStatus = res.status;
  res.status = function(code: number) {
    this.statusCode = code;
    return originalStatus.call(this, code);
  };

  next();
};

export default requestLogger;
