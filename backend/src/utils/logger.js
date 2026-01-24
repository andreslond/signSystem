
class Logger {
  static formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };
    return `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message} ${JSON.stringify(meta)}`;
  }

  static log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
      console.log(formattedMessage);
    }

  static info(message, meta = {}) {
    this.log('info', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  static error(message, meta = {}) {
    this.log('error', message, meta);
  }

  static debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Specific method for API requests
  static logApiRequest(req, userId = null, additionalMeta = {}) {
    const meta = {
      method: req.method,
      path: req.originalUrl,
      userAgent: req.get('User-Agent'),
      //ip: req.ip,
      //userId: userId || (req.user ? req.user.id : null),
      params: req.params,
      query: req.query,
      body: req.method !== 'GET' ? this.sanitizeBody(req.body) : undefined,
      ...additionalMeta
    };

    this.info(`API Request: ${req.method} ${req.originalUrl}`, meta);
  }

  // Specific method for API responses
  static logApiResponse(req, res, responseData = null, error = null) {
    const meta = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      userId: req.user ? req.user.id : null,
      error: responseData.error ? responseData.error : null
    };

    const level = error ? 'error' : 'info';
    const message = `API Response: ${req.method} ${req.originalUrl} - ${res.statusCode}`;

    this.log(level, message, meta);
  }

  // Sanitize sensitive data from request body
  static sanitizeBody(body) {
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

module.exports = Logger;