// backend/controllers/empresaController.js
const Empresa = require("../models/Empresa");
const { popularTaxas } = require("../seeds/taxasDefault");
const path = require("path");
const fs = require("fs");
const Log = require("../models/Log");
const { ACOES_LOG } = require("../config/constants");

// @desc    Criar nova empresa
// @route   POST /api/admin/empresa
// @access  Private (SuperAdmin)
exports.createEmpresa = async (req, res) => {
  try {
    console.log("\n🆕 ========== CRIAR EMPRESA ==========");

    const { nome, nomeFantasia, cnpj, email, telefone, site, endereco, plano } =
      req.body;

    // Verificar se CNPJ já existe
    const empresaExistente = await Empresa.findOne({ cnpj });
    if (empresaExistente) {
      return res.status(400).json({
        success: false,
        error: "CNPJ já cadastrado",
      });
    }

    // Criar empresa
    const empresa = await Empresa.create({
      nome,
      nomeFantasia,
      cnpj,
      email,
      telefone,
      site,
      endereco,
      plano: plano || "basico",
      ativo: true,
    });

    console.log(`✅ Empresa criada: ${empresa.nome} (ID: ${empresa._id})`);

    // Popular taxas regulatórias automaticamente
    try {
      console.log("📊 Criando taxas regulatórias padrão...");
      await popularTaxas(empresa._id, req.user.id);
      console.log("✅ Taxas padrão criadas com sucesso!");
    } catch (taxaError) {
      console.error("⚠️ Erro ao criar taxas padrão:", taxaError.message);
      // Não falha a criação da empresa
    }

    // Log da ação
    await Log.create({
      usuario: req.user.id,
      acao: ACOES_LOG.EMPRESA_CRIADA,
      entidade: "Empresa",
      entidadeId: empresa._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    console.log("🆕 =====================================\n");

    res.status(201).json({
      success: true,
      data: empresa,
      message: "Empresa criada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao criar empresa:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao criar empresa",
    });
  }
};

// @desc    Obter configurações da empresa
// @route   GET /api/admin/empresa
// @access  Private (Admin)
exports.getEmpresa = async (req, res) => {
  try {
    const empresaId = req.user.empresa;
    let empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    console.log(`[GET Empresa] ID: ${empresaId}, Nome: ${empresa.nome}`);

    res.status(200).json({
      success: true,
      data: empresa,
    });
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar configurações da empresa",
    });
  }
};

// @desc    Atualizar configurações da empresa
// @route   PUT /api/admin/empresa
// @access  Private (Admin)
exports.updateEmpresa = async (req, res) => {
  try {
    console.log("\n🔴 ========== REQUEST RECEBIDO ==========");
    console.log("📦 Body completo:", JSON.stringify(req.body, null, 2));
    console.log("🔴 ====================================\n");

    const {
      nome,
      nomeFantasia,
      cnpj,
      email,
      telefone,
      site,
      endereco,
      configuracoes,
    } = req.body;

    const empresaId = req.user.empresa;
    let empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    console.log("\n🔵 ========== UPDATE EMPRESA ==========");
    console.log(
      "📋 Configurações ANTES:",
      JSON.stringify(empresa.configuracoes, null, 2)
    );

    // Atualizar campos simples
    if (nome) empresa.nome = nome;
    if (nomeFantasia) empresa.nomeFantasia = nomeFantasia;
    if (cnpj) empresa.cnpj = cnpj;
    if (email) empresa.email = email;
    if (telefone) empresa.telefone = telefone;
    if (site) empresa.site = site;

    // Atualizar endereço
    if (endereco) {
      empresa.endereco = { ...empresa.endereco, ...endereco };
      empresa.markModified("endereco");
    }

    // Atualizar configurações PRESERVANDO LOGOS
    if (configuracoes) {
      if (!empresa.configuracoes) {
        empresa.configuracoes = {};
      }

      // PRESERVAR logos existentes
      const logoClaroExistente = empresa.configuracoes.logoClaro;
      const logoEscuroExistente = empresa.configuracoes.logoEscuro;

      console.log("💾 Preservando logos:");
      console.log("   logoClaro:", logoClaroExistente);
      console.log("   logoEscuro:", logoEscuroExistente);

      empresa.configuracoes = {
        ...empresa.configuracoes,
        ...configuracoes,
        // SEMPRE manter os logos existentes (não sobrescrever)
        logoClaro: logoClaroExistente,
        logoEscuro: logoEscuroExistente,
        coresPersonalizadas: {
          ...empresa.configuracoes.coresPersonalizadas,
          ...(configuracoes.coresPersonalizadas || {}),
        },
      };

      empresa.markModified("configuracoes");
    }

    console.log(
      "📋 Configurações DEPOIS:",
      JSON.stringify(empresa.configuracoes, null, 2)
    );

    await empresa.save();

    console.log("✅ Empresa atualizada com sucesso");
    console.log("🔵 =====================================\n");

    res.status(200).json({
      success: true,
      data: empresa,
    });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao atualizar empresa",
    });
  }
};

