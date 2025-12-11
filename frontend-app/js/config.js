// frontend/js/config.js

// Configuração da API
const API_CONFIG = {
  // Detectar ambiente automaticamente
  BASE_URL:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:5002/api"
      : "https://app.firmcapital.com.br/api",

  TIMEOUT: 30000, // 30 segundos

  // Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    UPDATE_ME: "/auth/me",
    UPDATE_PASSWORD: "/auth/updatepassword",

    // Usuários
    USUARIOS: "/usuarios",

    // Clientes
    CLIENTES: "/clientes",

    // Simulações
    SIMULACOES: "/simulacoes",
    SIMULACAO_COMPARTILHAR: (id) => `/simulacoes/${id}/compartilhar`,
    SIMULACAO_COMPARTILHADA: (link) => `/simulacoes/compartilhadas/${link}`,

    // Tipos de Fundos
    TIPOS_FUNDOS: "/tipos-fundos",

    // Taxas Regulatórias
    TAXAS_REGULATORIAS: "/taxas-regulatorias",
    TAXAS_APLICAVEIS: (tipoFundo) =>
      `/taxas-regulatorias/aplicaveis/${tipoFundo}`,

    // Admin
    ADMIN_DASHBOARD: "/admin/dashboard",
    ADMIN_EMPRESA: "/admin/empresa",
  },

  // Storage keys
  STORAGE_KEYS: {
    TOKEN: "token",
    USER: "user",
    REMEMBER_ME: "rememberMe",
  },
};

// Roles
const ROLES = {
  ADMIN: "admin",
  USUARIO: "usuario",
  CLIENTE: "cliente",
};

// Status de simulação
const STATUS_SIMULACAO = {
  RASCUNHO: "rascunho",
  CONCLUIDA: "concluida",
  ARQUIVADA: "arquivada",
};

// Mensagens
const MESSAGES = {
  ERROR: {
    GENERIC: "Ocorreu um erro. Tente novamente.",
    NETWORK: "Erro de conexão. Verifique sua internet.",
    UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
    FORBIDDEN: "Você não tem permissão para esta ação.",
    NOT_FOUND: "Recurso não encontrado.",
    VALIDATION: "Verifique os dados informados.",
  },
  SUCCESS: {
    LOGIN: "Login realizado com sucesso!",
    LOGOUT: "Logout realizado com sucesso!",
    SAVED: "Salvo com sucesso!",
    DELETED: "Excluído com sucesso!",
    UPDATED: "Atualizado com sucesso!",
  },
};
