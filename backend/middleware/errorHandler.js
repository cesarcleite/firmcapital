// backend/middleware/errorHandler.js
const { ERROR_MESSAGES } = require("../config/constants");
const config = require("../config/config");

// Middleware de tratamento de erros global
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro para debug
  console.error("❌ Erro:", err);

  // Erro de validação do Mongoose
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error.message = message.join(", ");
    error.statusCode = 400;
  }

  // Erro de campo duplicado do MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error.message = `${field} já está em uso. ${ERROR_MESSAGES.DUPLICATE_KEY}`;
    error.statusCode = 400;
  }

  // Erro de cast do Mongoose (ID inválido)
  if (err.name === "CastError") {
    error.message = ERROR_MESSAGES.NOT_FOUND;
    error.statusCode = 404;
  }

  // Erro de JWT
  if (err.name === "JsonWebTokenError") {
    error.message = ERROR_MESSAGES.INVALID_TOKEN;
    error.statusCode = 401;
  }

  // Token expirado
  if (err.name === "TokenExpiredError") {
    error.message = ERROR_MESSAGES.TOKEN_EXPIRED;
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || ERROR_MESSAGES.SERVER_ERROR,
    ...(config.isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