// @desc    Upload de logo - MULTI-TENANT COM DEBUG
// @route   POST /api/admin/empresa/upload-logo
// @access  Private (Admin)
exports.uploadLogo = async (req, res) => {
  try {
    console.log("\n🔵 ========== UPLOAD INICIADO ==========");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Nenhum arquivo foi enviado",
      });
    }

    const tipo = req.body.tipo;
    console.log("📥 Tipo recebido:", tipo);
    console.log("📄 Arquivo:", req.file.filename);

    if (!tipo) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Parâmetro 'tipo' não foi enviado",
      });
    }

    if (!["claro", "escuro"].includes(tipo)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Tipo inválido. Use "claro" ou "escuro"',
      });
    }

    const empresaId = req.user.empresa.toString();
    console.log("🏢 Empresa ID:", empresaId);

    let empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    console.log("✅ Empresa encontrada:", empresa.nome);
    console.log(
      "📋 Configurações ANTES:",
      JSON.stringify(empresa.configuracoes, null, 2)
    );

    // Renomear arquivo
    const ext = path.extname(req.file.filename);
    const finalFilename = `logo-${tipo}${ext}`;
    const finalPath = path.join(path.dirname(req.file.path), finalFilename);

    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
      console.log("🗑️ Arquivo antigo deletado");
    }

    fs.renameSync(req.file.path, finalPath);
    console.log("✅ Arquivo renomeado para:", finalFilename);

    // Caminho relativo
    const relativePath = `/uploads/logos/empresa-${empresaId}/${finalFilename}`;
    console.log("📂 Path a salvar:", relativePath);

    // Garantir que configuracoes existe
    if (!empresa.configuracoes) {
      console.log("⚠️ Criando objeto configuracoes (estava undefined)");
      empresa.configuracoes = {};
    }

    // MÉTODO 1: Atribuição direta
    if (tipo === "claro") {
      empresa.configuracoes.logoClaro = relativePath;
      console.log("✏️ logoClaro definido:", empresa.configuracoes.logoClaro);
    } else {
      empresa.configuracoes.logoEscuro = relativePath;
      console.log("✏️ logoEscuro definido:", empresa.configuracoes.logoEscuro);
    }

    console.log(
      "📋 Configurações DEPOIS da atribuição:",
      JSON.stringify(empresa.configuracoes, null, 2)
    );

    // CRÍTICO: Marcar como modificado
    empresa.markModified("configuracoes");
    console.log("✅ markModified chamado");

    // Verificar se está modificado
    console.log("🔍 Campos modificados:", empresa.modifiedPaths());

    // Salvar
    console.log("💾 Tentando salvar...");
    const savedEmpresa = await empresa.save();
    console.log("✅ Save executado com sucesso");
    console.log(
      "📋 Configurações do objeto salvo:",
      JSON.stringify(savedEmpresa.configuracoes, null, 2)
    );

    // VERIFICAÇÃO: Buscar novamente do banco
    console.log("🔍 Verificando no banco...");
    const verificacao = await Empresa.findById(empresaId);
    const pathNoBanco =
      tipo === "claro"
        ? verificacao.configuracoes?.logoClaro
        : verificacao.configuracoes?.logoEscuro;

    console.log("📊 Path no banco após save:", pathNoBanco);

    if (pathNoBanco !== relativePath) {
      console.error("❌ ERRO CRÍTICO: Path não foi persistido!");
      console.error("   Esperado:", relativePath);
      console.error("   No banco:", pathNoBanco);
      throw new Error("Falha ao persistir logo no banco de dados");
    }

    console.log("🎉 Upload completo com sucesso!");
    console.log("🔵 ========================================\n");

    res.status(200).json({
      success: true,
      data: {
        filename: finalFilename,
        path: relativePath,
        tipo: tipo,
      },
    });
  } catch (error) {
    console.error("❌ ERRO NO UPLOAD:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || "Erro ao fazer upload do logo",
    });
  }
};

// @desc    Deletar logo - MULTI-TENANT
// @route   DELETE /api/admin/empresa/logo/:tipo
// @access  Private (Admin)
exports.deleteLogo = async (req, res) => {
  try {
    const tipo = req.params.tipo;

    if (!["claro", "escuro"].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: "Tipo inválido",
      });
    }

    const empresaId = req.user.empresa;
    let empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    const logoPath =
      tipo === "claro"
        ? empresa.configuracoes?.logoClaro
        : empresa.configuracoes?.logoEscuro;

    if (logoPath) {
      // Construir caminho absoluto
      const fullPath = path.join(__dirname, "..", logoPath.replace(/^\//, ""));

      // Deletar arquivo se existir
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`[DELETE] Logo ${tipo} deletado: ${fullPath}`);
      }

      // Remover do banco
      if (!empresa.configuracoes) {
        empresa.configuracoes = {};
      }

      if (tipo === "claro") {
        empresa.configuracoes.logoClaro = null;
      } else {
        empresa.configuracoes.logoEscuro = null;
      }

      empresa.markModified("configuracoes");
      await empresa.save();
    }

    res.status(200).json({
      success: true,
      message: "Logo removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar logo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar logo",
    });
  }
};

// @desc    Resetar configurações
// @route   POST /api/admin/empresa/reset
// @access  Private (Admin)
exports.resetConfiguracoes = async (req, res) => {
  try {
    const empresaId = req.user.empresa;
    let empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    if (!empresa.configuracoes) {
      empresa.configuracoes = {};
    }

    empresa.configuracoes.coresPersonalizadas = {
      primaria: "#2d2d2d",
      secundaria: "#c5a47e",
      fundo: "#f4f1ea",
    };

    empresa.markModified("configuracoes");
    await empresa.save();

    console.log(`[RESET] Configurações resetadas para empresa ${empresaId}`);

    res.status(200).json({
      success: true,
      data: empresa,
    });
  } catch (error) {
    console.error("Erro ao resetar configurações:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao resetar configurações",
    });
  }
};
