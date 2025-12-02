// backend/controllers/usuarioController.js
const User = require("../models/User");
const Log = require("../models/Log");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACOES_LOG,
} = require("../config/constants");
const { ROLES } = require("../config/roles");

// @desc    Listar usuários
// @route   GET /api/usuarios
// @access  Private/Admin
exports.listarUsuarios = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, ativo, search } = req.query;

    const query = {};

    // Filtros
    if (role) query.role = role;
    if (ativo !== undefined) query.ativo = ativo === "true";
    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Se não for admin, ver apenas usuários da mesma empresa
    if (req.user.role !== ROLES.ADMIN) {
      query.empresa = req.user.empresa;
    }

    // DEBUG: Ver a query
    console.log("Query de usuários:", JSON.stringify(query));
    console.log("Usuário logado:", req.user.email, "Role:", req.user.role);

    const usuarios = await User.find(query)
      .populate("empresa", "nome nomeFantasia")
      .populate("criadoPor", "nome email")
      .sort({ dataCriacao: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-senha");

    console.log("Total de usuários encontrados:", usuarios.length);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: usuarios,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter usuário por ID
// @route   GET /api/usuarios/:id
// @access  Private/Admin
exports.obterUsuario = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.params.id)
      .populate("empresa", "nome nomeFantasia logo")
      .populate("criadoPor", "nome email")
      .select("-senha");

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar usuário
// @route   PUT /api/usuarios/:id
// @access  Private/Admin
exports.atualizarUsuario = async (req, res, next) => {
  try {
    const camposPermitidos = {
      nome: req.body.nome,
      email: req.body.email,
      role: req.body.role,
      telefone: req.body.telefone,
      ativo: req.body.ativo,
      avatar: req.body.avatar,
      empresa: req.body.empresa,
    };

    // Remover campos undefined
    Object.keys(camposPermitidos).forEach(
      (key) =>
        camposPermitidos[key] === undefined && delete camposPermitidos[key]
    );

    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      camposPermitidos,
      {
        new: true,
        runValidators: true,
      }
    ).select("-senha");

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.UPDATE,
      entidade: "User",
      entidadeId: usuario._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      detalhes: new Map(Object.entries(camposPermitidos)),
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar usuário (soft delete)
// @route   DELETE /api/usuarios/:id
// @access  Private/Admin
exports.deletarUsuario = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Não permitir deletar a si mesmo
    if (usuario._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: "Você não pode desativar sua própria conta",
      });
    }

    // Soft delete - apenas desativar
    usuario.ativo = false;
    await usuario.save();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.DELETE,
      entidade: "User",
      entidadeId: usuario._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.DELETED,
    });
  } catch (error) {
    next(error);
  }
};
