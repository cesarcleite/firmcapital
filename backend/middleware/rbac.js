// backend/middleware/rbac.js
const { hasPermission } = require("../config/roles");
const { ERROR_MESSAGES } = require("../config/constants");
const Simulacao = require("../models/Simulacao");

// Middleware para verificar permissões específicas
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }
    next();
  };
};

// Verifica se o usuário pode acessar uma simulação específica
exports.canAccessSimulation = async (req, res, next) => {
  try {
    const simulacao = await Simulacao.findById(req.params.id);

    if (!simulacao) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Admin pode acessar tudo
    if (req.user.role === "admin") {
      req.simulacao = simulacao;
      return next();
    }

    // Usuário pode acessar apenas suas próprias simulações
    if (req.user.role === "usuario") {
      if (simulacao.criadoPor.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN,
        });
      }
      req.simulacao = simulacao;
      return next();
    }

    // Cliente pode acessar apenas simulações criadas para ele
    if (req.user.role === "cliente") {
      // Precisamos encontrar o documento do Cliente associado a este Usuário
      const Cliente = require("../models/Cliente");
      const clienteDoc = await Cliente.findOne({ usuario: req.user.id });

      if (!clienteDoc) {
        return res.status(403).json({
          success: false,
          error: "Perfil de cliente não encontrado para este usuário",
        });
      }

      if (simulacao.cliente.toString() !== clienteDoc._id.toString()) {
        return res.status(403).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN,
        });
      }
      req.simulacao = simulacao;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: ERROR_MESSAGES.FORBIDDEN,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
