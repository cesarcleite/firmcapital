// backend/scripts/seedTaxas.js
const mongoose = require("mongoose");
const Empresa = require("../models/Empresa");
const User = require("../models/User");
const TaxaRegulatoria = require("../models/TaxaRegulatoria");

// Conectar ao banco
mongoose.connect("mongodb://localhost:27017/simulador_fundos", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TAXAS_PADRAO = [
  // CVM - Anual
  {
    tipo: "cvm_anual",
    nome: "Taxa CVM - Fiscalização Anual",
    descricao: "Taxa anual de fiscalização da CVM sobre o PL do fundo (vencimento em maio).",
    tipoCalculo: "faixas_pl",
    periodicidade: "anual",
    valorFixo: 0,
    percentual: 0,
    valorMinimo: 211.32,
    valorMaximo: 0,
    faixas: [
      { plMinimo: 0, plMaximo: 10000000, aliquota: 0.01 },
      { plMinimo: 10000001, plMaximo: 100000000, aliquota: 0.005 },
      { plMinimo: 100000001, plMaximo: 999999999999, aliquota: 0.0025 },
    ],
    mesCobranca: 5,
    aplicavelA: ["FII", "FIP", "FIDC", "FIA", "FIP-IE"],
    fundamentoLegal: "Lei nº 7.940/89, alterada pela Lei nº 14.317/22.",
    observacoes: "Valor mínimo: R$ 211,32. Vencimento: maio.",
    ativo: true,
    isPadrao: true,
  },
  // CVM - Registro
  {
    tipo: "cvm_registro",
    nome: "Taxa CVM - Registro Inicial",
    descricao: "Taxa única no registro inicial do fundo (prazo: 30 dias).",
    tipoCalculo: "valor_fixo",
    periodicidade: "unica",
    valorFixo: 211.32,
    percentual: 0,
    valorMinimo: 211.32,
    valorMaximo: 0,
    faixas: [],
    mesCobranca: null,
    aplicavelA: ["FII", "FIP", "FIDC", "FIA", "FIP-IE"],
    fundamentoLegal: "Lei nº 7.940/89, Anexos I, II e III.",
    observacoes: "Pagamento em até 30 dias do registro.",
    ativo: true,
    isPadrao: true,
  },
  // CVM - Oferta
  {
    tipo: "cvm_oferta",
    nome: "Taxa CVM - Oferta Pública",
    descricao: "Taxa sobre valor total da oferta pública de cotas.",
    tipoCalculo: "percentual_com_minimo",
    periodicidade: "por_oferta",
    valorFixo: 0,
    percentual: 0.03,
    valorMinimo: 809.16,
    valorMaximo: 0,
    faixas: [],
    mesCobranca: null,
    aplicavelA: ["FII", "FIP", "FIDC", "FIA", "FIP-IE"],
    fundamentoLegal: "Lei nº 7.940/89, Anexo IV. Resolução CVM 160.",
    observacoes: "Sem teto máximo. Mínimo para ofertas < R$ 2.697.200.",
    ativo: true,
    isPadrao: true,
  },
  // ANBIMA - Registro
  {
    tipo: "anbima_registro",
    nome: "Taxa ANBIMA - Registro de Fundo",
    descricao: "Taxa única de registro na ANBIMA (prazo: 15 dias do protocolo CVM).",
    tipoCalculo: "valor_fixo",
    periodicidade: "unica",
    valorFixo: 1206.45,
    percentual: 0,
    valorMinimo: 1206.45,
    valorMaximo: 0,
    faixas: [],
    mesCobranca: null,
    aplicavelA: ["FII", "FIP", "FIDC", "FIP-IE"],
    fundamentoLegal: "Código ANBIMA. Circular 2024-000043.",
    observacoes: "Valor com redução de 5% aplicada em 2025.",
    ativo: true,
    isPadrao: true,
  },
  // ANBIMA - Oferta
  {
    tipo: "anbima_oferta",
    nome: "Taxa ANBIMA - Oferta (Convênio CVM/ANBIMA)",
    descricao: "Taxa quando usa Convênio CVM/ANBIMA (substitui taxa CVM individual).",
    tipoCalculo: "percentual_com_minimo",
    periodicidade: "por_oferta",
    valorFixo: 0,
    percentual: 0.02,
    valorMinimo: 500.0,
    valorMaximo: 0,
    faixas: [],
    mesCobranca: null,
    aplicavelA: ["FII", "FIP", "FIDC", "FIP-IE"],
    fundamentoLegal: "Convênio CVM/ANBIMA. Resolução CVM 160.",
    observacoes: "Uso facultativo para FIIs.",
    ativo: true,
    isPadrao: true,
  },
];

async function seed() {
  try {
    console.log("🚀 Iniciando seed de taxas regulatórias...\n");

    const empresas = await Empresa.find({});
    console.log(`📋 Encontradas ${empresas.length} empresa(s)\n`);

    for (const empresa of empresas) {
      console.log(`\n🏢 Processando empresa: ${empresa.nome}`);

      const admin = await User.findOne({
        empresa: empresa._id,
        role: "admin",
      });

      if (!admin) {
        console.log(`⚠️  Nenhum admin encontrado para ${empresa.nome}. Pulando...`);
        continue;
      }

      // Para cada taxa padrão, verificar se existe e atualizar/criar
      for (const taxaPadrao of TAXAS_PADRAO) {
        const existingTaxa = await TaxaRegulatoria.findOne({
          empresa: empresa._id,
          tipo: taxaPadrao.tipo,
          isPadrao: true,
        });

        if (existingTaxa) {
          // Atualizar aplicavelA se necessário
          let updated = false;
          if (!existingTaxa.aplicavelA.includes("FIP-IE")) {
            existingTaxa.aplicavelA.push("FIP-IE");
            updated = true;
          }
          // Remover FI-INFRA se existir (opcional, mas bom para limpeza)
          if (existingTaxa.aplicavelA.includes("FI-INFRA")) {
             existingTaxa.aplicavelA = existingTaxa.aplicavelA.filter(t => t !== "FI-INFRA");
             updated = true;
          }

          if (updated) {
            await existingTaxa.save();
            console.log(`  ↻ Taxa ${taxaPadrao.nome} atualizada com FIP-IE`);
          } else {
            console.log(`  ✓ Taxa ${taxaPadrao.nome} já existe e está atualizada`);
          }
        } else {
          // Criar nova taxa
          await TaxaRegulatoria.create({
            ...taxaPadrao,
            empresa: empresa._id,
            criadoPor: admin._id,
          });
          console.log(`  + Taxa ${taxaPadrao.nome} criada`);
        }
      }
    }

    console.log("\n✅ Seed concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro durante seed:", error);
    process.exit(1);
  }
}

seed();
