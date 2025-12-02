// backend/models/Log.js
const mongoose = require("mongoose");
const { ACOES_LOG } = require("../config/constants");

const LogSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    acao: {
      type: String,
      required: true,
      enum: Object.values(ACOES_LOG),
    },

    entidade: {
      type: String,
      required: true,
      enum: ["User", "Cliente", "Simulacao", "TipoFundo", "Empresa"],
    },

    entidadeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    ip: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    detalhes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      expires: 7776000, // 90 dias (logs expiram automaticamente)
    },
  },
  {
    timestamps: false,
  }
);

// Índices
LogSchema.index({ usuario: 1, timestamp: -1 });
LogSchema.index({ entidade: 1, entidadeId: 1 });
LogSchema.index({ timestamp: -1 });
LogSchema.index({ acao: 1 });

module.exports = mongoose.model("Log", LogSchema);
