// backend/controllers/tipoFundoController.js
const TipoFundo = require("../models/TipoFundo");
const Log = require("../models/Log");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACOES_LOG,
} = require("../config/constants");

// @desc    Listar tipos de fundos
// @route   GET /api/tipos-fundos
// @access  Private
exports.listarTiposFundos = async (req, res, next) => {
  try {
    const { ativo } = req.query;

    const query = {};
    if (ativo !== undefined) query.ativo = ativo === "true";

    const tiposFundos = await TipoFundo.find(query).sort({ ordem: 1, nome: 1 });

    res.status(200).json({
      success: true,
      data: tiposFundos,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter tipo de fundo por ID
// @route   GET /api/tipos-fundos/:id
// @access  Private
exports.obterTipoFundo = async (req, res, next) => {
  try {
    const tipoFundo = await TipoFundo.findById(req.params.id);

    if (!tipoFundo) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    res.status(200).json({
      success: true,
      data: tipoFundo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Criar tipo de fundo
// @route   POST /api/tipos-fundos
// @access  Private/Admin
exports.criarTipoFundo = async (req, res, next) => {
  try {
    const tipoFundo = await TipoFundo.create({
      ...req.body,
      criadoPor: req.user.id,
    });

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.CREATE,
      entidade: "TipoFundo",
      entidadeId: tipoFundo._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: tipoFundo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar tipo de fundo
// @route   PUT /api/tipos-fundos/:id
// @access  Private/Admin
exports.atualizarTipoFundo = async (req, res, next) => {
  try {
    const tipoFundo = await TipoFundo.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!tipoFundo) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.UPDATE,
      entidade: "TipoFundo",
      entidadeId: tipoFundo._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: tipoFundo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar tipo de fundo
// @route   DELETE /api/tipos-fundos/:id
// @access  Private/Admin
exports.deletarTipoFundo = async (req, res, next) => {
  try {
    const tipoFundo = await TipoFundo.findById(req.params.id);

    if (!tipoFundo) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Soft delete
    tipoFundo.ativo = false;
    await tipoFundo.save();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.DELETE,
      entidade: "TipoFundo",
      entidadeId: tipoFundo._id,
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
