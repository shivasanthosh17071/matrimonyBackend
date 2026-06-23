// File: src/utils/apiResponse.js
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

const sendError = (res, message = 'Something went wrong', statusCode = 500, code = null) =>
  res.status(statusCode).json({ success: false, message, ...(code && { code }) });

const sendPaginated = (res, data, total, page, limit, message = 'Success') =>
  res.status(200).json({
    success: true, message, data,
    pagination: {
      total, page: parseInt(page), limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });

module.exports = { sendSuccess, sendError, sendPaginated };
