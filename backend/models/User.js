// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { ROLES } = require("../config/roles");
const config = require("../config/config");

const UserSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },

    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Email inválido"],
    },

    senha: {
      type: String,
      required: [true, "Senha é obrigatória"],
      minlength: [6, "Senha deve ter no mínimo 6 caracteres"],
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USUARIO,
      required: true,
      index: true, // Apenas index simples, não unique
    },

    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: function () {
        return this.role === ROLES.ADMIN || this.role === ROLES.USUARIO;
      },
      index: true,
    },

    telefone: {
      type: String,
      trim: true,
      maxlength: [20, "Telefone não pode ter mais de 20 caracteres"],
    },

    avatar: {
      type: String,
      default: null,
    },

    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },

    ultimoAcesso: {
      type: Date,
      default: Date.now,
    },

    dataCriacao: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cpfCnpj: {
      type: String,
      sparse: true,
      trim: true,
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

    responsavel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.role === ROLES.CLIENTE;
      },
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Removi os índices duplicados - unique: true já cria índice automaticamente

// Virtual para simulações
UserSchema.virtual("simulacoes", {
  ref: "Simulacao",
  localField: "_id",
  foreignField: "cliente",
  justOne: false,
});

// Hash da senha antes de salvar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método para comparar senha
UserSchema.methods.compararSenha = async function (senhaInformada) {
  return await bcrypt.compare(senhaInformada, this.senha);
};

// Método para gerar JWT token
UserSchema.methods.gerarToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

// Método para obter dados públicos
UserSchema.methods.getDadosPublicos = function () {
  return {
    id: this._id,
    nome: this.nome,
    email: this.email,
    role: this.role,
    telefone: this.telefone,
    avatar: this.avatar,
    ativo: this.ativo,
    empresa: this.empresa,
  };
};

module.exports = mongoose.model("User", UserSchema);
