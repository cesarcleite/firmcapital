// backend/controllers/simulacaoController.js
const Simulacao = require("../models/Simulacao");
const Cliente = require("../models/Cliente");
const TipoFundo = require("../models/TipoFundo");
const Log = require("../models/Log");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACOES_LOG,
  STATUS_SIMULACAO,
} = require("../config/constants");
const { ROLES } = require("../config/roles");

// @desc    Criar simulação
// @route   POST /api/simulacoes
// @access  Private/Usuario/Admin
exports.criarSimulacao = async (req, res, next) => {
  try {
    const {
      titulo,
      descricao,
      tipoFundo,
      cliente,
      parametros,
      resultado,
      dadosDetalhados,
      status,
    } = req.body;

    // Verificar se tipo de fundo existe
    const tipoFundoDoc = await TipoFundo.findById(tipoFundo);
    if (!tipoFundoDoc) {
      return res.status(404).json({
        success: false,
        error: "Tipo de fundo não encontrado",
      });
    }

    // Verificar se cliente existe e se usuário tem permissão
    const clienteDoc = await Cliente.findById(cliente);
    if (!clienteDoc) {
      return res.status(404).json({
        success: false,
        error: "Cliente não encontrado",
      });
    }

    if (
      req.user.role === ROLES.USUARIO &&
      clienteDoc.responsavel.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para criar simulações para este cliente",
      });
    }

    // Criar simulação
    const simulacao = await Simulacao.create({
      titulo,
      descricao,
      tipoFundo,
      codigoTipoFundo: tipoFundoDoc.codigo,
      cliente,
      parametros: new Map(Object.entries(parametros || {})),
      resultado: new Map(Object.entries(resultado || {})),
      dadosDetalhados,
      status: status || STATUS_SIMULACAO.RASCUNHO,
      criadoPor: req.user.id,
      empresa: req.user.empresa,
    });

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.CREATE,
      entidade: "Simulacao",
      entidadeId: simulacao._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: simulacao,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Listar simulações
// @route   GET /api/simulacoes
// @access  Private
exports.listarSimulacoes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      tipoFundo,
      cliente,
      search,
    } = req.query;

    const query = {};

    // Filtrar baseado no role
    if (req.user.role === ROLES.USUARIO) {
      query.criadoPor = req.user.id;
    } else if (req.user.role === ROLES.CLIENTE) {
      // Cliente vê apenas simulações criadas para ele
      const clienteDoc = await Cliente.findOne({ usuario: req.user.id });
      if (clienteDoc) {
        query.cliente = clienteDoc._id;
      }
    } else if (req.user.role === ROLES.ADMIN) {
      query.empresa = req.user.empresa;
    }

    // Filtros adicionais
    if (status) query.status = status;
    if (tipoFundo) query.tipoFundo = tipoFundo;
    if (cliente) query.cliente = cliente;
    if (search) {
      query.$or = [
        { titulo: { $regex: search, $options: "i" } },
        { descricao: { $regex: search, $options: "i" } },
      ];
    }

    const simulacoes = await Simulacao.find(query)
      .populate("tipoFundo", "nome codigo icone cor")
      .populate("cliente", "nome email cpfCnpj")
      .populate("criadoPor", "nome email")
      .sort({ dataCriacao: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Simulacao.countDocuments(query);

    res.status(200).json({
      success: true,
      data: simulacoes,
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

// @desc    Obter simulação por ID
// @route   GET /api/simulacoes/:id
// @access  Private
exports.obterSimulacao = async (req, res, next) => {
  try {
    const simulacao = await Simulacao.findById(req.params.id)
      .populate("tipoFundo")
      .populate("cliente", "nome email cpfCnpj telefone empresa cargo")
      .populate("criadoPor", "nome email")
      .populate("empresa", "nome nomeFantasia logo");

    if (!simulacao) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar permissão (já verificado no middleware canAccessSimulation)
    // Incrementar visualizações
    await simulacao.incrementarVisualizacoes();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.VIEW,
      entidade: "Simulacao",
      entidadeId: simulacao._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      data: simulacao,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar simulação
// @route   PUT /api/simulacoes/:id
// @access  Private
exports.atualizarSimulacao = async (req, res, next) => {
  try {
    let simulacao = await Simulacao.findById(req.params.id);

    if (!simulacao) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    const camposPermitidos = {
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      parametros: req.body.parametros
        ? new Map(Object.entries(req.body.parametros))
        : undefined,
      resultado: req.body.resultado
        ? new Map(Object.entries(req.body.resultado))
        : undefined,
      dadosDetalhados: req.body.dadosDetalhados,
      status: req.body.status,
      favorita: req.body.favorita,
    };

    // Remover campos undefined
    Object.keys(camposPermitidos).forEach(
      (key) =>
        camposPermitidos[key] === undefined && delete camposPermitidos[key]
    );

    // Incrementar versão se houver mudança em parâmetros ou resultado
    if (req.body.parametros || req.body.resultado) {
      camposPermitidos.versao = simulacao.versao + 1;
    }
    simulacao = await Simulacao.findByIdAndUpdate(
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
      entidade: "Simulacao",
      entidadeId: simulacao._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: simulacao,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar simulação
// @route   DELETE /api/simulacoes/:id
// @access  Private
exports.deletarSimulacao = async (req, res, next) => {
  try {
    const simulacao = await Simulacao.findById(req.params.id);

    if (!simulacao) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    await simulacao.deleteOne();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.DELETE,
      entidade: "Simulacao",
      entidadeId: simulacao._id,
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

// @desc    Compartilhar simulação
// @route   POST /api/simulacoes/:id/compartilhar
// @access  Private
exports.compartilharSimulacao = async (req, res, next) => {
  try {
    const simulacao = await Simulacao.findById(req.params.id);

    if (!simulacao) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Gerar ou obter link de compartilhamento
    const link = simulacao.gerarLinkCompartilhamento();
    simulacao.compartilhada = true;
    await simulacao.save();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.SHARE,
      entidade: "Simulacao",
      entidadeId: simulacao._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      data: {
        linkCompartilhamento: link,
        url: `${req.protocol}://${req.get(
          "host"
        )}/api/simulacoes/compartilhadas/${link}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter simulação compartilhada
// @route   GET /api/simulacoes/compartilhadas/:link
// @access  Public
exports.obterSimulacaoCompartilhada = async (req, res, next) => {
  try {
    const simulacao = await Simulacao.findOne({
      linkCompartilhamento: req.params.link,
    })
      .populate("tipoFundo", "nome codigo icone cor")
      .populate("cliente", "nome empresa")
      .populate("empresa", "nome nomeFantasia logo");

    if (!simulacao) {
      return res.status(404).json({
        success: false,
        error: "Simulação compartilhada não encontrada",
      });
    }

    if (!simulacao.compartilhada) {
      return res.status(403).json({
        success: false,
        error: "Esta simulação não está compartilhada",
      });
    }

    // Incrementar visualizações
    await simulacao.incrementarVisualizacoes();

    res.status(200).json({
      success: true,
      data: simulacao,
    });
  } catch (error) {
    next(error);
  }
};
