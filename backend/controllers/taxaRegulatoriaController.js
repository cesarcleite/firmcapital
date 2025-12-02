// backend/controllers/taxaRegulatoriaController.js
const TaxaRegulatoria = require("../models/TaxaRegulatoria");
const Log = require("../models/Log");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACOES_LOG,
} = require("../config/constants");
const { ROLES } = require("../config/roles");

// @desc    Criar taxa regulatória
// @route   POST /api/taxas-regulatorias
// @access  Private/Admin
exports.criarTaxa = async (req, res, next) => {
  try {
    const {
      tipo,
      nome,
      descricao,
      tipoCalculo,
      periodicidade,
      valorFixo,
      percentual,
      valorMinimo,
      valorMaximo,
      faixas,
      configDistribuicao,
      mesCobranca,
      aplicavelA,
      fundamentoLegal,
      observacoes,
    } = req.body;

    // Criar taxa
    const taxa = await TaxaRegulatoria.create({
      empresa: req.user.empresa,
      tipo,
      nome,
      descricao,
      tipoCalculo,
      periodicidade,
      valorFixo: valorFixo || 0,
      percentual: percentual || 0,
      valorMinimo: valorMinimo || 0,
      valorMaximo: valorMaximo || 0,
      faixas: faixas || [],
      configDistribuicao,
      mesCobranca,
      aplicavelA: aplicavelA || ["FII"],
      fundamentoLegal,
      observacoes,
      criadoPor: req.user.id,
      isPadrao: false, // Taxas criadas por usuários nunca são padrão
    });

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.CREATE,
      entidade: "TaxaRegulatoria",
      entidadeId: taxa._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: taxa,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Listar taxas regulatórias
// @route   GET /api/taxas-regulatorias
// @access  Private
exports.listarTaxas = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, tipo, ativo, aplicavelA } = req.query;

    const query = {
      empresa: req.user.empresa,
    };

    // Filtros
    if (tipo) query.tipo = tipo;
    if (ativo !== undefined) query.ativo = ativo === "true";
    if (aplicavelA) query.aplicavelA = aplicavelA;

    const taxas = await TaxaRegulatoria.find(query)
      .populate("criadoPor", "nome email")
      .populate("atualizadoPor", "nome email")
      .sort({ tipo: 1, nome: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TaxaRegulatoria.countDocuments(query);

    res.status(200).json({
      success: true,
      data: taxas,
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

// @desc    Obter taxa por ID
// @route   GET /api/taxas-regulatorias/:id
// @access  Private
exports.obterTaxa = async (req, res, next) => {
  try {
    const taxa = await TaxaRegulatoria.findById(req.params.id)
      .populate("criadoPor", "nome email")
      .populate("atualizadoPor", "nome email")
      .populate("empresa", "nome nomeFantasia");

    if (!taxa) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar se pertence à empresa do usuário
    if (taxa.empresa._id.toString() !== req.user.empresa.toString()) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    res.status(200).json({
      success: true,
      data: taxa,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar taxa regulatória
// @route   PUT /api/taxas-regulatorias/:id
// @access  Private/Admin
exports.atualizarTaxa = async (req, res, next) => {
  try {
    let taxa = await TaxaRegulatoria.findById(req.params.id);

    if (!taxa) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar se pertence à empresa do usuário
    if (taxa.empresa.toString() !== req.user.empresa.toString()) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    // Não permitir editar taxas padrão do sistema
    if (taxa.isPadrao) {
      return res.status(403).json({
        success: false,
        error:
          "Taxas padrão do sistema não podem ser editadas. Crie uma nova taxa personalizada.",
      });
    }

    const camposPermitidos = {
      nome: req.body.nome,
      descricao: req.body.descricao,
      tipoCalculo: req.body.tipoCalculo,
      periodicidade: req.body.periodicidade,
      valorFixo: req.body.valorFixo,
      percentual: req.body.percentual,
      valorMinimo: req.body.valorMinimo,
      valorMaximo: req.body.valorMaximo,
      faixas: req.body.faixas,
      configDistribuicao: req.body.configDistribuicao,
      mesCobranca: req.body.mesCobranca,
      aplicavelA: req.body.aplicavelA,
      fundamentoLegal: req.body.fundamentoLegal,
      observacoes: req.body.observacoes,
      ativo: req.body.ativo,
      atualizadoPor: req.user.id,
    };

    // Remover campos undefined
    Object.keys(camposPermitidos).forEach(
      (key) =>
        camposPermitidos[key] === undefined && delete camposPermitidos[key]
    );

    taxa = await TaxaRegulatoria.findByIdAndUpdate(
      req.params.id,
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
      entidade: "TaxaRegulatoria",
      entidadeId: taxa._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: taxa,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar taxa regulatória
// @route   DELETE /api/taxas-regulatorias/:id
// @access  Private/Admin
exports.deletarTaxa = async (req, res, next) => {
  try {
    const taxa = await TaxaRegulatoria.findById(req.params.id);

    if (!taxa) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar se pertence à empresa do usuário
    if (taxa.empresa.toString() !== req.user.empresa.toString()) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    // Não permitir deletar taxas padrão do sistema
    if (taxa.isPadrao) {
      return res.status(403).json({
        success: false,
        error:
          "Taxas padrão do sistema não podem ser deletadas. Você pode desativá-las.",
      });
    }

    await taxa.deleteOne();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.DELETE,
      entidade: "TaxaRegulatoria",
      entidadeId: taxa._id,
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

// @desc    Calcular valor de uma taxa
// @route   POST /api/taxas-regulatorias/:id/calcular
// @access  Private
exports.calcularValorTaxa = async (req, res, next) => {
  try {
    const taxa = await TaxaRegulatoria.findById(req.params.id);

    if (!taxa) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar se pertence à empresa do usuário
    if (taxa.empresa.toString() !== req.user.empresa.toString()) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    const { pl, valorOferta, parcelas } = req.body;

    const valorCalculado = taxa.calcularValor({
      pl: pl || 0,
      valorOferta: valorOferta || 0,
      parcelas: parcelas || 1,
    });

    res.status(200).json({
      success: true,
      data: {
        taxaId: taxa._id,
        tipo: taxa.tipo,
        nome: taxa.nome,
        valorCalculado,
        parametrosUsados: {
          pl,
          valorOferta,
          parcelas,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter taxas aplicáveis a um tipo de fundo
// @route   GET /api/taxas-regulatorias/aplicaveis/:tipoFundo
// @access  Private
exports.obterTaxasAplicaveis = async (req, res, next) => {
  try {
    const { tipoFundo } = req.params;

    const taxas = await TaxaRegulatoria.find({
      empresa: req.user.empresa,
      ativo: true,
      aplicavelA: tipoFundo.toUpperCase(),
    })
      .select("-__v")
      .sort({ tipo: 1, nome: 1 });

    res.status(200).json({
      success: true,
      data: taxas,
      count: taxas.length,
    });
  } catch (error) {
    next(error);
  }
};
