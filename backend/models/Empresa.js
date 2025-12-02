// backend/models/Empresa.js
const mongoose = require("mongoose");
const validator = require("validator");
const { PLANOS } = require("../config/constants");

const EmpresaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },

    nomeFantasia: {
      type: String,
      trim: true,
      maxlength: [100, "Nome fantasia não pode ter mais de 100 caracteres"],
    },

    cnpj: {
      type: String,
      required: [true, "CNPJ é obrigatório"],
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Email inválido"],
    },

    telefone: {
      type: String,
      trim: true,
      maxlength: [20, "Telefone não pode ter mais de 20 caracteres"],
    },

    site: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return validator.isURL(v);
        },
        message: "URL inválida",
      },
    },

    // CAMPO ANTIGO - Manter para compatibilidade
    logo: {
      type: String,
      default: null,
    },

    endereco: {
      rua: { type: String, trim: true },
      numero: { type: String, trim: true },
      complemento: { type: String, trim: true },
      bairro: { type: String, trim: true },
      cidade: { type: String, trim: true },
      estado: { type: String, trim: true, maxlength: 2 },
      cep: { type: String, trim: true },
    },

    configuracoes: {
      // NOVOS CAMPOS DE LOGO
      logoClaro: {
        type: String,
        default: null,
      },
      logoEscuro: {
        type: String,
        default: null,
      },

      permiteMultiplosUsuarios: {
        type: Boolean,
        default: true,
      },
      limiteUsuarios: {
        type: Number,
        default: 10,
      },
      limiteClientes: {
        type: Number,
        default: 100,
      },
      limiteSimulacoes: {
        type: Number,
        default: 1000,
      },
      permiteExportacao: {
        type: Boolean,
        default: true,
      },
      permiteCompartilhamento: {
        type: Boolean,
        default: true,
      },
      coresPersonalizadas: {
        primaria: { type: String, default: "#2d2d2d" },
        secundaria: { type: String, default: "#c5a47e" },
        fundo: { type: String, default: "#f4f1ea" },
      },
    },

    plano: {
      type: String,
      enum: Object.values(PLANOS),
      default: PLANOS.BASICO,
    },

    ativo: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para usuários
EmpresaSchema.virtual("usuarios", {
  ref: "User",
  localField: "_id",
  foreignField: "empresa",
  justOne: false,
});

// Atualizar dataAtualizacao
EmpresaSchema.pre("save", function (next) {
  this.dataAtualizacao = Date.now();
  next();
});

module.exports = mongoose.model("Empresa", EmpresaSchema);
