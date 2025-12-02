// backend/models/Simulacao.js
const mongoose = require("mongoose");
const { STATUS_SIMULACAO } = require("../config/constants");
const crypto = require("crypto");

const SimulacaoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, "Título é obrigatório"],
      trim: true,
      maxlength: [200, "Título não pode ter mais de 200 caracteres"],
    },

    descricao: {
      type: String,
      trim: true,
      maxlength: [1000, "Descrição não pode ter mais de 1000 caracteres"],
    },

    tipoFundo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TipoFundo",
      required: [true, "Tipo de fundo é obrigatório"],
      index: true,
    },

    codigoTipoFundo: {
      type: String,
      required: [true, "Código do tipo de fundo é obrigatório"],
      uppercase: true,
    },

    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: [true, "Cliente é obrigatório"],
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Criador é obrigatório"],
    },

    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: [true, "Empresa é obrigatória"],
      index: true,
    },

    parametros: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    resultado: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    dadosDetalhados: {
      direto: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      fundo: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      comparativo: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
    },

    versao: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: Object.values(STATUS_SIMULACAO),
      default: STATUS_SIMULACAO.RASCUNHO,
      index: true,
    },

    favorita: {
      type: Boolean,
      default: false,
    },

    compartilhada: {
      type: Boolean,
      default: false,
    },

    linkCompartilhamento: {
      type: String,
      unique: true,
      sparse: true,
    },

    anexos: [
      {
        nome: String,
        url: String,
        tipo: String,
        tamanho: Number,
        dataUpload: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    dataCriacao: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    dataAtualizacao: {
      type: Date,
      default: Date.now,
    },

    visualizacoes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices compostos (esses são necessários para performance)
SimulacaoSchema.index({ cliente: 1, dataCriacao: -1 });
SimulacaoSchema.index({ criadoPor: 1, dataCriacao: -1 });

// Atualizar dataAtualizacao
SimulacaoSchema.pre("save", function (next) {
  this.dataAtualizacao = Date.now();
  next();
});

// Método para gerar link de compartilhamento
SimulacaoSchema.methods.gerarLinkCompartilhamento = function () {
  if (!this.linkCompartilhamento) {
    this.linkCompartilhamento = crypto.randomBytes(16).toString("hex");
  }
  return this.linkCompartilhamento;
};

// Método para incrementar visualizações
SimulacaoSchema.methods.incrementarVisualizacoes = async function () {
  this.visualizacoes += 1;
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model("Simulacao", SimulacaoSchema);
