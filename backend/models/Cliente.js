// backend/models/Cliente.js
const mongoose = require("mongoose");
const validator = require("validator");

const ClienteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },

    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Só valida se o email foi fornecido
          return !v || validator.isEmail(v);
        },
        message: "Email inválido"
      },
      sparse: true,
      index: true,
    },

    cpfCnpj: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true, // Permite múltiplos documentos sem CPF/CNPJ
    },

    telefone: {
      type: String,
      trim: true,
      maxlength: [20, "Telefone não pode ter mais de 20 caracteres"],
    },

    empresa: {
      type: String,
      trim: true,
      maxlength: [100, "Nome da empresa não pode ter mais de 100 caracteres"],
    },

    cargo: {
      type: String,
      trim: true,
      maxlength: [100, "Cargo não pode ter mais de 100 caracteres"],
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

    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    responsavel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Responsável é obrigatório"],
      index: true,
    },

    empresaDona: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: [true, "Empresa é obrigatória"],
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    observacoes: {
      type: String,
      maxlength: [1000, "Observações não podem ter mais de 1000 caracteres"],
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

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para simulações
ClienteSchema.virtual("simulacoes", {
  ref: "Simulacao",
  localField: "_id",
  foreignField: "cliente",
  justOne: false,
});

// Atualizar dataAtualizacao antes de salvar
ClienteSchema.pre("save", function (next) {
  this.dataAtualizacao = Date.now();
  next();
});

module.exports = mongoose.model("Cliente", ClienteSchema);
