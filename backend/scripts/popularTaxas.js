// backend/scripts/popularTaxas.js
const mongoose = require("mongoose");
const config = require("../config/config");
const Empresa = require("../models/Empresa");
const User = require("../models/User");
const { popularTaxas } = require("../seeds/taxasDefault");

// Conexão usando a string correta
mongoose.connect(config.mongoURI); // CORREÇÃO: mongoURI (maiúsculo)

async function executar() {
  try {
    console.log("🚀 Populando taxas regulatórias...\n");

    const empresas = await Empresa.find({});

    if (empresas.length === 0) {
      console.log("⚠️  Nenhuma empresa encontrada no banco de dados.");
      process.exit(0);
    }

    console.log(`📋 ${empresas.length} empresa(s) encontrada(s)\n`);

    for (const empresa of empresas) {
      console.log(`🏢 ${empresa.nome || empresa._id}`);

      const admin = await User.findOne({ empresa: empresa._id, role: "admin" });

      if (!admin) {
        console.log("⚠️  Sem admin. Pulando...\n");
        continue;
      }

      await popularTaxas(empresa._id, admin._id);
      console.log("");
    }

    console.log("✅ Concluído!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Aguardar conexão antes de executar
mongoose.connection.once("open", () => {
  console.log("✅ Conectado ao MongoDB\n");
  executar();
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Erro de conexão MongoDB:", err.message);
  process.exit(1);
});
