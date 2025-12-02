// frontend/js/auth.js

class Auth {
  constructor() {
    this.user = this.getUser();
  }

  // Verificar se está autenticado
  isAuthenticated() {
    return !!localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
  }

  // Obter usuário do localStorage
  getUser() {
    const userJson = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  }

  // Salvar usuário
  setUser(user) {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    this.user = user;
  }

  // Verificar role
  hasRole(...roles) {
    return this.user && roles.includes(this.user.role);
  }

  // É admin?
  isAdmin() {
    return this.hasRole(ROLES.ADMIN);
  }

  // É usuário?
  isUsuario() {
    return this.hasRole(ROLES.USUARIO);
  }

  // É cliente?
  isCliente() {
    return this.hasRole(ROLES.CLIENTE);
  }

  // Redirecionar para dashboard correto
  redirectToDashboard() {
    if (!this.isAuthenticated()) {
      // Se estiver em qualquer página, volta para login
      const currentPath = window.location.pathname;
      if (currentPath.includes("/shared/")) {
        window.location.href = "login.html";
      } else if (
        currentPath.includes("/admin/") ||
        currentPath.includes("/usuario/") ||
        currentPath.includes("/cliente/")
      ) {
        window.location.href = "../shared/login.html";
      } else {
        window.location.href = "shared/login.html";
      }
      return;
    }

    // Recarregar user do localStorage
    this.user = this.getUser();

    if (!this.user || !this.user.role) {
      console.error("Usuário sem role definido");
      window.location.href = "shared/login.html";
      return;
    }

    // Descobrir onde estamos para calcular o caminho correto
    const currentPath = window.location.pathname;
    let prefix = "";

    if (currentPath.includes("/shared/")) {
      prefix = "../";
    } else if (
      currentPath.includes("/admin/") ||
      currentPath.includes("/usuario/") ||
      currentPath.includes("/cliente/")
    ) {
      // Estamos dentro de uma pasta de role, então o dashboard do mesmo role está na mesma pasta
      // e o dashboard de outros roles está em ../outra-pasta/
      prefix = "../";
    } else if (currentPath.includes("/simuladores/")) {
      // Estamos na pasta de simuladores, precisamos voltar um nível
      prefix = "../";
    } else if (currentPath === "/" || currentPath.includes("index.html")) {
      prefix = "";
    }

    switch (this.user.role) {
      case ROLES.ADMIN:
        window.location.href = prefix + "admin/dashboard.html";
        break;
      case ROLES.USUARIO:
        window.location.href = prefix + "usuario/dashboard.html";
        break;
      case ROLES.CLIENTE:
        window.location.href = prefix + "cliente/dashboard.html";
        break;
      default:
        window.location.href = "shared/login.html";
    }
  }

  // Proteger página (chamar no início de páginas protegidas)
  requireAuth(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      window.location.href = "/shared/login.html";
      return false;
    }

    if (allowedRoles.length > 0 && !this.hasRole(...allowedRoles)) {
      alert("Você não tem permissão para acessar esta página.");
      this.redirectToDashboard();
      return false;
    }

    return true;
  }

  // Logout
  async logout() {
    try {
      await api.logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      // Fazer logout local sempre
      api.removeToken();
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
      
      // Descobrir onde estamos para redirecionar corretamente
      const currentPath = window.location.pathname;
      let loginPath = "../shared/login.html";
      
      if (currentPath.includes("/shared/")) {
        loginPath = "login.html";
      } else if (currentPath === "/" || currentPath.endsWith("index.html")) {
        loginPath = "shared/login.html";
      }
      
      window.location.href = loginPath;
    }
  }
}

// Instância global
const auth = new Auth();
