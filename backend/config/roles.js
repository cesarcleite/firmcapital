// backend/config/roles.js

// Definição de roles e permissões do sistema
const ROLES = {
  ADMIN: "admin",
  USUARIO: "usuario",
  CLIENTE: "cliente",
};

const PERMISSIONS = {
  // Gestão de usuários
  MANAGE_USERS: "manage_users",
  VIEW_ALL_USERS: "view_all_users",

  // Gestão de clientes
  MANAGE_ALL_CLIENTS: "manage_all_clients",
  MANAGE_OWN_CLIENTS: "manage_own_clients",
  VIEW_ALL_CLIENTS: "view_all_clients",

  // Simulações
  CREATE_SIMULATIONS: "create_simulations",
  VIEW_ALL_SIMULATIONS: "view_all_simulations",
  VIEW_OWN_SIMULATIONS: "view_own_simulations",
  EDIT_ALL_SIMULATIONS: "edit_all_simulations",
  EDIT_OWN_SIMULATIONS: "edit_own_simulations",
  DELETE_ALL_SIMULATIONS: "delete_all_simulations",
  DELETE_OWN_SIMULATIONS: "delete_own_simulations",

  // Tipos de fundos
  MANAGE_FUND_TYPES: "manage_fund_types",
  VIEW_FUND_TYPES: "view_fund_types",

  // Empresa
  MANAGE_COMPANY: "manage_company",
  VIEW_COMPANY: "view_company",

  // Relatórios
  VIEW_ALL_REPORTS: "view_all_reports",
  VIEW_OWN_REPORTS: "view_own_reports",
};

// Mapeamento de permissões por role
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.MANAGE_ALL_CLIENTS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    PERMISSIONS.CREATE_SIMULATIONS,
    PERMISSIONS.VIEW_ALL_SIMULATIONS,
    PERMISSIONS.EDIT_ALL_SIMULATIONS,
    PERMISSIONS.DELETE_ALL_SIMULATIONS,
    PERMISSIONS.MANAGE_FUND_TYPES,
    PERMISSIONS.VIEW_FUND_TYPES,
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.VIEW_ALL_REPORTS,
  ],

  [ROLES.USUARIO]: [
    PERMISSIONS.MANAGE_OWN_CLIENTS,
    PERMISSIONS.CREATE_SIMULATIONS,
    PERMISSIONS.VIEW_OWN_SIMULATIONS,
    PERMISSIONS.EDIT_OWN_SIMULATIONS,
    PERMISSIONS.DELETE_OWN_SIMULATIONS,
    PERMISSIONS.VIEW_FUND_TYPES,
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.VIEW_OWN_REPORTS,
  ],

  [ROLES.CLIENTE]: [
    PERMISSIONS.VIEW_OWN_SIMULATIONS,
    PERMISSIONS.VIEW_FUND_TYPES,
    PERMISSIONS.VIEW_OWN_REPORTS,
  ],
};

// Função auxiliar para verificar se um role tem determinada permissão
const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

// Função para obter todas as permissões de um role
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
};
