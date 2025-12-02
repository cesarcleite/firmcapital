// backend/scripts/seedTiposFundos.js
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const TipoFundo = require("../models/TipoFundo");
const { TIPOS_FUNDO_CODIGO } = require("../config/constants");

const tiposFundos = [
  {
    nome: "Fundo de Investimento Imobiliário",
    codigo: TIPOS_FUNDO_CODIGO.FII,
    descricao:
      "Fundos que investem em empreendimentos imobiliários, como edifícios comerciais, shoppings, hospitais, entre outros.",
    icone: "fas fa-building",
    cor: "#c5a47e",
    camposFormulario: [
      {
        nome: "valorImovel",
        label: "Valor do Imóvel",
        tipo: "currency",
        obrigatorio: true,
        valorPadrao: 100000000,
        grupo: "basico",
        ordem: 1,
      },
      {
        nome: "valorCaixa",
        label: "Valor em Caixa",
        tipo: "currency",
        obrigatorio: false,
        valorPadrao: 0,
        grupo: "basico",
        ordem: 2,
      },
      {
        nome: "aluguelInicial",
        label: "Aluguel Mensal Inicial",
        tipo: "currency",
        obrigatorio: true,
        valorPadrao: 1000000,
        grupo: "basico",
        ordem: 3,
      },
      {
        nome: "duracao",
        label: "Duração (Meses)",
        tipo: "number",
        obrigatorio: true,
        valorPadrao: 240,
        validacao: { min: 1, max: 600 },
        grupo: "basico",
        ordem: 4,
      },
      {
        nome: "ipcaAnual",
        label: "IPCA Anual (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 4.5,
        grupo: "basico",
        ordem: 5,
      },
      {
        nome: "taxaAdmin",
        label: "Taxa Administração Anual (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 0.2,
        grupo: "custos",
        ordem: 1,
      },
      {
        nome: "taxaGestao",
        label: "Taxa Gestão Anual (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 0.6,
        grupo: "custos",
        ordem: 2,
      },
      {
        nome: "irAluguelDireto",
        label: "IR sobre Aluguéis Direto (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 19.24,
        grupo: "custos",
        ordem: 3,
      },
      {
        nome: "irAluguelFII",
        label: "IR sobre Aluguéis FII (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 0,
        grupo: "custos",
        ordem: 4,
      },
    ],
    parametrosDefault: new Map([
      ["valorImovel", 100000000],
      ["valorCaixa", 0],
      ["aluguelInicial", 1000000],
      ["duracao", 240],
      ["ipcaAnual", 4.5],
      ["taxaAdmin", 0.2],
      ["taxaGestao", 0.6],
    ]),
    configuracoes: {
      permiteVenda: true,
      permiteCorrecao: true,
      requerImovel: true,
      requerCaixa: false,
      calculaTIR: true,
      calculaROE: true,
      calculaDY: true,
    },
    ordem: 1,
    ativo: true,
  },
  {
    nome: "Fundo de Investimento em Participações",
    codigo: TIPOS_FUNDO_CODIGO.FIP,
    descricao:
      "Fundos que investem em participações societárias em empresas de capital aberto ou fechado.",
    icone: "fas fa-chart-line",
    cor: "#2d2d2d",
    camposFormulario: [
      {
        nome: "valorInvestimento",
        label: "Valor do Investimento",
        tipo: "currency",
        obrigatorio: true,
        valorPadrao: 50000000,
        grupo: "basico",
        ordem: 1,
      },
      {
        nome: "duracao",
        label: "Duração (Meses)",
        tipo: "number",
        obrigatorio: true,
        valorPadrao: 120,
        grupo: "basico",
        ordem: 2,
      },
      {
        nome: "taxaAdmin",
        label: "Taxa Administração Anual (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 2.0,
        grupo: "custos",
        ordem: 1,
      },
    ],
    parametrosDefault: new Map([
      ["valorInvestimento", 50000000],
      ["duracao", 120],
      ["taxaAdmin", 2.0],
    ]),
    configuracoes: {
      permiteVenda: true,
      permiteCorrecao: true,
      requerImovel: false,
      requerCaixa: false,
      calculaTIR: true,
      calculaROE: true,
      calculaDY: false,
    },
    ordem: 2,
    ativo: true,
  },
  {
    nome: "Fundo de Investimento em Participações em Infraestrutura",
    codigo: TIPOS_FUNDO_CODIGO.FIP_IE,
    descricao:
      "Fundos que investem em participações societárias em projetos de infraestrutura nas áreas de energia, transporte, saneamento básico e irrigação.",
    icone: "fas fa-road",
    cor: "#6b6b6b",
    camposFormulario: [
      {
        nome: "valorProjeto",
        label: "Valor do Projeto",
        tipo: "currency",
        obrigatorio: true,
        valorPadrao: 200000000,
        grupo: "basico",
        ordem: 1,
      },
      {
        nome: "duracao",
        label: "Duração (Meses)",
        tipo: "number",
        obrigatorio: true,
        valorPadrao: 180,
        grupo: "basico",
        ordem: 2,
      },
      {
        nome: "taxaAdmin",
        label: "Taxa Administração Anual (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 1.0,
        grupo: "custos",
        ordem: 1,
      },
    ],
    parametrosDefault: new Map([
      ["valorProjeto", 200000000],
      ["duracao", 180],
      ["taxaAdmin", 1.0],
    ]),
    configuracoes: {
      permiteVenda: true,
      permiteCorrecao: true,
      requerImovel: false,
      requerCaixa: false,
      calculaTIR: true,
      calculaROE: true,
      calculaDY: true,
    },
    ordem: 3,
    ativo: true,
  },
  {
    nome: "Fundo de Investimento em Direitos Creditórios",
    codigo: TIPOS_FUNDO_CODIGO.FIDC,
    descricao:
      "Fundos que investem em direitos creditórios originados de operações realizadas nos segmentos financeiro, comercial, industrial, imobiliário, de hipotecas, de arrendamento mercantil e de prestação de serviços.",
    icone: "fas fa-file-invoice-dollar",
    cor: "#4a4a4a",
    camposFormulario: [
      {
        nome: "valorCarteira",
        label: "Valor da Carteira",
        tipo: "currency",
        obrigatorio: true,
        valorPadrao: 75000000,
        grupo: "basico",
        ordem: 1,
      },
      {
        nome: "duracao",
        label: "Duração (Meses)",
        tipo: "number",
        obrigatorio: true,
        valorPadrao: 60,
        grupo: "basico",
        ordem: 2,
      },
      {
        nome: "taxaAdmin",
        label: "Taxa Administração Anual (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 1.5,
        grupo: "custos",
        ordem: 1,
      },
    ],
    parametrosDefault: new Map([
      ["valorCarteira", 75000000],
      ["duracao", 60],
      ["taxaAdmin", 1.5],
    ]),
    configuracoes: {
      permiteVenda: false,
      permiteCorrecao: true,
      requerImovel: false,
      requerCaixa: false,
      calculaTIR: true,
      calculaROE: true,
      calculaDY: true,
    },
    ordem: 4,
    ativo: true,
  },
  {
    nome: "Fundo de Investimento em Ações",
    codigo: TIPOS_FUNDO_CODIGO.FIA,
    descricao:
      "Fundos que investem, no mínimo, 67% do patrimônio em ações negociadas em bolsa de valores ou mercado de balcão organizado.",
    icone: "fas fa-chart-area",
    cor: "#b69568",
    camposFormulario: [
      {
        nome: "valorInvestimento",
        label: "Valor do Investimento",
        tipo: "currency",
        obrigatorio: true,
        valorPadrao: 30000000,
        grupo: "basico",
        ordem: 1,
      },
      {
        nome: "duracao",
        label: "Duração (Meses)",
        tipo: "number",
        obrigatorio: true,
        valorPadrao: 36,
        grupo: "basico",
        ordem: 2,
      },
      {
        nome: "taxaAdmin",
        label: "Taxa Administração Anual (%)",
        tipo: "percent",
        obrigatorio: true,
        valorPadrao: 2.5,
        grupo: "custos",
        ordem: 1,
      },
    ],
    parametrosDefault: new Map([
      ["valorInvestimento", 30000000],
      ["duracao", 36],
      ["taxaAdmin", 2.5],
    ]),
    configuracoes: {
      permiteVenda: true,
      permiteCorrecao: false,
      requerImovel: false,
      requerCaixa: false,
      calculaTIR: true,
      calculaROE: true,
      calculaDY: false,
    },
    ordem: 5,
    ativo: true,
  },

];

const seedTiposFundos = async () => {
  try {
    console.log("🌱 Iniciando seed de tipos de fundos...");

    // Conectar ao banco
    await connectDB();

    // Limpar tipos de fundos existentes (opcional)
    // await TipoFundo.deleteMany({});

    // Inserir cada tipo de fundo
    for (const tipoFundo of tiposFundos) {
      const existe = await TipoFundo.findOne({ codigo: tipoFundo.codigo });

      if (!existe) {
        await TipoFundo.create(tipoFundo);
        console.log(
          `✅ Tipo de fundo criado: ${tipoFundo.nome} (${tipoFundo.codigo})`
        );
      } else {
        console.log(
          `ℹ️  Tipo de fundo já existe: ${tipoFundo.nome} (${tipoFundo.codigo})`
        );
      }
    }

    console.log("\n✅ Seed de tipos de fundos concluído!");
    console.log(`📊 Total de tipos cadastrados: ${tiposFundos.length}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  }
};

// Executar seed
seedTiposFundos();
