const sendError = (res, statusCode, error) => {
  return res.status(statusCode).json({ error });
};

module.exports = sendError;
