// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ERROR_MESSAGES } = require("../config/constants");
const config = require("../config/config");

// Protege rotas que requerem autenticação
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Verifica se o token está no header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Verifica se o token existe
    if (!token) {
      console.log("🚫 AUTH MIDDLEWARE: SEM TOKEN no header");
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    console.log("🔑 AUTH MIDDLEWARE: Token recebido:", token.substring(0, 20) + "...");

    try {
      // Verifica e decodifica o token
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log("✅ AUTH MIDDLEWARE: Token decodificado, user ID:", decoded.id);

      // Busca o usuário pelo ID do token
      req.user = await User.findById(decoded.id).select("-senha");
      console.log("👤 AUTH MIDDLEWARE: Usuário encontrado?", !!req.user, "ID:", decoded.id);

      if (!req.user) {
        console.log("❌ AUTH MIDDLEWARE: Usuário NÃO encontrado no banco!");
        return res.status(401).json({
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Verifica se o usuário está ativo
      if (!req.user.ativo) {
        return res.status(403).json({
          success: false,
          error: ERROR_MESSAGES.USER_INACTIVE,
        });
      }

      // Atualizar último acesso (usar updateOne para evitar problemas com versioning)
      await User.findByIdAndUpdate(
        req.user._id,
        { ultimoAcesso: Date.now() },
        { timestamps: false }
      );

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error:
          err.name === "TokenExpiredError"
            ? ERROR_MESSAGES.TOKEN_EXPIRED
            : ERROR_MESSAGES.INVALID_TOKEN,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Autoriza acesso baseado em roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }
    next();
  };
};
