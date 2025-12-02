// backend/config/constants.js

// Constantes gerais do sistema

const STATUS_SIMULACAO = {
  RASCUNHO: "rascunho",
  CONCLUIDA: "concluida",
  ARQUIVADA: "arquivada",
};

const TIPOS_FUNDO_CODIGO = {
  FII: "FII",
  FIP: "FIP",
  FIDC: "FIDC",
  FIA: "FIA",
  FIP_IE: "FIP-IE",
};

const PLANOS = {
  BASICO: "basico",
  PROFISSIONAL: "profissional",
  EMPRESARIAL: "empresarial",
};

const ACOES_LOG = {
  LOGIN: "login",
  LOGOUT: "logout",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  VIEW: "view",
  EXPORT: "export",
  SHARE: "share",
  UPLOAD: "upload",
  RESET: "reset",
  EMPRESA_ATUALIZADA: "empresa_atualizada", // ADICIONADO
  EMPRESA_CRIADA: "empresa_criada", // ADICIONADO
  LOGO_UPLOAD: "logo_upload", // ADICIONADO
  LOGO_DELETADO: "logo_deletado", // ADICIONADO
  CONFIG_RESET: "config_reset", // ADICIONADO
};

const LIMITES = {
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SIMULACOES_POR_USUARIO: 100,
  MAX_CLIENTES_POR_USUARIO: 50,
  PAGINATION_DEFAULT: 20,
  PAGINATION_MAX: 100,
};

const REGEX = {
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  TELEFONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  CEP: /^\d{5}-\d{3}$/,
};

// Mensagens de erro padrão
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Não autorizado. Faça login para continuar.",
  FORBIDDEN: "Você não tem permissão para acessar este recurso.",
  NOT_FOUND: "Recurso não encontrado.",
  VALIDATION_ERROR: "Erro de validação. Verifique os dados enviados.",
  SERVER_ERROR: "Erro interno do servidor. Tente novamente mais tarde.",
  DUPLICATE_KEY: "Este registro já existe no sistema.",
  INVALID_CREDENTIALS: "Email ou senha incorretos.",
  TOKEN_EXPIRED: "Sessão expirada. Faça login novamente.",
  INVALID_TOKEN: "Token inválido.",
  USER_INACTIVE: "Usuário inativo. Entre em contato com o administrador.",
  LIMIT_EXCEEDED: "Limite excedido. Entre em contato com o suporte.",
};

// Mensagens de sucesso padrão
const SUCCESS_MESSAGES = {
  LOGIN: "Login realizado com sucesso.",
  LOGOUT: "Logout realizado com sucesso.",
  CREATED: "Registro criado com sucesso.",
  UPDATED: "Registro atualizado com sucesso.",
  DELETED: "Registro excluído com sucesso.",
  PASSWORD_CHANGED: "Senha alterada com sucesso.",
  EMAIL_SENT: "Email enviado com sucesso.",
};

module.exports = {
  STATUS_SIMULACAO,
  TIPOS_FUNDO_CODIGO,
  PLANOS,
  ACOES_LOG,
  LIMITES,
  REGEX,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
