// frontend/js/api.js

class API {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Obter token do localStorage
  getToken() {
    return localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
  }

  // Salvar token
  setToken(token) {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, token);
  }

  // Remover token
  removeToken() {
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
  }

  // Headers padrão
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Requisição genérica
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.auth !== false),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Try to parse as JSON, fallback to text if Content-Type is not JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, treat as text and wrap in error object
        const text = await response.text();
        data = { success: false, error: text };
      }

      if (!response.ok) {
        throw new Error(data.error || MESSAGES.ERROR.GENERIC);
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Tempo de requisição excedido");
      }

      // Se não autorizado, redirecionar para login
      if (
        error.message.includes("Não autorizado") ||
        error.message.includes("Sessão expirada")
      ) {
        this.removeToken();
        window.location.href = "/shared/login.html";
      }

      throw error;
    }
  }

  // GET
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: "GET",
    });
  }

  // POST
  async post(endpoint, data = {}, auth = true) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      auth,
    });
  }

  // PUT
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE
  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // ==================== AUTH ====================

  async login(email, senha) {
    const response = await this.post(
      API_CONFIG.ENDPOINTS.LOGIN,
      { email, senha },
      false
    );
    if (response.success && response.token) {
      this.setToken(response.token);
      localStorage.setItem(
        API_CONFIG.STORAGE_KEYS.USER,
        JSON.stringify(response.user)
      );
    }
    return response;
  }

  async register(userData) {
    const response = await this.post(
      API_CONFIG.ENDPOINTS.REGISTER,
      userData,
      false
    );
    if (response.success && response.token) {
      this.setToken(response.token);
      localStorage.setItem(
        API_CONFIG.STORAGE_KEYS.USER,
        JSON.stringify(response.user)
      );
    }
    return response;
  }

  async logout() {
    try {
      await this.post(API_CONFIG.ENDPOINTS.LOGOUT);
    } finally {
      this.removeToken();
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);

      // Descobrir caminho relativo para login
      const currentPath = window.location.pathname;
      if (
        currentPath.includes("/admin/") ||
        currentPath.includes("/usuario/") ||
        currentPath.includes("/cliente/")
      ) {
        window.location.href = "../shared/login.html";
      } else {
        window.location.href = "shared/login.html";
      }
    }
  }

  async getMe() {
    return this.get(API_CONFIG.ENDPOINTS.ME);
  }

  async updateMe(data) {
    return this.put(API_CONFIG.ENDPOINTS.UPDATE_ME, data);
  }

  async updatePassword(senhaAtual, novaSenha) {
    return this.put(API_CONFIG.ENDPOINTS.UPDATE_PASSWORD, {
      senhaAtual,
      novaSenha,
    });
  }

  // ==================== USUÁRIOS ====================

  async getUsuarios(params = {}) {
    return this.get(API_CONFIG.ENDPOINTS.USUARIOS, params);
  }

  async getUsuario(id) {
    return this.get(`${API_CONFIG.ENDPOINTS.USUARIOS}/${id}`);
  }

  async updateUsuario(id, data) {
    return this.put(`${API_CONFIG.ENDPOINTS.USUARIOS}/${id}`, data);
  }

  async deleteUsuario(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.USUARIOS}/${id}`);
  }

  // ==================== CLIENTES ====================

  async getClientes(params = {}) {
    return this.get(API_CONFIG.ENDPOINTS.CLIENTES, params);
  }

  async getCliente(id) {
    return this.get(`${API_CONFIG.ENDPOINTS.CLIENTES}/${id}`);
  }

  async createCliente(data) {
    return this.post(API_CONFIG.ENDPOINTS.CLIENTES, data);
  }

  async updateCliente(id, data) {
    return this.put(`${API_CONFIG.ENDPOINTS.CLIENTES}/${id}`, data);
  }

  async deleteCliente(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.CLIENTES}/${id}`);
  }

  async updateClienteAcesso(id, data) {
    return this.put(`${API_CONFIG.ENDPOINTS.CLIENTES}/${id}/acesso`, data);
  }

  // ==================== SIMULAÇÕES ====================

  async getSimulacoes(params = {}) {
    return this.get(API_CONFIG.ENDPOINTS.SIMULACOES, params);
  }

  async getSimulacao(id) {
    return this.get(`${API_CONFIG.ENDPOINTS.SIMULACOES}/${id}`);
  }

  async createSimulacao(data) {
    return this.post(API_CONFIG.ENDPOINTS.SIMULACOES, data);
  }

  async updateSimulacao(id, data) {
    return this.put(`${API_CONFIG.ENDPOINTS.SIMULACOES}/${id}`, data);
  }

  async deleteSimulacao(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.SIMULACOES}/${id}`);
  }

  async compartilharSimulacao(id) {
    return this.post(API_CONFIG.ENDPOINTS.SIMULACAO_COMPARTILHAR(id));
  }

  async getSimulacaoCompartilhada(link) {
    return this.get(API_CONFIG.ENDPOINTS.SIMULACAO_COMPARTILHADA(link));
  }

  // ==================== TIPOS DE FUNDOS ====================

  async getTiposFundos(params = {}) {
    return this.get(API_CONFIG.ENDPOINTS.TIPOS_FUNDOS, params);
  }

  async getTipoFundo(id) {
    return this.get(`${API_CONFIG.ENDPOINTS.TIPOS_FUNDOS}/${id}`);
  }

  async createTipoFundo(data) {
    return this.post(API_CONFIG.ENDPOINTS.TIPOS_FUNDOS, data);
  }

  async updateTipoFundo(id, data) {
    return this.put(`${API_CONFIG.ENDPOINTS.TIPOS_FUNDOS}/${id}`, data);
  }

  async deleteTipoFundo(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.TIPOS_FUNDOS}/${id}`);
  }

  // ==================== TAXAS REGULATÓRIAS ====================

  async getTaxasRegulatorias(params = {}) {
    return this.get(API_CONFIG.ENDPOINTS.TAXAS_REGULATORIAS, params);
  }

  async getTaxaRegulatoria(id) {
    return this.get(`${API_CONFIG.ENDPOINTS.TAXAS_REGULATORIAS}/${id}`);
  }

  async createTaxaRegulatoria(data) {
    return this.post(API_CONFIG.ENDPOINTS.TAXAS_REGULATORIAS, data);
  }

  async updateTaxaRegulatoria(id, data) {
    return this.put(`${API_CONFIG.ENDPOINTS.TAXAS_REGULATORIAS}/${id}`, data);
  }

  async deleteTaxaRegulatoria(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.TAXAS_REGULATORIAS}/${id}`);
  }

  async calcularValorTaxa(id, parametros) {
    return this.post(
      `${API_CONFIG.ENDPOINTS.TAXAS_REGULATORIAS}/${id}/calcular`,
      parametros
    );
  }

  async getTaxasAplicaveisFundo(tipoFundo) {
    return this.get(API_CONFIG.ENDPOINTS.TAXAS_APLICAVEIS(tipoFundo));
  }

  // ==================== ADMIN ====================

  async getAdminDashboard() {
    return this.get(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD);
  }

  async getEmpresa() {
    return this.get(API_CONFIG.ENDPOINTS.ADMIN_EMPRESA);
  }

  async updateEmpresa(data) {
    return this.put(API_CONFIG.ENDPOINTS.ADMIN_EMPRESA, data);
  }
}

// Instância global
const api = new API();
