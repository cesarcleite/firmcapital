// backend/controllers/authController.js
const User = require("../models/User");
const Empresa = require("../models/Empresa");
const Log = require("../models/Log");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACOES_LOG,
} = require("../config/constants");
const { ROLES } = require("../config/roles");

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public (apenas para primeiro admin) ou Admin
exports.register = async (req, res, next) => {
  try {
    const { nome, email, senha, role, empresaId, telefone } = req.body;

    // Verificar se já existe usuário com este email
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        error: "Email já está em uso",
      });
    }

    // Verificar total de usuários
    const totalUsuarios = await User.countDocuments();

    // Se não for o primeiro usuário E não for um admin autenticado
    if (totalUsuarios > 0) {
      // Verificar se há usuário autenticado
      if (!req.user) {
        return res.status(403).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN,
        });
      }

      // Verificar se é admin
      if (req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN,
        });
      }
    }

    // Determinar empresa
    let empresa;
    if (totalUsuarios === 0) {
      empresa = await Empresa.findOne({ ativo: true });
      if (!empresa) {
        return res.status(400).json({
          success: false,
          error: "Nenhuma empresa ativa encontrada. Execute o seed primeiro.",
        });
      }
    } else {
      empresa = empresaId || req.user.empresa;
    }

    // Criar usuário
    const usuario = await User.create({
      nome,
      email,
      senha,
      role: totalUsuarios === 0 ? ROLES.ADMIN : role || ROLES.USUARIO,
      empresa,
      telefone,
      criadoPor: req.user?._id || null,
    });

    // Log da ação
    await Log.create({
      usuario: usuario._id,
      acao: ACOES_LOG.CREATE,
      entidade: "User",
      entidadeId: usuario._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Gerar token apenas se for o primeiro usuário ou auto-registro
    const token = totalUsuarios === 0 ? usuario.gerarToken() : null;

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      token,
      user: usuario.getDadosPublicos(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    // Validar email e senha
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: "Email e senha são obrigatórios",
      });
    }

    // Buscar usuário com senha
    const usuario = await User.findOne({ email }).select("+senha");

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Verificar se está ativo
    if (!usuario.ativo) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.USER_INACTIVE,
      });
    }

    // Verificar senha
    const senhaCorreta = await usuario.compararSenha(senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Atualizar último acesso (usar updateOne para evitar problemas com versioning)
    await User.findByIdAndUpdate(
      usuario._id,
      { ultimoAcesso: Date.now() },
      { timestamps: false }
    );

    // Log da ação
    await Log.create({
      usuario: usuario._id,
      acao: ACOES_LOG.LOGIN,
      entidade: "User",
      entidadeId: usuario._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Gerar token
    const token = usuario.gerarToken();

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN,
      token,
      user: usuario.getDadosPublicos(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.user.id)
      .populate("empresa", "nome nomeFantasia logo")
      .populate("responsavel", "nome email");

    res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar dados do usuário atual
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const camposPermitidos = {
      nome: req.body.nome,
      telefone: req.body.telefone,
      avatar: req.body.avatar,
      endereco: req.body.endereco,
      cargo: req.body.cargo,
    };

    // Remover campos undefined
    Object.keys(camposPermitidos).forEach(
      (key) =>
        camposPermitidos[key] === undefined && delete camposPermitidos[key]
    );

    const usuario = await User.findByIdAndUpdate(
      req.user.id,
      camposPermitidos,
      {
        new: true,
        runValidators: true,
      }
    );

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.UPDATE,
      entidade: "User",
      entidadeId: req.user.id,
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

// @desc    Atualizar senha
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        success: false,
        error: "Senha atual e nova senha são obrigatórias",
      });
    }

    const usuario = await User.findById(req.user.id).select("+senha");

    // Verificar senha atual
    const senhaCorreta = await usuario.compararSenha(senhaAtual);

    if (!senhaCorreta) {
      return res.status(401).json({
        success: false,
        error: "Senha atual incorreta",
      });
    }

    usuario.senha = novaSenha;
    await usuario.save();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.UPDATE,
      entidade: "User",
      entidadeId: req.user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      detalhes: new Map([["acao", "alteracao_senha"]]),
    });

    const token = usuario.gerarToken();

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.LOGOUT,
      entidade: "User",
      entidadeId: req.user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGOUT,
    });
  } catch (error) {
    next(error);
  }
};
