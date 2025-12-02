// backend/config/config.js
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const os = require("os");

// Carregar o arquivo .env de várias localizações possíveis
const possibleEnvPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
];

let envPath = null;
let envLoaded = false;

// Verificar cada caminho possível
for (const potentialPath of possibleEnvPaths) {
  if (fs.existsSync(potentialPath)) {
    envPath = potentialPath;
    console.log(`[CONFIG] Arquivo .env encontrado em: ${envPath}`);

    // Carregar variáveis de ambiente
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      console.error(`[CONFIG] Erro ao carregar arquivo .env:`, result.error);
    } else {
      console.log(`[CONFIG] Arquivo .env carregado com sucesso`);
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded) {
  console.error(
    `[CONFIG] ERRO: Arquivo .env não encontrado em nenhum local esperado.`
  );
  console.error(`[CONFIG] Locais verificados:`, possibleEnvPaths);
  console.error(`[CONFIG] Usando valores padrão para configuração.`);
}

// Função para detectar automaticamente o ambiente
function detectEnvironment() {
  // Primeiro verificar se o ambiente foi explicitamente definido
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV === "production";
  }

  // Verificar se estamos em ambiente AWS/EC2 ou Railway/Render
  const isProduction =
    fs.existsSync("/sys/hypervisor/uuid") ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER ||
    (os.hostname() &&
      (os.hostname().includes("ec2") ||
        os.hostname().includes("ip-") ||
        os.hostname().includes("aws") ||
        os.hostname().includes("railway") ||
        os.hostname().includes("render")));

  console.log(
    `[CONFIG] Ambiente detectado automaticamente: ${
      isProduction ? "Produção" : "Desenvolvimento"
    }`
  );

  return isProduction;
}

// Determinar o ambiente atual
const isProduction = detectEnvironment();

// Construir a string de conexão MongoDB dinamicamente
function buildMongoURI() {
  // Se a string completa foi fornecida, usá-la
  if (process.env.MONGO_URI) {
    console.log("[CONFIG] Usando string de conexão MongoDB explícita do .env");
    return process.env.MONGO_URI;
  }

  // Componentes básicos
  const host = process.env.MONGO_HOST || "localhost";
  const port = process.env.MONGO_PORT || "27017";
  const database = process.env.MONGO_DATABASE || "simulador_fundos";

  // Selecionar credenciais com base no ambiente
  let user, password;

  if (isProduction) {
    user = process.env.MONGO_USER_PROD;
    password = process.env.MONGO_PASSWORD_PROD;
    console.log("[CONFIG] Usando credenciais de MongoDB para PRODUÇÃO");
  } else {
    user = process.env.MONGO_USER_DEV;
    password = process.env.MONGO_PASSWORD_DEV;
    console.log("[CONFIG] Usando credenciais de MongoDB para DESENVOLVIMENTO");
  }

  // Construir string com ou sem autenticação
  let uri;
  if (user && password) {
    const authSource = process.env.MONGO_AUTH_SOURCE || database;
    uri = `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
  } else {
    uri = `mongodb://${host}:${port}/${database}`;
  }

  // Exibir string (com senha oculta)
  const logUri = uri.replace(/:[^:]*@/, ":****@");
  console.log(`[CONFIG] String de conexão MongoDB gerada: ${logUri}`);

  return uri;
}

// Analisar origens CORS permitidas
function parseAllowedOrigins() {
  const originsString = process.env.CORS_ALLOWED_ORIGINS || "";
  const origins = originsString
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Adicionar padrões se não houver nenhum definido
  if (origins.length === 0) {
    return [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8080",
      "https://firmcapital.com",
      "https://www.firmcapital.com",
    ];
  }

  return origins;
}

// Determinar URLs base com base no ambiente
function getBaseUrls() {
  if (isProduction) {
    return {
      baseUrl: process.env.BASE_URL_PROD || "https://api.firmcapital.com",
      clientUrl: process.env.FRONTEND_URL_PROD || "https://firmcapital.com",
    };
  } else {
    return {
      baseUrl: process.env.BASE_URL_DEV || "http://localhost:5002",
      clientUrl: process.env.FRONTEND_URL_DEV || "http://localhost:3000",
    };
  }
}

// Obter URL pública do servidor (útil para desenvolvimento com ngrok)
function getPublicServerUrl() {
  if (isProduction) {
    return process.env.BASE_URL_PROD || "https://api.firmcapital.com";
  } else {
    return (
      process.env.PUBLIC_SERVER_URL ||
      process.env.BASE_URL_DEV ||
      "http://localhost:5002"
    );
  }
}

const urls = getBaseUrls();
const allowedOrigins = parseAllowedOrigins();

// Exportar configuração final
module.exports = {
  // Ambiente
  nodeEnv: isProduction ? "production" : "development",
  isProd: isProduction,
  isDev: !isProduction,

  // Servidor
  port: process.env.PORT || 5002,

  // MongoDB
  mongoURI: buildMongoURI(),

  // JWT
  jwtSecret:
    process.env.JWT_SECRET ||
    "sua_chave_secreta_super_segura_aqui_min_32_caracteres",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,

  // URLs
  baseUrl: urls.baseUrl,
  clientUrl: urls.clientUrl,
  publicServerUrl: getPublicServerUrl(),
  corsAllowedOrigins: allowedOrigins,

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000,

  // Upload
  uploadPath: "public/uploads",

  // Limites
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxSimulacoesPorUsuario: 100,
  maxClientesPorUsuario: 50,
  paginationDefault: 20,
  paginationMax: 100,

  // Email
  emailService: process.env.EMAIL_SERVICE,
  emailFrom: process.env.EMAIL_FROM || "noreply@firmcapital.com",
  emailFromName: process.env.EMAIL_FROM_NAME || "Firm Capital",

  // Brevo
  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSmtpHost: process.env.BREVO_SMTP_HOST,
  brevoSmtpPort: parseInt(process.env.BREVO_SMTP_PORT) || 587,
  brevoSmtpUser: process.env.BREVO_SMTP_USER,
  brevoSmtpPassword: process.env.BREVO_SMTP_PASSWORD,

  // Empresa Padrão
  defaultCompanyName: process.env.DEFAULT_COMPANY_NAME || "Firm Capital",
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@firmcapital.com",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123456",
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || "Administrador",
};
