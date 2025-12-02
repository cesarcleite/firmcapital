// frontend/js/dashboard.js

class Dashboard {
  constructor() {
    this.sidebar = document.querySelector(".sidebar");
    this.sidebarOverlay = document.querySelector(".sidebar-overlay");
    this.menuToggle = document.querySelector(".menu-toggle");

    this.init();
  }

  init() {
    this.loadUserInfo();
    this.setupEventListeners();
    this.setActiveNavItem();
  }

  // Carregar informações do usuário
  loadUserInfo() {
    const user = auth.getUser();

    if (!user) {
      auth.logout();
      return;
    }

    // Atualizar avatar
    const userAvatar = document.querySelector(".user-avatar");
    if (userAvatar) {
      const initials = this.getInitials(user.nome);
      userAvatar.textContent = initials;
    }

    // Atualizar nome
    const userName = document.querySelector(".user-name");
    if (userName) {
      userName.textContent = user.nome;
    }

    // Atualizar role
    const userRole = document.querySelector(".user-role");
    if (userRole) {
      const roleNames = {
        [ROLES.ADMIN]: "Administrador",
        [ROLES.USUARIO]: "Usuário",
        [ROLES.CLIENTE]: "Cliente",
      };
      userRole.textContent = roleNames[user.role] || user.role;
    }
  }

  // Obter iniciais do nome
  getInitials(name) {
    if (!name) return "?";

    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  // Configurar event listeners
  setupEventListeners() {
    // Toggle sidebar mobile
    if (this.menuToggle) {
      this.menuToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    // Fechar sidebar ao clicar no overlay
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    // Logout
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.handleLogout();
      });
    }

    // Fechar sidebar ao clicar em link (mobile)
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (window.innerWidth <= 1024) {
          this.closeSidebar();
        }
      });
    });
  }

  // Toggle sidebar
  toggleSidebar() {
    this.sidebar.classList.toggle("active");
    this.sidebarOverlay.classList.toggle("active");
  }

  // Fechar sidebar
  closeSidebar() {
    this.sidebar.classList.remove("active");
    this.sidebarOverlay.classList.remove("active");
  }

  // Definir item ativo no menu
  setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
      const href = item.getAttribute("href");
      if (href && currentPath.includes(href)) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  // Handle logout
  async handleLogout() {
    const confirmed = await confirmAction({
      title: "Sair do Sistema",
      message: "Tem certeza que deseja sair?",
      confirmText: "Sair",
      cancelText: "Cancelar",
      type: "info",
    });

    if (confirmed) {
      showLoading("Saindo...");
      await auth.logout();
    }
  }

  // Atualizar título da página
  setPageTitle(title) {
    const pageTitle = document.querySelector(".page-title");
    if (pageTitle) {
      pageTitle.textContent = title;
    }
    document.title = `${title} - Firm Capital`;
  }

  // Renderizar stats cards
  renderStatsCards(stats) {
    const container = document.querySelector(".stats-grid");
    if (!container) return;

    container.innerHTML = stats
      .map(
        (stat) => `
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon">
            <i class="${stat.icon}"></i>
          </div>
          ${
            stat.trend
              ? `
            <span class="stat-trend ${stat.trend > 0 ? "up" : "down"}">
              <i class="fas fa-arrow-${stat.trend > 0 ? "up" : "down"}"></i>
              ${Math.abs(stat.trend)}%
            </span>
          `
              : ""
          }
        </div>
        <div class="stat-title">${stat.title}</div>
        <div class="stat-value">${stat.value}</div>
        ${
          stat.description
            ? `<div class="stat-description">${stat.description}</div>`
            : ""
        }
      </div>
    `
      )
      .join("");
  }

  // Renderizar tabela com dados
  // Renderizar tabela com dados
  renderTable(tableId, data, columns, actions = []) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="${
          columns.length + (actions.length > 0 ? 1 : 0)
        }" class="text-center">
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="fas fa-inbox"></i>
            </div>
            <div class="empty-state-title">Nenhum registro encontrado</div>
          </div>
        </td>
      </tr>
    `;
      return;
    }

    tbody.innerHTML = data
      .map(
        (row) => `
    <tr>
      ${columns
        .map(
          (col) => `
        <td>${
          col.render ? col.render(row[col.field], row) : row[col.field] || "-"
        }</td>
      `
        )
        .join("")}
      ${
        actions.length > 0
          ? `
        <td>
          <div class="table-actions">
            ${actions
              .map(
                (action) => `
              <button 
                class="table-btn" 
                onclick="${action.onClick}('${row._id || row.id}')"
                title="${action.title}"
              >
                <i class="${action.icon}"></i>
              </button>
            `
              )
              .join("")}
          </div>
        </td>
      `
          : ""
      }
    </tr>
  `
      )
      .join("");
  }

  // Renderizar paginação
  renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const buttons = [];

    // Botão anterior
    buttons.push(`
      <button 
        class="pagination-btn" 
        ${currentPage === 1 ? "disabled" : ""}
        onclick="${onPageChange}(${currentPage - 1})"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
    `);

    // Primeira página
    if (startPage > 1) {
      buttons.push(`
        <button class="pagination-btn" onclick="${onPageChange}(1)">1</button>
      `);
      if (startPage > 2) {
        buttons.push(`<span>...</span>`);
      }
    }

    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(`
        <button 
          class="pagination-btn ${i === currentPage ? "active" : ""}" 
          onclick="${onPageChange}(${i})"
        >
          ${i}
        </button>
      `);
    }

    // Última página
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(`<span>...</span>`);
      }
      buttons.push(`
        <button class="pagination-btn" onclick="${onPageChange}(${totalPages})">
          ${totalPages}
        </button>
      `);
    }

    // Botão próximo
    buttons.push(`
      <button 
        class="pagination-btn" 
        ${currentPage === totalPages ? "disabled" : ""}
        onclick="${onPageChange}(${currentPage + 1})"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    `);

    container.innerHTML = buttons.join("");
  }
}

// Instanciar quando o DOM carregar
let dashboardInstance;

document.addEventListener("DOMContentLoaded", () => {
  dashboardInstance = new Dashboard();
});
