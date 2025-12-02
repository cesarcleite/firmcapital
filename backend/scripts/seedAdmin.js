// backend/scripts/seedAdmin.js
const mongoose = require("mongoose");
const config = require("../config/config");
const connectDB = require("../config/database");
const Empresa = require("../models/Empresa");
const User = require("../models/User");
const { ROLES } = require("../config/roles");
const { PLANOS } = require("../config/constants");

const seedAdmin = async () => {
  try {
    console.log("🌱 Iniciando seed de empresa e admin...");

    // Conectar ao banco
    await connectDB();

    // Verificar se já existe empresa
    let empresa = await Empresa.findOne();

    if (!empresa) {
      console.log("📦 Criando empresa padrão...");
      empresa = await Empresa.create({
        nome: config.defaultCompanyName,
        nomeFantasia: config.defaultCompanyName,
        cnpj: "00.000.000/0000-00", // CNPJ fictício para seed
        email: config.defaultAdminEmail,
        telefone: "(00) 0000-0000",
        plano: PLANOS.EMPRESARIAL,
        configuracoes: {
          permiteMultiplosUsuarios: true,
          limiteUsuarios: 100,
          limiteClientes: 1000,
          limiteSimulacoes: 10000,
          permiteExportacao: true,
          permiteCompartilhamento: true,
          coresPersonalizadas: {
            primaria: "#2d2d2d",
            secundaria: "#c5a47e",
            fundo: "#f4f1ea",
          },
        },
        ativo: true,
      });
      console.log("✅ Empresa criada:", empresa.nome);
    } else {
      console.log("ℹ️  Empresa já existe:", empresa.nome);
    }

    // Verificar se já existe admin
    const adminExistente = await User.findOne({
      email: config.defaultAdminEmail,
    });

    if (!adminExistente) {
      console.log("👤 Criando usuário admin...");
      const admin = await User.create({
        nome: config.defaultAdminName,
        email: config.defaultAdminEmail,
        senha: config.defaultAdminPassword,
        role: ROLES.ADMIN,
        empresa: empresa._id,
        telefone: "(00) 00000-0000",
        ativo: true,
      });
      console.log("✅ Admin criado:", admin.email);
      console.log("🔑 Email:", config.defaultAdminEmail);
      console.log("🔑 Senha:", config.defaultAdminPassword);
      console.log("⚠️  IMPORTANTE: Altere a senha após o primeiro login!");
    } else {
      console.log("ℹ️  Admin já existe:", adminExistente.email);
    }

    console.log("\n✅ Seed de empresa e admin concluído!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  }
};

// Executar seed
seedAdmin();
