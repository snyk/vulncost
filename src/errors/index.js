class CustomError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = undefined;
    this.innerError = undefined;
    this.userMessage = undefined;
  }
}

export function TokenExpiredError() {
  const errorMsg =
    'Sorry, but your authentication token has now' +
    ' expired.\nPlease try to authenticate again.';

  const error = new CustomError(errorMsg);
  error.code = 401;
  error.strCode = 'AUTH_TIMEOUT';
  error.userMessage = errorMsg;
  return error;
}

export function AuthFailedError(errorMessage, errorCode) {
  const message = errorMessage ? errorMessage : 'Authentication failed.';
  const error = new CustomError(message);
  error.code = errorCode || 401;
  error.strCode = 'authfail';
  error.userMessage = message;
  return error;
}
