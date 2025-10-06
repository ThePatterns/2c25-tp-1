export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export const notFoundResponse = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: 'Validation Error',
    errors: Array.isArray(errors) ? errors : [errors],
  });
};
