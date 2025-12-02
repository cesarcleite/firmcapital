// backend/controllers/clienteController.js
const Cliente = require("../models/Cliente");
const User = require("../models/User");
const Log = require("../models/Log");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACOES_LOG,
} = require("../config/constants");
const { ROLES } = require("../config/roles");

// @desc    Criar cliente
// @route   POST /api/clientes
// @access  Private/Usuario/Admin
exports.criarCliente = async (req, res, next) => {
  try {
    const {
      nome,
      email,
      cpfCnpj,
      telefone,
      empresa,
      cargo,
      endereco,
      tags,
      observacoes,
      criarAcesso,
    } = req.body;

    // Verificar se CPF/CNPJ já existe (somente se foi fornecido)
    if (cpfCnpj) {
      const clienteExistente = await Cliente.findOne({ cpfCnpj });
      if (clienteExistente) {
        return res.status(400).json({
          success: false,
          error: "CPF/CNPJ já cadastrado",
        });
      }
    }

    // Criar cliente
    const cliente = await Cliente.create({
      nome,
      email,
      cpfCnpj,
      telefone,
      empresa,
      cargo,
      endereco,
      tags,
      observacoes,
      responsavel: req.user.id,
      empresaDona: req.user.empresa,
      criadoPor: req.user.id,
    });

    // Se solicitado, criar usuário de acesso
    if (criarAcesso) {
      const senhaTemporaria = Math.random().toString(36).slice(-8);

      const usuario = await User.create({
        nome,
        email,
        senha: senhaTemporaria,
        role: ROLES.CLIENTE,
        cpfCnpj,
        telefone,
        empresa: req.user.empresa,
        responsavel: req.user.id,
        criadoPor: req.user.id,
      });

      cliente.usuario = usuario._id;
      await cliente.save();

      // TODO: Enviar email com senha temporária
    }

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.CREATE,
      entidade: "Cliente",
      entidadeId: cliente._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Listar clientes
// @route   GET /api/clientes
// @access  Private
exports.listarClientes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ativo, search } = req.query;

    const query = {};

    // Admin vê todos, usuário vê apenas seus clientes
    if (req.user.role === ROLES.USUARIO) {
      query.responsavel = req.user.id;
    } else if (req.user.role === ROLES.ADMIN) {
      query.empresaDona = req.user.empresa;
    }

    // Filtros
    if (ativo !== undefined) query.ativo = ativo === "true";
    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { cpfCnpj: { $regex: search, $options: "i" } },
      ];
    }

    const clientes = await Cliente.find(query)
      .populate("responsavel", "nome email")
      .populate("usuario", "nome email ativo")
      .sort({ dataCriacao: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Cliente.countDocuments(query);

    res.status(200).json({
      success: true,
      data: clientes,
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

// @desc    Obter cliente por ID
// @route   GET /api/clientes/:id
// @access  Private
exports.obterCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
      .populate("responsavel", "nome email telefone")
      .populate("usuario", "nome email ativo ultimoAcesso")
      .populate("empresaDona", "nome nomeFantasia");

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar permissão
    if (
      req.user.role === ROLES.USUARIO &&
      cliente.responsavel._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    res.status(200).json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar cliente
// @route   PUT /api/clientes/:id
// @access  Private
exports.atualizarCliente = async (req, res, next) => {
  try {
    let cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar permissão
    if (
      req.user.role === ROLES.USUARIO &&
      cliente.responsavel.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    const camposPermitidos = {
      nome: req.body.nome,
      email: req.body.email,
      telefone: req.body.telefone,
      empresa: req.body.empresa,
      cargo: req.body.cargo,
      endereco: req.body.endereco,
      tags: req.body.tags,
      observacoes: req.body.observacoes,
      ativo: req.body.ativo,
    };

    // Remover campos undefined
    Object.keys(camposPermitidos).forEach(
      (key) =>
        camposPermitidos[key] === undefined && delete camposPermitidos[key]
    );

    cliente = await Cliente.findByIdAndUpdate(req.params.id, camposPermitidos, {
      new: true,
      runValidators: true,
    });

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.UPDATE,
      entidade: "Cliente",
      entidadeId: cliente._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar cliente (soft delete)
// @route   DELETE /api/clientes/:id
// @access  Private
exports.deletarCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar permissão
    if (
      req.user.role === ROLES.USUARIO &&
      cliente.responsavel.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    // Soft delete
    cliente.ativo = false;
    await cliente.save();

    // Se tiver usuário vinculado, desativar também
    if (cliente.usuario) {
      await User.findByIdAndUpdate(cliente.usuario, { ativo: false });
    }

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.DELETE,
      entidade: "Cliente",
      entidadeId: cliente._id,
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
// @desc    Atualizar acesso do cliente (senha)
// @route   PUT /api/clientes/:id/acesso
// @access  Private
exports.atualizarAcesso = async (req, res, next) => {
  try {
    const { senha } = req.body;
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Verificar permissão
    if (
      req.user.role === ROLES.USUARIO &&
      cliente.responsavel.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    if (!cliente.usuario) {
      // Se não tiver usuário, verificar se já existe usuário com este email
      let usuario = await User.findOne({ email: cliente.email });

      if (usuario) {
        // Se existe, vincular
        cliente.usuario = usuario._id;
        await cliente.save();
      } else {
        // Se não existe, criar novo usuário
        usuario = await User.create({
          nome: cliente.nome,
          email: cliente.email,
          senha: senha, // Usa a senha fornecida
          role: ROLES.CLIENTE,
          empresa: cliente.empresaDona, // Importante: usar a empresa dona do cliente
          responsavel: cliente.responsavel, // Importante: definir o responsável
          telefone: cliente.telefone,
          cpfCnpj: cliente.cpfCnpj,
          criadoPor: req.user.id,
          ativo: true
        });

        cliente.usuario = usuario._id;
        await cliente.save();

        // Log da criação automática
        await Log.create({
          usuario: req.user.id,
          acao: ACOES_LOG.CREATE,
          entidade: "User",
          entidadeId: usuario._id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          detalhes: new Map([["acao", "criacao_automatica_acesso"]]),
        });

        return res.status(200).json({
          success: true,
          message: "Acesso criado e senha definida com sucesso",
        });
      }
    }

    const usuario = await User.findById(cliente.usuario);
    if (!usuario) {
      // Caso raro onde o ID existe no cliente mas o usuário foi deletado
      // Recriar usuário
       let novoUsuario = await User.create({
          nome: cliente.nome,
          email: cliente.email,
          senha: senha,
          role: ROLES.CLIENTE,
          empresa: cliente.empresaDona,
          responsavel: cliente.responsavel,
          telefone: cliente.telefone,
          cpfCnpj: cliente.cpfCnpj,
          criadoPor: req.user.id,
          ativo: true
        });

        cliente.usuario = novoUsuario._id;
        await cliente.save();

        return res.status(200).json({
          success: true,
          message: "Acesso recriado e senha definida com sucesso",
        });
    }

    // Atualizar senha
    usuario.senha = senha;
    await usuario.save();

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.UPDATE,
      entidade: "User",
      entidadeId: usuario._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      detalhes: new Map([["acao", "alteracao_senha_cliente"]]),
    });

    res.status(200).json({
      success: true,
      message: "Senha de acesso atualizada com sucesso",
    });
  } catch (error) {
    next(error);
  }
};
