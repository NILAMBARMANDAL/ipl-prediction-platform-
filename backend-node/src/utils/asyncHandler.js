// asyncHandler: a higher-order function that wraps an async route handler
// so any thrown error (or rejected promise) is forwarded to Express's
// error-handling middleware via next(), instead of crashing or being swallowed.
//
// Without this, every controller needs its own try/catch. With it, controllers
// stay clean and all errors funnel to one place.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
