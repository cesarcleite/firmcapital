// frontend/js/utils.js

// Formatação de moeda
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Formatação de número
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0," + "0".repeat(decimals);
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Formatação de percentual
function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0,00%";
  }
  return formatNumber(value, decimals) + "%";
}

// Formatação de data
function formatDate(date, format = "short") {
  if (!date) return "-";

  const d = new Date(date);

  if (format === "short") {
    return d.toLocaleDateString("pt-BR");
  } else if (format === "long") {
    return d.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else if (format === "datetime") {
    return d.toLocaleString("pt-BR");
  }

  return d.toLocaleDateString("pt-BR");
}

// Debounce (útil para inputs de busca)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Mostrar loading
function showLoading(message = "Carregando...") {
  const existingLoader = document.getElementById("global-loader");
  if (existingLoader) {
    existingLoader.remove();
  }

  const loader = document.createElement("div");
  loader.id = "global-loader";
  loader.className = "loader-overlay";
  loader.innerHTML = `
    <div class="loader-content">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(loader);
}

// Esconder loading
function hideLoading() {
  const loader = document.getElementById("global-loader");
  if (loader) {
    loader.remove();
  }
}

// Toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Validar email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validar CPF (básico)
function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, "");
  return cpf.length === 11;
}

// Validar CNPJ (básico)
function isValidCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]/g, "");
  return cnpj.length === 14;
}

// Formatar CPF
function formatCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, "");
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Formatar CNPJ
function formatCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]/g, "");
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

// Formatar telefone
function formatPhone(phone) {
  if (!phone) return "-";
  
  phone = phone.replace(/[^\d]/g, "");
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

// Formatar CPF ou CNPJ automaticamente
function formatCPFCNPJ(value) {
  if (!value) return "-";
  
  const cleaned = value.replace(/\D/g, "");
  
  if (cleaned.length === 11) {
    return formatCPF(cleaned);
  } else if (cleaned.length === 14) {
    return formatCNPJ(cleaned);
  }
  
  return value;
}

// Copiar para clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copiado para área de transferência!", "success");
    return true;
  } catch (error) {
    console.error("Erro ao copiar:", error);
    showToast("Erro ao copiar", "error");
    return false;
  }
}

// Obter iniciais do nome
function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Tratamento de erro
function handleError(error) {
  console.error("Erro:", error);

  let message = MESSAGES.ERROR.GENERIC;

  if (error.message) {
    message = error.message;
  }

  showToast(message, "error");
}

// ========== MODAL DE CONFIRMAÇÃO CUSTOMIZADO ==========

/**
 * Exibe um modal de confirmação bonito
 * @param {Object} options - Opções do modal
 * @param {string} options.title - Título do modal
 * @param {string} options.message - Mensagem do modal
 * @param {string} options.confirmText - Texto do botão de confirmação
 * @param {string} options.cancelText - Texto do botão de cancelar
 * @param {string} options.type - Tipo: warning, danger, info, success
 * @param {boolean} options.isDanger - Se true, botão confirmar fica vermelho
 * @returns {Promise<boolean>} - true se confirmou, false se cancelou
 */
function confirmAction(options) {
  return new Promise((resolve) => {
    const {
      title = "Confirmar ação",
      message = "Tem certeza que deseja continuar?",
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      type = "warning", // warning, danger, info, success
      isDanger = false,
    } = options;

    // Criar modal
    const modal = document.createElement("div");
    modal.className = "confirm-modal";
    modal.innerHTML = `
      <div class="confirm-content">
        <div class="confirm-header">
          <div class="confirm-icon ${type}">
            <i class="fas fa-${
              type === "warning"
                ? "exclamation-triangle"
                : type === "danger"
                ? "exclamation-circle"
                : type === "info"
                ? "info-circle"
                : "check-circle"
            }"></i>
          </div>
          <h3 class="confirm-title">${title}</h3>
        </div>
        <div class="confirm-body">
          ${message}
        </div>
        <div class="confirm-footer">
          <button class="confirm-btn confirm-btn-cancel" id="confirmCancel">
            ${cancelText}
          </button>
          <button class="confirm-btn confirm-btn-confirm ${
            isDanger ? "danger" : ""
          }" id="confirmOk">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const btnCancel = modal.querySelector("#confirmCancel");
    const btnOk = modal.querySelector("#confirmOk");

    const close = (result) => {
      modal.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(modal);
        resolve(result);
      }, 200);
    };

    btnCancel.addEventListener("click", () => close(false));
    btnOk.addEventListener("click", () => close(true));

    // Fechar ao clicar fora
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        close(false);
      }
    });

    // Fechar com ESC
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        close(false);
        document.removeEventListener("keydown", handleEsc);
      }
    };
    document.addEventListener("keydown", handleEsc);

    // Focar no botão de cancelar
    setTimeout(() => btnCancel.focus(), 100);
  });
}
