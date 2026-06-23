// ApiError: a custom Error subclass that carries an HTTP status code and a
// consistent shape. Throwing `new ApiError(404, "Match not found")` anywhere
// in a controller lets the central error middleware respond with the right
// status and a uniform JSON body, instead of every error looking different.
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false; // an error response is never a success
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
