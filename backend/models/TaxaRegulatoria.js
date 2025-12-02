// backend/models/TaxaRegulatoria.js
const mongoose = require("mongoose");

// Tipos de taxas regulatórias
const TIPOS_TAXA = {
  CVM_ANUAL: "cvm_anual",
  CVM_REGISTRO: "cvm_registro",
  CVM_OFERTA: "cvm_oferta",
  ANBIMA_REGISTRO: "anbima_registro",
  ANBIMA_OFERTA: "anbima_oferta",
};

// Periodicidades
const PERIODICIDADE = {
  UNICA: "unica",
  MENSAL: "mensal",
  ANUAL: "anual",
  POR_OFERTA: "por_oferta",
};

// Tipos de cálculo
const TIPO_CALCULO = {
  VALOR_FIXO: "valor_fixo",
  PERCENTUAL: "percentual",
  FAIXAS_PL: "faixas_pl",
  PERCENTUAL_COM_MINIMO: "percentual_com_minimo",
};

const TaxaRegulatoriaSchema = new mongoose.Schema(
  {
    // Multi-tenant
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: [true, "Empresa é obrigatória"],
      index: true,
    },

    // Identificação da taxa
    tipo: {
      type: String,
      required: [true, "Tipo de taxa é obrigatório"],
      enum: Object.values(TIPOS_TAXA),
      index: true,
    },

    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },

    descricao: {
      type: String,
      trim: true,
      maxlength: [500, "Descrição não pode ter mais de 500 caracteres"],
    },

    // Configurações de cálculo
    tipoCalculo: {
      type: String,
      required: [true, "Tipo de cálculo é obrigatório"],
      enum: Object.values(TIPO_CALCULO),
    },

    periodicidade: {
      type: String,
      required: [true, "Periodicidade é obrigatória"],
      enum: Object.values(PERIODICIDADE),
    },

    // Valores (depende do tipo de cálculo)
    valorFixo: {
      type: Number,
      default: 0,
    },

    percentual: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    valorMinimo: {
      type: Number,
      default: 0,
    },

    valorMaximo: {
      type: Number,
      default: 0,
    },

    // Faixas de PL (para CVM Anual)
    faixas: [
      {
        plMinimo: {
          type: Number,
          required: true,
        },
        plMaximo: {
          type: Number,
          required: true,
        },
        aliquota: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],

    // Mês de cobrança (para taxas anuais)
    mesCobranca: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },

    // Aplicabilidade
    aplicavelA: {
      type: [String],
      enum: ["FII", "FIP", "FIDC", "FIA", "FIP-IE"],
      default: ["FII"],
    },

    // Observações e regulamentação
    fundamentoLegal: {
      type: String,
      trim: true,
      maxlength: [500, "Fundamento legal não pode ter mais de 500 caracteres"],
    },

    observacoes: {
      type: String,
      trim: true,
      maxlength: [1000, "Observações não podem ter mais de 1000 caracteres"],
    },

    // Controle
    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Indica se é uma taxa padrão do sistema (não pode ser deletada)
    isPadrao: {
      type: Boolean,
      default: false,
    },

    // Auditoria
    dataCriacao: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    dataAtualizacao: {
      type: Date,
      default: Date.now,
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    atualizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para performance
TaxaRegulatoriaSchema.index({ empresa: 1, tipo: 1 });
TaxaRegulatoriaSchema.index({ empresa: 1, ativo: 1 });

// Atualizar dataAtualizacao antes de salvar
TaxaRegulatoriaSchema.pre("save", function (next) {
  this.dataAtualizacao = Date.now();
  next();
});

// Exportar constantes junto com o modelo
TaxaRegulatoriaSchema.statics.TIPOS_TAXA = TIPOS_TAXA;
TaxaRegulatoriaSchema.statics.PERIODICIDADE = PERIODICIDADE;
TaxaRegulatoriaSchema.statics.TIPO_CALCULO = TIPO_CALCULO;

// Método para calcular valor da taxa
TaxaRegulatoriaSchema.methods.calcularValor = function ({
  pl = 0,
  valorOferta = 0,
  parcelas = 1,
}) {
  let valorCalculado = 0;

  switch (this.tipoCalculo) {
    case TIPO_CALCULO.VALOR_FIXO:
      valorCalculado = this.valorFixo;
      break;

    case TIPO_CALCULO.PERCENTUAL:
      // Geralmente aplica sobre o valor da oferta
      valorCalculado = valorOferta * (this.percentual / 100);
      break;

    case TIPO_CALCULO.PERCENTUAL_COM_MINIMO:
      const valorBase = valorOferta * (this.percentual / 100);
      valorCalculado = Math.max(valorBase, this.valorMinimo);
      break;

    case TIPO_CALCULO.FAIXAS_PL:
      if (this.faixas && this.faixas.length > 0) {
        // Encontrar faixa correspondente
        const faixa = this.faixas.find(
          (f) => pl >= f.plMinimo && pl <= f.plMaximo
        );

        if (faixa) {
          valorCalculado = pl * (faixa.aliquota / 100);
        } else {
          // Se não encontrou faixa exata, verifica se está acima da última
          const ultimaFaixa = this.faixas[this.faixas.length - 1];
          if (pl > ultimaFaixa.plMaximo) {
            valorCalculado = pl * (ultimaFaixa.aliquota / 100);
          }
        }
      }
      break;

    default:
      valorCalculado = 0;
  }

  // Aplicar limites globais se definidos (exceto para faixas que tem lógica própria geralmente, mas vamos aplicar se houver)
  if (this.valorMinimo > 0 && this.tipoCalculo !== TIPO_CALCULO.PERCENTUAL_COM_MINIMO) {
    valorCalculado = Math.max(valorCalculado, this.valorMinimo);
  }

  if (this.valorMaximo > 0) {
    valorCalculado = Math.min(valorCalculado, this.valorMaximo);
  }

  return valorCalculado;
};

module.exports = mongoose.model("TaxaRegulatoria", TaxaRegulatoriaSchema);
