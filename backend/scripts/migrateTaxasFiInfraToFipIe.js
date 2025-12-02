const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const TaxaRegulatoria = require("../models/TaxaRegulatoria");

// Carregar variáveis de ambiente
// dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/firm_capital");
    console.log("MongoDB conectado");
  } catch (error) {
    console.error("Erro ao conectar MongoDB:", error);
    process.exit(1);
  }
};

const migrateTaxas = async () => {
  try {
    await connectDB();

    console.log("Iniciando migração de taxas regulatórias...");

    // Listar todas as taxas
    const taxas = await TaxaRegulatoria.find({});
    console.log(`Encontradas ${taxas.length} taxas no total.`);

    for (const taxa of taxas) {
      console.log(`Taxa: ${taxa.nome}, Aplicável a: ${taxa.aplicavelA}`);
      
      // Se for uma taxa padrão (CVM, Anbima, B3), adicionar FIP-IE se não tiver
      if (taxa.aplicavelA.includes("FII") && !taxa.aplicavelA.includes("FIP-IE")) {
          taxa.aplicavelA.push("FIP-IE");
          await taxa.save();
          console.log(`-> Adicionado FIP-IE à taxa ${taxa.nome}`);
      }
    }

    console.log(`Migração concluída. ${updatedCount} taxas atualizadas.`);
    process.exit(0);
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  }
};

migrateTaxas();
