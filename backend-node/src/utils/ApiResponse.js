// ApiResponse: a uniform envelope for every successful response so the
// frontend always receives the same shape: { statusCode, data, message, success }.
// This pairs with ApiError (which produces the same shape for failures),
// giving the client one predictable contract for all endpoints.
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400; // 2xx/3xx are success, 4xx/5xx are not
  }
}

export { ApiResponse };
