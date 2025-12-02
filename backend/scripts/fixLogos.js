// backend/scripts/fixLogos.js
const mongoose = require("mongoose");
const Empresa = require("../models/Empresa");
const fs = require("fs");
const path = require("path");

// String de conexão direta
const MONGO_URI = "mongodb://localhost:27017/simulador_fundos";

async function fixLogos() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB");

    const empresaId = "68e19aeea0ffc87b336571b3";
    const empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      console.error("❌ Empresa não encontrada");
      process.exit(1);
    }

    console.log("📦 Empresa:", empresa.nome);

    const logosPath = path.join(
      __dirname,
      "..",
      "uploads",
      "logos",
      `empresa-${empresaId}`
    );

    if (!fs.existsSync(logosPath)) {
      console.error("❌ Pasta de logos não existe:", logosPath);
      process.exit(1);
    }

    const files = fs.readdirSync(logosPath);
    console.log("📁 Arquivos encontrados:", files);

    if (!empresa.configuracoes) {
      empresa.configuracoes = {};
    }

    const logoClaro = files.find((f) => f.startsWith("logo-claro"));
    const logoEscuro = files.find((f) => f.startsWith("logo-escuro"));

    if (logoClaro) {
      empresa.configuracoes.logoClaro = `/uploads/logos/empresa-${empresaId}/${logoClaro}`;
      console.log("✅ Logo Claro:", empresa.configuracoes.logoClaro);
    } else {
      console.log("⚠️ Logo claro não encontrado");
    }

    if (logoEscuro) {
      empresa.configuracoes.logoEscuro = `/uploads/logos/empresa-${empresaId}/${logoEscuro}`;
      console.log("✅ Logo Escuro:", empresa.configuracoes.logoEscuro);
    } else {
      console.log("⚠️ Logo escuro não encontrado");
    }

    // Marcar como modificado
    empresa.markModified("configuracoes");

    await empresa.save();
    console.log("💾 Salvo no banco!");

    // Verificar
    const check = await Empresa.findById(empresaId);
    console.log("🔍 Verificação:");
    console.log("   Logo Claro:", check.configuracoes?.logoClaro);
    console.log("   Logo Escuro:", check.configuracoes?.logoEscuro);

    await mongoose.connection.close();
    console.log("✅ Concluído!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

fixLogos();
