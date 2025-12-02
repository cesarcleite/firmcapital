// backend/models/TipoFundo.js
const mongoose = require("mongoose");
const { TIPOS_FUNDO_CODIGO } = require("../config/constants");

const TipoFundoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },

    codigo: {
      type: String,
      required: [true, "Código é obrigatório"],
      unique: true,
      uppercase: true,
      trim: true,
      enum: Object.values(TIPOS_FUNDO_CODIGO),
    },

    descricao: {
      type: String,
      trim: true,
      maxlength: [500, "Descrição não pode ter mais de 500 caracteres"],
    },

    icone: {
      type: String,
      default: "fas fa-chart-line",
    },

    cor: {
      type: String,
      default: "#c5a47e",
    },

    camposFormulario: [
      {
        nome: {
          type: String,
          required: true,
          trim: true,
        },
        label: {
          type: String,
          required: true,
          trim: true,
        },
        tipo: {
          type: String,
          required: true,
          enum: [
            "text",
            "number",
            "currency",
            "percent",
            "date",
            "select",
            "checkbox",
            "textarea",
          ],
        },
        obrigatorio: {
          type: Boolean,
          default: false,
        },
        valorPadrao: mongoose.Schema.Types.Mixed,
        opcoes: [String],
        placeholder: String,
        ajuda: String,
        validacao: {
          min: Number,
          max: Number,
          regex: String,
        },
        ordem: {
          type: Number,
          default: 0,
        },
        grupo: String,
      },
    ],

    parametrosDefault: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    configuracoes: {
      permiteVenda: {
        type: Boolean,
        default: true,
      },
      permiteCorrecao: {
        type: Boolean,
        default: true,
      },
      requerImovel: {
        type: Boolean,
        default: false,
      },
      requerCaixa: {
        type: Boolean,
        default: false,
      },
      calculaTIR: {
        type: Boolean,
        default: true,
      },
      calculaROE: {
        type: Boolean,
        default: true,
      },
      calculaDY: {
        type: Boolean,
        default: true,
      },
    },

    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },

    ordem: {
      type: Number,
      default: 0,
      index: true,
    },

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
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Atualizar dataAtualizacao
TipoFundoSchema.pre("save", function (next) {
  this.dataAtualizacao = Date.now();
  next();
});

module.exports = mongoose.model("TipoFundo", TipoFundoSchema);
