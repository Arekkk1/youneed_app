const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
      res.status(statusCode).json({
        status: 'success',
        message,
        data,
      });
    };
    
    const sendErrorResponse = (res, statusCode, message, error = null) => {
      console.error(`Error [${statusCode}]: ${message}`, error || ''); // Log error details server-side
      res.status(statusCode).json({
        status: 'error',
        message,
        // Optionally include error details in development, but hide in production
        error: process.env.NODE_ENV === 'development' && error ? (error.message || error) : undefined,
        errors: process.env.NODE_ENV === 'development' && Array.isArray(error) ? error : undefined, // For validation errors
      });
    };
    
    module.exports = {
      sendSuccessResponse,
      sendErrorResponse,
    };
