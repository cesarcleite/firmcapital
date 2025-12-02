// backend/controllers/adminController.js
const User = require("../models/User");
const Cliente = require("../models/Cliente");
const Simulacao = require("../models/Simulacao");
const Empresa = require("../models/Empresa");
const TipoFundo = require("../models/TipoFundo");
const Log = require("../models/Log");
const { ACOES_LOG, SUCCESS_MESSAGES } = require("../config/constants"); // ADICIONADO

// @desc    Dashboard com estatísticas gerais
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res, next) => {
  try {
    const empresaId = req.user.empresa;

    // Estatísticas gerais
    const totalUsuarios = await User.countDocuments({
      empresa: empresaId,
      ativo: true,
    });
    const totalClientes = await Cliente.countDocuments({
      empresaDona: empresaId,
      ativo: true,
    });
    const totalSimulacoes = await Simulacao.countDocuments({
      empresa: empresaId,
    });
    const totalTiposFundos = await TipoFundo.countDocuments({ ativo: true });

    // Simulações por tipo de fundo
    const simulacoesPorTipo = await Simulacao.aggregate([
      { $match: { empresa: empresaId } },
      { $group: { _id: "$codigoTipoFundo", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Simulações por status
    const simulacoesPorStatus = await Simulacao.aggregate([
      { $match: { empresa: empresaId } },
      { $group: { _id: "$status", total: { $sum: 1 } } },
    ]);

    // Últimas simulações criadas
    const ultimasSimulacoes = await Simulacao.find({ empresa: empresaId })
      .populate("cliente", "nome email")
      .populate("criadoPor", "nome")
      .populate("tipoFundo", "nome icone cor")
      .sort({ dataCriacao: -1 })
      .limit(10);

    // Usuários mais ativos (com mais simulações)
    const usuariosMaisAtivos = await Simulacao.aggregate([
      { $match: { empresa: empresaId } },
      { $group: { _id: "$criadoPor", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "usuario",
        },
      },
      { $unwind: "$usuario" },
      {
        $project: {
          _id: 1,
          total: 1,
          nome: "$usuario.nome",
          email: "$usuario.email",
        },
      },
    ]);

    // Logs recentes
    const logsRecentes = await Log.find()
      .populate("usuario", "nome email")
      .sort({ timestamp: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        estatisticas: {
          totalUsuarios,
          totalClientes,
          totalSimulacoes,
          totalTiposFundos,
        },
        simulacoesPorTipo,
        simulacoesPorStatus,
        ultimasSimulacoes,
        usuariosMaisAtivos,
        logsRecentes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter configurações da empresa
// @route   GET /api/admin/empresa
// @access  Private/Admin
exports.getEmpresa = async (req, res, next) => {
  try {
    const empresa = await Empresa.findById(req.user.empresa);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: empresa,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar configurações da empresa
// @route   PUT /api/admin/empresa
// @access  Private/Admin
exports.atualizarEmpresa = async (req, res, next) => {
  try {
    const empresa = await Empresa.findByIdAndUpdate(
      req.user.empresa,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.UPDATE,
      entidade: "Empresa",
      entidadeId: empresa._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: empresa,
    });
  } catch (error) {
    next(error);
  }
};
