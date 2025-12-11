// backend/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
// const rateLimit = require("express-rate-limit"); // DESABILITADO - rate limiting removido
const morgan = require("morgan");
const path = require("path");

const config = require("./config/config");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Importar rotas

const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const clientesRoutes = require("./routes/clientes");
const simulacoesRoutes = require("./routes/simulacoes");
const tiposFundosRoutes = require("./routes/tiposFundos");
const adminRoutes = require("./routes/admin");
const empresaRoutes = require("./routes/empresa");
const taxasRegulatoriasRoutes = require("./routes/taxasRegulatorias");

// Conectar ao banco de dados
connectDB();

// Inicializar Express
const app = express();

// Middlewares de segurança
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // ADICIONADO para permitir imagens
  })
);
app.use(mongoSanitize());

// CORS - Configuração explícita para desenvolvimento
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://app.firmcapital.com.br",
      ...config.corsAllowedOrigins,
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("❌ CORS bloqueado para origin:", origin);
      callback(null, true); // Em dev, permite mesmo assim
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// SERVIR ARQUIVOS ESTÁTICOS - Com headers CORS corretos
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Logger (apenas em desenvolvimento)
if (config.isDev) {
  app.use(morgan("dev"));
}

// Rate limiting - DESABILITADO conforme solicitação do usuário
// O rate limiting estava bloqueando requisições com "Muitas requisições deste IP"
// Removido para permitir requisições ilimitadas
/*
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Muitas requisições deste IP, tente novamente mais tarde.",
      retryAfter: Math.ceil(config.rateLimitWindowMs / 60000) // em minutos
    });
  }
});

app.use("/api/", limiter);
*/


// Rota de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API está funcionando",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/simulacoes", simulacoesRoutes);
app.use("/api/tipos-fundos", tiposFundosRoutes);
app.use("/api/taxas-regulatorias", taxasRegulatoriasRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/empresa", empresaRoutes);

// Rota 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
  });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════════════╗");
  console.log(`🚀 Servidor rodando em modo ${config.nodeEnv.toUpperCase()}`);
  console.log(`📡 URL: ${config.baseUrl}`);
  console.log(`🔌 Porta: ${PORT}`);
  console.log(`🌐 CORS permitido para: localhost:5500, 127.0.0.1:5500`);
  console.log(`📁 Uploads servidos em: /uploads`);
  console.log("╚════════════════════════════════════════════════╝");
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (err) => {
  console.error("❌ ERRO NÃO TRATADO (Unhandled Rejection):");
  console.error(err);

  // Fechar servidor e processo
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("❌ ERRO NÃO CAPTURADO (Uncaught Exception):");
  console.error(err);

  // Fechar servidor e processo
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM recebido. Encerrando servidor gracefully...");
  server.close(() => {
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
});

module.exports = app;
