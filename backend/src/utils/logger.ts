
interface LogMeta {
  [key: string]: any;
}

interface Request {
  method: string;
  originalUrl: string;
  get(header: string): string | undefined;
  params: any;
  query: any;
  body: any;
  user?: { id: string };
}

interface Response {
  statusCode: number;
}

class Logger {
  static formatMessage(level: string, message: string, meta: LogMeta = {}): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };
    return `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message} ${JSON.stringify(meta)}`;
  }

  static log(level: string, message: string, meta: LogMeta = {}): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    console.log(formattedMessage);
  }

  static info(message: string, meta: LogMeta = {}): void {
    this.log('info', message, meta);
  }

  static warn(message: string, meta: LogMeta = {}): void {
    this.log('warn', message, meta);
  }

  static error(message: string, meta: LogMeta = {}): void {
    this.log('error', message, meta);
  }

  static debug(message: string, meta: LogMeta = {}): void {
    this.log('debug', message, meta);
  }

  // Specific method for API requests
  static logApiRequest(req: Request, userId: string | null = null, additionalMeta: LogMeta = {}): void {
    const meta: LogMeta = {
      method: req.method,
      path: req.originalUrl,
      userAgent: req.get('User-Agent'),
      userId: userId || (req.user ? req.user.id : null),
      params: req.params,
      query: req.query,
      body: req.method !== 'GET' ? this.sanitizeBody(req.body) : undefined,
      ...additionalMeta
    };

    this.info(`API Request: ${req.method} ${req.originalUrl}`, meta);
  }

  // Specific method for API responses
  static logApiResponse(req: Request, res: Response, responseData: any = null, error: any = null): void {
    const meta: LogMeta = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      userId: req.user ? req.user.id : null,
      error: error ? error.message || error : (responseData && responseData.error ? responseData.error : null)
    };

    const level = error ? 'error' : 'info';
    const message = `API Response: ${req.method} ${req.originalUrl} - ${res.statusCode}`;

    this.log(level, message, meta);
  }

  // Sanitize sensitive data from request body
  static sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

export default Logger;