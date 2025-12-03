// ========== CONSTANTES ==========
const TIPO_FUNDO_ATUAL = "FII";

// ========== VARIÁVEIS GLOBAIS ==========
let dadosDireto = [];
let dadosFII = [];
let custosFII = [];
let charts = {};
let dividendosDistribuidos = { direto: [], fii: [] };
let simulacaoId = null;
let tipoFundoFII = null;
let taxasRegulatorias = [];

// Variável global para armazenar resultados consolidados para o PDF
window.resultadosSimulacao = null;

let tableColumnsState = {
  direto: {
    patrimonio: true,
    receitas: true,
    custos: true,
    resultado: true,
    indicadores: true,
  },
  fii: {
    patrimonio: true,
    receitas: true,
    custos: true,
    resultado: true,
    indicadores: true,
  },
};

// Cores
const COLORS = {
  grayDark: "rgb(45, 45, 45)",
  grayMedium: "rgb(74, 74, 74)",
  accentGold: "rgb(197, 164, 126)",
  goldDark: "rgb(182, 149, 104)",
  goldLight: "rgb(212, 184, 150)",
  grayLight: "rgb(107, 107, 107)",
  grayLighter: "rgb(154, 154, 154)",
  beigeDark: "rgb(232, 228, 219)",
};

// ========== INICIALIZAÇÃO ==========
auth.requireAuth([ROLES.ADMIN, ROLES.USUARIO]);

document.addEventListener("DOMContentLoaded", function () {
  inicializarSimulador();
});

async function inicializarSimulador() {
  await carregarTipoFII();
  await carregarClientes();
  await carregarTaxasRegulatorias();
  renderizarTaxasRegulatorias();
  setupCurrencyInputs();
  setupDependentFields();
  verificarParametrosURL();
}

// ========== TAXAS REGULATÓRIAS ==========
async function carregarTaxasRegulatorias() {
  try {
    // Detectar tipo de fundo com fallback robusto
    let tipoFundo = "FII"; // Padrão para FII
    
    if (typeof TIPO_FUNDO_ATUAL !== 'undefined') {
      tipoFundo = TIPO_FUNDO_ATUAL;
    }
    
    console.log("🔍 Carregando taxas regulatórias para tipo:", tipoFundo);
    
    const response = await api.getTaxasAplicaveisFundo(tipoFundo);
    
    console.log("📡 Resposta da API getTaxasAplicaveisFundo:", response);

    if (response.success) {
      taxasRegulatorias = response.data.filter((t) => t.ativo);
      window.taxasRegulatorias = taxasRegulatorias; // ✅ Tornar global para cálculos
      console.log(
        "✅ Taxas regulatórias carregadas:",
        taxasRegulatorias.length,
        taxasRegulatorias
      );
      
      // Log detalhado de cada taxa
      taxasRegulatorias.forEach(taxa => {
        console.log(`  - ${taxa.tipo}: ${taxa.nome}`, taxa);
      });
    } else {
      console.warn("⚠️ API retornou success=false:", response.message);
      taxasRegulatorias = [];
      window.taxasRegulatorias = [];
    }
  } catch (error) {
    console.error("❌ Erro ao carregar taxas regulatórias:", error);
    taxasRegulatorias = [];
    window.taxasRegulatorias = [];
  }
}

function renderizarTaxasRegulatorias() {
  const container = document.getElementById("taxasRegulatoriasList");

  if (!container) return;

  if (taxasRegulatorias.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--gray-light)">
        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem"></i>
        <p>Nenhuma taxa regulatória cadastrada.</p>
        <a href="../admin/taxas-regulatorias.html" class="btn" style="margin-top: 1rem; display: inline-block">
          <i class="fas fa-plus"></i> Cadastrar Taxas
        </a>
      </div>
    `;
    return;
  }

  const periodicidadeLabels = {
    unica: "Única",
    mensal: "Mensal",
    anual: "Anual",
    por_oferta: "Por Oferta",
  };

  container.innerHTML = `
    <div style="display: grid; gap: 0.75rem">
      ${taxasRegulatorias
        .map((taxa) => {
          let valorInfo = "";

          if (taxa.tipoCalculo === "valor_fixo") {
            valorInfo = `R$ ${taxa.valorFixo.toFixed(2)}`;
          } else if (taxa.tipoCalculo === "percentual") {
            valorInfo = `${taxa.percentual}%`;
          } else if (taxa.tipoCalculo === "percentual_com_minimo") {
            valorInfo = `${
              taxa.percentual
            }% (mín. R$ ${taxa.valorMinimo.toFixed(2)})`;
          } else if (taxa.tipoCalculo === "faixas_pl") {
            valorInfo = `Faixas de PL (${taxa.faixas?.length || 0} faixas)`;
          }

          return `
          <div style="
            padding: 1rem;
            background: var(--beige-dark);
            border-radius: 6px;
            border-left: 3px solid var(--accent-gold);
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 1rem;
            align-items: center
          ">
            <div>
              <div style="font-weight: 600; color: var(--gray-dark); margin-bottom: 0.25rem">
                ${taxa.nome}
              </div>
              <div style="font-size: 0.85rem; color: var(--gray-medium)">
                ${
                  periodicidadeLabels[taxa.periodicidade] || taxa.periodicidade
                } • ${valorInfo}
              </div>
              ${
                taxa.descricao
                  ? `
                <div style="font-size: 0.8rem; color: var(--gray-light); margin-top: 0.5rem">
                  ${taxa.descricao}
                </div>
              `
                  : ""
              }
            </div>
            <div style="text-align: right">
              <span class="badge badge-success">Ativa</span>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>

    <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(197, 164, 126, 0.1); border-radius: 6px">
      <p style="font-size: 0.85rem; margin: 0; color: var(--gray-dark)">
        <i class="fas fa-calculator"></i>
        <strong>Total de taxas ativas:</strong> ${taxasRegulatorias.length}
      </p>
    </div>
  `;
}

// ========== ACCORDION ==========
function toggleAccordion(element) {
  const accordionItem = element.parentElement;
  const wasActive = accordionItem.classList.contains("active");

  document.querySelectorAll(".accordion-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (!wasActive) {
    accordionItem.classList.add("active");
  }
}

// ========== TOGGLE DE COLUNAS DAS TABELAS ==========
function toggleTableGroup(tipo, grupo) {
  const state = tableColumnsState[tipo];
  state[grupo] = !state[grupo];

  const tableId =
    tipo === "direto" ? "tabelaDetalhesDireto" : "tabelaDetalhesFII";
  const table = document.getElementById(tableId);

  if (!table) return;

  const groupCells = table.querySelectorAll(`.group-${grupo}`);

  groupCells.forEach((cell) => {
    if (state[grupo]) {
      cell.classList.add("visible");
    } else {
      cell.classList.remove("visible");
    }
  });

  const header = table.querySelector(`.group-header[data-group="${grupo}"]`);
  if (header) {
    if (state[grupo]) {
      header.classList.remove("collapsed");
    } else {
      header.classList.add("collapsed");
    }
  }
}

function toggleAllColumns(tipo, expand = true) {
  const state = tableColumnsState[tipo];

  Object.keys(state).forEach((grupo) => {
    state[grupo] = expand;
  });

  const tableId =
    tipo === "direto" ? "tabelaDetalhesDireto" : "tabelaDetalhesFII";
  const table = document.getElementById(tableId);

  if (!table) return;

  Object.keys(state).forEach((grupo) => {
    const groupCells = table.querySelectorAll(`.group-${grupo}`);
    const header = table.querySelector(`.group-header[data-group="${grupo}"]`);

    groupCells.forEach((cell) => {
      if (expand) {
        cell.classList.add("visible");
      } else {
        cell.classList.remove("visible");
      }
    });

    if (header) {
      if (expand) {
        header.classList.remove("collapsed");
      } else {
        header.classList.add("collapsed");
      }
    }
  });
}

// ========== CARREGAMENTO DE DADOS ==========
async function carregarTipoFII() {
  try {
    const response = await api.getTiposFundos({ codigo: "FII" });
    if (response.success && response.data.length > 0) {
      tipoFundoFII = response.data[0];
    }
  } catch (error) {
    console.error("Erro ao carregar tipo FII:", error);
  }
}

async function carregarClientes() {
  try {
    const response = await api.getClientes({ ativo: true, limit: 1000 });

    const selectCliente = document.getElementById("cliente");
    const selectClienteModal = document.getElementById("clienteModal");

    if (response.success && response.data) {
      selectCliente.innerHTML = '<option value="">Selecione...</option>';
      selectClienteModal.innerHTML = '<option value="">Selecione...</option>';

      response.data.forEach((cliente) => {
        const option = document.createElement("option");
        option.value = cliente._id;
        option.textContent = `${cliente.nome} - ${cliente.cpfCnpj}`;
        option.dataset.nome = cliente.nome.toLowerCase();
        option.dataset.cpfcnpj = cliente.cpfCnpj;

        selectCliente.appendChild(option.cloneNode(true));
        selectClienteModal.appendChild(option);
      });

      setupClienteFilter("cliente");
      setupClienteFilter("clienteModal");
    }
  } catch (error) {
    handleError(error);
  }
}

function setupClienteFilter(selectId) {
  const selectElement = document.getElementById(selectId);
  if (!selectElement) return;

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  selectElement.parentNode.insertBefore(wrapper, selectElement);
  wrapper.appendChild(selectElement);

  const filterInput = document.createElement("input");
  filterInput.type = "text";
  filterInput.placeholder = "Digite para filtrar clientes...";
  filterInput.className = "cliente-filter-input";
  filterInput.style.cssText = `
    width: 100%;
    padding: 0.4rem 0.65rem;
    border: 1.5px solid var(--beige-darker);
    border-radius: 6px;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    font-family: var(--font-primary);
  `;

  wrapper.insertBefore(filterInput, selectElement);
  selectElement.style.display = "none";

  const customList = document.createElement("div");
  customList.className = "cliente-custom-list";
  customList.style.cssText = `
    max-height: 200px;
    overflow-y: auto;
    border: 1.5px solid var(--beige-darker);
    border-radius: 6px;
    background: var(--beige);
    display: none;
  `;
  wrapper.appendChild(customList);

  function updateCustomList(filterText = "") {
    customList.innerHTML = "";
    const filter = filterText.toLowerCase();
    let hasResults = false;

    Array.from(selectElement.options).forEach((option, index) => {
      if (index === 0) return;

      const nome = option.dataset.nome || "";
      const cpfcnpj = option.dataset.cpfcnpj || "";

      if (!filter || nome.includes(filter) || cpfcnpj.includes(filter)) {
        hasResults = true;
        const item = document.createElement("div");
        item.className = "cliente-list-item";
        item.textContent = option.textContent;
        item.dataset.value = option.value;
        item.style.cssText = `
          padding: 0.5rem 0.65rem;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background 0.2s ease;
        `;

        item.addEventListener("mouseenter", () => {
          item.style.background = "rgba(197, 164, 126, 0.1)";
        });

        item.addEventListener("mouseleave", () => {
          item.style.background = "transparent";
        });

        item.addEventListener("click", () => {
          selectElement.value = option.value;
          filterInput.value = option.textContent;
          customList.style.display = "none";

          const event = new Event("change", { bubbles: true });
          selectElement.dispatchEvent(event);
        });

        customList.appendChild(item);
      }
    });

    if (!hasResults) {
      const noResults = document.createElement("div");
      noResults.textContent = "Nenhum cliente encontrado";
      noResults.style.cssText = `
        padding: 0.5rem 0.65rem;
        font-size: 0.8rem;
        color: var(--gray-medium);
        font-style: italic;
      `;
      customList.appendChild(noResults);
    }
  }

  filterInput.addEventListener("focus", () => {
    customList.style.display = "block";
    updateCustomList(filterInput.value);
  });

  filterInput.addEventListener("input", (e) => {
    customList.style.display = "block";
    updateCustomList(e.target.value);
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      customList.style.display = "none";
    }
  });

  if (selectElement.value) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (selectedOption) {
      filterInput.value = selectedOption.textContent;
    }
  }
}

function verificarParametrosURL() {
  const urlParams = new URLSearchParams(window.location.search);

  const clienteId = urlParams.get("cliente");
  if (clienteId) {
    document.getElementById("cliente").value = clienteId;
  }

  const simId = urlParams.get("id");
  if (simId) {
    simulacaoId = simId;
    carregarSimulacao(simId);
  }
}

// ========== FORMATAÇÃO DE MOEDA ==========
function formatCurrencyInput(input) {
  let value = input.value.replace(/\D/g, "");
  value = (parseInt(value) || 0) / 100;
  input.value = value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(input) {
  const cleanValue = input.value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleanValue) || 0;
}

function setupCurrencyInputs() {
  const currencyInputs = document.querySelectorAll(
    'input[data-type="currency"]'
  );
  currencyInputs.forEach((input) => {
    // Format initial value
    if (input.value) {
        // Se já estiver formatado (tem vírgula), não mexe. Se for número puro (ex: 15000), formata.
        if (input.value.indexOf(',') === -1) {
             let val = parseFloat(input.value.replace(/\./g, '').replace(',', '.'));
             input.value = val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    input.addEventListener("input", function (e) {
      let value = this.value.replace(/\D/g, "");
      value = (parseInt(value) || 0) / 100;
      this.value = value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });
  });

  const percentInputs = document.querySelectorAll('input[data-type="percent"]');
  percentInputs.forEach((input) => {
      // Format initial value
      if (input.value) {
          let val = parseFloat(input.value);
          input.value = val.toFixed(2);
      }
      
      input.addEventListener("change", function() {
          let val = parseFloat(this.value);
          if (!isNaN(val)) {
              this.value = val.toFixed(2);
          }
      });
  });
}

function formatCurrency(value, showNegativeStyle = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return "R$ 0,00";
  }

  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

  if (showNegativeStyle && value < 0) {
    return `<span style="color: #dc2626; font-weight: bold;">${formatted}</span>`;
  }

  return formatted;
}

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0," + "0".repeat(decimals);
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0,00%";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

// ========== CAMPOS DEPENDENTES ==========
function setupDependentFields() {
  const habilitarVenda = document.getElementById("habilitarVenda");
  const mesVenda = document.getElementById("mesVenda");
  const valorVenda = document.getElementById("valorVenda");
  const duracao = document.getElementById("duracao");
  const valorImovel = document.getElementById("valorImovel");
  const valorCaixa = document.getElementById("valorCaixa");
  const investimentoInicial = document.getElementById("investimentoInicial");

  if (
    !habilitarVenda ||
    !mesVenda ||
    !valorVenda ||
    !duracao ||
    !valorImovel ||
    !valorCaixa ||
    !investimentoInicial
  ) {
    console.error("Alguns elementos da interface não foram encontrados");
    return;
  }

  habilitarVenda.addEventListener("change", function () {
    const enabled = this.checked;
    mesVenda.disabled = !enabled;
    valorVenda.disabled = !enabled;
    if (enabled) {
      mesVenda.value = duracao.value;
    }
  });

  duracao.addEventListener("change", function () {
    mesVenda.max = this.value;
    if (parseInt(mesVenda.value) > parseInt(this.value)) {
      mesVenda.value = this.value;
    }
  });

  function atualizarInvestimentoTotal() {
    const imovel = parseCurrencyInput(valorImovel);
    const caixa = parseCurrencyInput(valorCaixa);
    const total = imovel + caixa;
    investimentoInicial.value = total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  valorImovel.addEventListener("input", function () {
    formatCurrencyInput(this);
    atualizarInvestimentoTotal();
  });

  valorImovel.addEventListener("blur", function () {
    formatCurrencyInput(this);
    atualizarInvestimentoTotal();
  });

  valorCaixa.addEventListener("input", function () {
    formatCurrencyInput(this);
    atualizarInvestimentoTotal();
  });

  valorCaixa.addEventListener("blur", function () {
    formatCurrencyInput(this);
    atualizarInvestimentoTotal();
  });

  atualizarInvestimentoTotal();
}

// ========== NAVEGAÇÃO ENTRE ABAS ==========
function showTab(tabName) {
  document
    .querySelectorAll(".tab-button")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  const activeButton = Array.from(
    document.querySelectorAll(".tab-button")
  ).find((btn) => btn.textContent.includes(getTabDisplayName(tabName)));
  if (activeButton) {
    activeButton.classList.add("active");
  }

  const tabContent = document.getElementById(`tab-${tabName}`);
  if (tabContent) {
    tabContent.classList.add("active");
  }
}

function showDetail(tipo) {
  document
    .querySelectorAll(".toggle-option")
    .forEach((opt) => opt.classList.remove("active"));
  event.target.classList.add("active");

  if (tipo === "direto") {
    document.getElementById("detalhes-direto").style.display = "block";
    document.getElementById("detalhes-fii").style.display = "none";
  } else {
    document.getElementById("detalhes-direto").style.display = "none";
    document.getElementById("detalhes-fii").style.display = "block";
  }
}

function getTabDisplayName(tabName) {
  const tabNames = {
    analise: "Análise Comparativa",
    detalhes: "Detalhes Mensais",
    custos: "Análise de Custos",
    sensibilidade: "Sensibilidade",
  };
  return tabNames[tabName] || tabName;
}

// ========== VALIDAÇÃO ==========
function validarEntradas() {
  const erros = [];

  const valorImovelElement = document.getElementById("valorImovel");
  const valorCaixaElement = document.getElementById("valorCaixa");
  const aluguelElement = document.getElementById("aluguelInicial");
  const duracaoElement = document.getElementById("duracao");

  if (
    !valorImovelElement ||
    !valorCaixaElement ||
    !aluguelElement ||
    !duracaoElement
  ) {
    erros.push("Erro: Elementos da interface não encontrados");
    showNotification("Erros de validação:\n" + erros.join("\n"), "error");
    return false;
  }

  const valorImovel = parseCurrencyInput(valorImovelElement);
  const valorCaixa = parseCurrencyInput(valorCaixaElement);
  const investimento = valorImovel + valorCaixa;
  const aluguel = parseCurrencyInput(aluguelElement);
  const duracao = parseInt(duracaoElement.value);

  if (valorImovel < 0) erros.push("Valor do imóvel não pode ser negativo");
  if (valorCaixa < 0) erros.push("Valor em caixa não pode ser negativo");
  if (investimento <= 0)
    erros.push("Investimento total deve ser maior que zero");
  if (aluguel <= 0) erros.push("Aluguel inicial deve ser maior que zero");
  if (duracao <= 0 || duracao > 600)
    erros.push("Duração deve estar entre 1 e 600 meses");

  const yieldAnual = (aluguel * 12) / investimento;
  if (yieldAnual < 0.01) {
    erros.push(
      "Aluguel muito baixo em relação ao investimento (yield < 1% a.a.)"
    );
  }

  if (erros.length > 0) {
    showNotification("Erros de validação:\n" + erros.join("\n"), "error");
    return false;
  }

  return true;
}

// ========== CÁLCULO PRINCIPAL ==========
function calcular() {
  if (!validarEntradas()) {
    return;
  }

  // Colapsar todos os accordions para liberar espaço
  document.querySelectorAll(".accordion-item").forEach((item) => {
    item.classList.remove("active");
  });

  document.getElementById("loading").classList.add("show");
  document.getElementById("results").style.display = "none";

  const progressFill = document.getElementById("progressFill");
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    progressFill.style.width = progress + "%";
  }, 50);

  setTimeout(() => {
    try {
      performCalculation();
      clearInterval(progressInterval);
      progressFill.style.width = "100%";

      setTimeout(() => {
        document.getElementById("loading").classList.remove("show");
        document.getElementById("results").style.display = "block";
        progressFill.style.width = "0%";
      }, 200);
    } catch (error) {
      console.error("Erro no cálculo:", error);
      clearInterval(progressInterval);
      document.getElementById("loading").classList.remove("show");
      showNotification("Erro no cálculo: " + error.message, "error");
      progressFill.style.width = "0%";
    }
  }, 800);
}

// ========== ATUALIZAÇÃO DA INTERFACE ==========
function updateInterface(
  valorTotalDireto,
  valorTotalFII,
  tirDiretoAnual,
  tirFIIAnual,
  roeMedioDireto,
  roeMedioFII,
  dyMedioDireto,
  dyMedioFII,
  margemMedioDireto,
  margemMedioFII
) {
  const resultsDiv = document.getElementById("results");
  if (!resultsDiv.querySelector(".summary-grid")) {
    resultsDiv.innerHTML = `
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Investimento Direto</h3>
          <div class="value" id="retornoDireto">R$ 0,00</div>
          <div class="subtitle">Dividendos + Patrimônio Final</div>
        </div>
        <div class="summary-card fii">
          <h3>Fundo de Investimento Imobiliário</h3>
          <div class="value" id="retornoFII">R$ 0,00</div>
          <div class="subtitle">Dividendos + Patrimônio Final</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Diferença Absoluta</h3>
          <div class="metric-value" id="diferencaAbsoluta">R$ 0,00</div>
          <div class="metric-comparison" id="diferencaTexto">Equivalente</div>
        </div>
        <div class="metric-card">
          <h3>TIR Anual</h3>
          <div class="metric-value" id="tirComparison">0%</div>
          <div class="metric-comparison" id="tirDiff">Diferença: 0%</div>
        </div>
        <div class="metric-card">
          <h3>ROE Médio Mensal</h3>
          <div class="metric-value" id="roeComparison">0%</div>
          <div class="metric-comparison" id="roeDiff">Diferença: 0%</div>
        </div>
        <div class="metric-card">
          <h3>Dividend Yield Médio</h3>
          <div class="metric-value" id="dyComparison">0%</div>
          <div class="metric-comparison" id="dyDiff">Diferença: 0%</div>
        </div>
        <div class="metric-card">
          <h3>Margem Líquida</h3>
          <div class="metric-value" id="margemComparison">0%</div>
          <div class="metric-comparison" id="margemDiff">Diferença: 0%</div>
        </div>
        <div class="metric-card">
          <h3>Vantagem Relativa</h3>
          <div class="metric-value" id="vantagem">0%</div>
          <div class="metric-comparison" id="vantagemText">Equivalente</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-container full-width">
          <h3 class="section-title">
            <i class="fas fa-chart-area"></i>
            Evolução do Valor Total Acumulado
          </h3>
          <div class="chart-wrapper tall">
            <canvas id="chartValorAcumulado"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h3 class="section-title">
            <i class="fas fa-percentage"></i>
            ROE Mensal
          </h3>
          <div class="chart-wrapper">
            <canvas id="chartROE"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h3 class="section-title">
            <i class="fas fa-chart-pie"></i>
            Dividend Yield
          </h3>
          <div class="chart-wrapper">
            <canvas id="chartDividendYield"></canvas>
          </div>
        </div>
      </div>

      <div class="tab-container">
        <div class="tab-list">
          <button class="tab-button active" onclick="showTab('detalhes')">
            <i class="fas fa-table"></i> Detalhes Mensais
          </button>
          <button class="tab-button" onclick="showTab('custos')">
            <i class="fas fa-coins"></i> Análise de Custos
          </button>
          <button class="tab-button" onclick="showTab('sensibilidade')">
            <i class="fas fa-sliders-h"></i> Sensibilidade
          </button>
        </div>
      </div>

      <div id="tab-detalhes" class="tab-content active">
        <div class="toggle-selector">
          <div class="toggle-option active" onclick="showDetail('direto')">
            Investimento Direto
          </div>
          <div class="toggle-option" onclick="showDetail('fii')">
            Fundo Imobiliário
          </div>
        </div>

        <div id="detalhes-direto" class="table-container">
          <div class="table-header">
            <h3 class="section-title">
              <i class="fas fa-building"></i>
              Detalhes Mensais - Investimento Direto
            </h3>
            <div class="table-controls">
              <button class="collapse-all-btn" onclick="toggleAllColumns('direto', false)">
                Colapsar Tudo
              </button>
              <button class="collapse-all-btn" onclick="toggleAllColumns('direto', true)">
                Expandir Tudo
              </button>
            </div>
          </div>
          <div class="table-scroll">
            <table class="table" id="tabelaDetalhesDireto">
              <thead>
                <tr>
                  <th rowspan="2">Mês</th>
                  <th colspan="3" class="group-header" data-group="patrimonio" onclick="toggleTableGroup('direto', 'patrimonio')">
                    Patrimônio <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="4" class="group-header" data-group="receitas" onclick="toggleTableGroup('direto', 'receitas')">
                    Receitas <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="5" class="group-header" data-group="custos" onclick="toggleTableGroup('direto', 'custos')">
                    Custos <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="4" class="group-header" data-group="resultado" onclick="toggleTableGroup('direto', 'resultado')">
                    Resultado <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="3" class="group-header" data-group="indicadores" onclick="toggleTableGroup('direto', 'indicadores')">
                    Indicadores <i class="fas fa-chevron-down"></i>
                  </th>
                </tr>
                <tr>
                  <th class="column-group group-patrimonio visible">Imóvel</th>
                  <th class="column-group group-patrimonio visible">Caixa</th>
                  <th class="column-group group-patrimonio visible">PL Início</th>
                  <th class="column-group group-receitas visible">Aluguel Bruto</th>
                  <th class="column-group group-receitas visible">Vacância</th>
                  <th class="column-group group-receitas visible">Inadimpl.</th>
                  <th class="column-group group-receitas visible">Efetivo</th>
                  <th class="column-group group-custos visible">Manutenção</th>
                  <th class="column-group group-custos visible">ITBI</th>
                  <th class="column-group group-custos visible">IR Aluguel</th>
                  <th class="column-group group-custos visible">IR Venda</th>
                  <th class="column-group group-custos visible custo-total">Total</th>
                  <th class="column-group group-resultado visible receita-total">Lucro</th>
                  <th class="column-group group-resultado visible">IR Div.</th>
                  <th class="column-group group-resultado visible">Dividendo</th>
                  <th class="column-group group-resultado visible">Reinvest.</th>
                  <th class="column-group group-indicadores visible">ROE%</th>
                  <th class="column-group group-indicadores visible">DY%</th>
                  <th class="column-group group-indicadores visible">Margem%</th>
                </tr>
              </thead>
              <tbody id="tabelaDetalhesDiretoBody"></tbody>
            </table>
          </div>
        </div>

        <div id="detalhes-fii" class="table-container" style="display: none">
          <div class="table-header">
            <h3 class="section-title">
              <i class="fas fa-chart-pie"></i>
              Detalhes Mensais - Fundo Imobiliário
            </h3>
            <div class="table-controls">
              <button class="collapse-all-btn" onclick="toggleAllColumns('fii', false)">
                Colapsar Tudo
              </button>
              <button class="collapse-all-btn" onclick="toggleAllColumns('fii', true)">
                Expandir Tudo
              </button>
            </div>
          </div>
          <div class="table-scroll">
            <table class="table" id="tabelaDetalhesFII">
              <thead>
                <tr>
                  <th rowspan="2">Mês</th>
                  <th colspan="3" class="group-header" data-group="patrimonio" onclick="toggleTableGroup('fii', 'patrimonio')">
                    Patrimônio <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="4" class="group-header" data-group="receitas" onclick="toggleTableGroup('fii', 'receitas')">
                    Receitas <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="11" class="group-header" data-group="custos" onclick="toggleTableGroup('fii', 'custos')">
                    Custos FII <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="4" class="group-header" data-group="resultado" onclick="toggleTableGroup('fii', 'resultado')">
                    Resultado <i class="fas fa-chevron-down"></i>
                  </th>
                  <th colspan="3" class="group-header" data-group="indicadores" onclick="toggleTableGroup('fii', 'indicadores')">
                    Indicadores <i class="fas fa-chevron-down"></i>
                  </th>
                </tr>
                <tr>
                  <th class="column-group group-patrimonio visible">Imóvel</th>
                  <th class="column-group group-patrimonio visible">Caixa</th>
                  <th class="column-group group-patrimonio visible">PL Início</th>
                  <th class="column-group group-receitas visible">Alug. Bruto</th>
                  <th class="column-group group-receitas visible">Vacância</th>
                  <th class="column-group group-receitas visible">Inadimpl.</th>
                  <th class="column-group group-receitas visible">Efetivo</th>
                  <th class="column-group group-custos visible">Admin</th>
                  <th class="column-group group-custos visible">Gestão</th>
                  <th class="column-group group-custos visible">Custódia</th>
                  <th class="column-group group-custos visible">Consult.</th>
                  <th class="column-group group-custos visible">ITBI</th>
                  <th class="column-group group-custos visible">IR Alug.</th>
                  <th class="column-group group-custos visible">CVM Anual</th>
                  <th class="column-group group-custos visible">CVM Reg.</th>
                  <th class="column-group group-custos visible">ANBIMA</th>
                  <th class="column-group group-custos visible">Distrib.</th>
                  <th class="column-group group-custos visible">Outros</th>
                  <th class="column-group group-custos visible custo-total">Total</th>
                  <th class="column-group group-resultado visible receita-total">Lucro</th>
                  <th class="column-group group-resultado visible">IR Div.</th>
                  <th class="column-group group-resultado visible">Dividendo</th>
                  <th class="column-group group-resultado visible">Reinvest.</th>
                  <th class="column-group group-indicadores visible">ROE%</th>
                  <th class="column-group group-indicadores visible">DY%</th>
                  <th class="column-group group-indicadores visible">Margem%</th>
                </tr>
              </thead>
              <tbody id="tabelaDetalhesFIIBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="tab-custos" class="tab-content">
        <div class="chart-container">
          <h3 class="section-title">
            <i class="fas fa-money-bill-wave"></i>
            Evolução dos Custos FII
          </h3>
          <div class="chart-wrapper">
            <canvas id="chartCustos"></canvas>
          </div>
        </div>
      </div>

      <div id="tab-sensibilidade" class="tab-content">
        <div class="table-container">
          <div class="table-header">
            <h3 class="section-title">
              <i class="fas fa-balance-scale"></i>
              Análise de Sensibilidade
            </h3>
          </div>
          <div class="table-scroll">
            <table class="sensitivity-table" id="tabelaSensibilidade">
              <thead>
                <tr>
                  <th>Cenário</th>
                  <th class="text-right">Valor Total Direto</th>
                  <th class="text-right">Valor Total FII</th>
                  <th class="text-right">Diferença</th>
                  <th class="text-right">Diferença %</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody id="tabelaSensibilidadeBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="content-card" style="margin-top: 1.5rem;">
        <div class="content-card-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <button class="btn" onclick="salvarSimulacao()">
              <i class="fas fa-save"></i>
              ${simulacaoId ? "Atualizar" : "Salvar"} Simulação
            </button>
            <button class="btn" onclick="gerarPDFSimulacao()" style="background: linear-gradient(135deg, rgb(74, 74, 74) 0%, rgb(45, 45, 45) 100%);">
              <i class="fas fa-file-pdf"></i>
              Gerar PDF
            </button>
          </div>
        </div>
      </div>
    `;
  }

  document.getElementById("retornoDireto").textContent =
    formatCurrency(valorTotalDireto);
  document.getElementById("retornoFII").textContent =
    formatCurrency(valorTotalFII);

  const diferenca = valorTotalFII - valorTotalDireto;
  document.getElementById("diferencaAbsoluta").textContent = formatCurrency(
    Math.abs(diferenca)
  );
  document.getElementById("diferencaTexto").textContent =
    diferenca > 0
      ? "FII é melhor"
      : diferenca < 0
      ? "Direto é melhor"
      : "Equivalente";
  document.getElementById("diferencaTexto").className = `metric-comparison ${
    diferenca > 1000 ? "positive" : diferenca < -1000 ? "negative" : "neutral"
  }`;

  document.getElementById("tirComparison").textContent = `${formatNumber(
    tirDiretoAnual,
    2
  )}% vs ${formatNumber(tirFIIAnual, 2)}%`;
  const tirDiff = tirFIIAnual - tirDiretoAnual;
  document.getElementById("tirDiff").textContent = `Diferença: ${formatNumber(
    tirDiff,
    2
  )}%`;
  document.getElementById("tirDiff").className = `metric-comparison ${
    tirDiff > 0.01 ? "positive" : tirDiff < -0.01 ? "negative" : "neutral"
  }`;

  document.getElementById("roeComparison").textContent = `${formatNumber(
    roeMedioDireto,
    2
  )}% vs ${formatNumber(roeMedioFII, 2)}%`;
  const roeDiff = roeMedioFII - roeMedioDireto;
  document.getElementById("roeDiff").textContent = `Diferença: ${formatNumber(
    roeDiff,
    2
  )}%`;
  document.getElementById("roeDiff").className = `metric-comparison ${
    roeDiff > 0.01 ? "positive" : roeDiff < -0.01 ? "negative" : "neutral"
  }`;

  document.getElementById("dyComparison").textContent = `${formatNumber(
    dyMedioDireto,
    2
  )}% vs ${formatNumber(dyMedioFII, 2)}%`;
  const dyDiff = dyMedioFII - dyMedioDireto;
  document.getElementById("dyDiff").textContent = `Diferença: ${formatNumber(
    dyDiff,
    2
  )}%`;
  document.getElementById("dyDiff").className = `metric-comparison ${
    dyDiff > 0.01 ? "positive" : dyDiff < -0.01 ? "negative" : "neutral"
  }`;

  document.getElementById("margemComparison").textContent = `${formatNumber(
    margemMedioDireto,
    2
  )}% vs ${formatNumber(margemMedioFII, 2)}%`;
  const margemDiff = margemMedioFII - margemMedioDireto;
  document.getElementById(
    "margemDiff"
  ).textContent = `Diferença: ${formatNumber(margemDiff, 2)}%`;
  document.getElementById("margemDiff").className = `metric-comparison ${
    margemDiff > 0.01 ? "positive" : margemDiff < -0.01 ? "negative" : "neutral"
  }`;

  // Vantagem Relativa = Diferença de ROI (Retorno sobre Investimento)
  // ROI = (Valor Final - Investimento Inicial) / Investimento Inicial * 100
  const valorInicialDireto = dadosDireto.length > 0 ? 
    (dadosDireto[0].plInicio || valorTotalDireto) : valorTotalDireto;
  const valorInicialFII = dadosFII.length > 0 ? 
    (dadosFII[0].plInicio || valorTotalFII) : valorTotalFII;
  
  const roiDireto = valorInicialDireto > 0 ? 
    ((valorTotalDireto - valorInicialDireto) / valorInicialDireto) * 100 : 0;
  const roiFII = valorInicialFII > 0 ? 
    ((valorTotalFII - valorInicialFII) / valorInicialFII) * 100 : 0;
  
  const vantagem = roiFII - roiDireto;
  document.getElementById("vantagem").textContent = `${formatNumber(
    Math.abs(vantagem),
    2
  )}%`;
  document.getElementById("vantagemText").textContent =
    vantagem > 1
      ? "FII Melhor"
      : vantagem < -1
      ? "Direto Melhor"
      : "Equivalente";
  document.getElementById("vantagemText").className = `metric-comparison ${
    vantagem > 1 ? "positive" : vantagem < -1 ? "negative" : "neutral"
  }`;

  // Adicionar tooltips se não existirem
  const cards = document.querySelectorAll('.metric-card');
  cards.forEach(card => {
      if (!card.querySelector('.metric-tooltip')) {
          const title = card.querySelector('h3').textContent;
          let type = '';
          if (title.includes('Diferença')) type = 'diferenca';
          else if (title.includes('TIR')) type = 'tir';
          else if (title.includes('ROE')) type = 'roe';
          else if (title.includes('Dividend Yield')) type = 'dy';
          else if (title.includes('Margem')) type = 'margem';
          else if (title.includes('Vantagem')) type = 'vantagem';
          
          if (type) {
              card.insertAdjacentHTML('beforeend', getTooltipHtml(type));
          }
      }
  });
}

function getTooltipHtml(type) {
  const tooltips = {
    roe: {
      title: "ROE (Return on Equity)",
      expl: "Rentabilidade do patrimônio investido no período.",
      formula: "(Dividendos + Reinvestimento) / Patrimônio Líquido × 100",
      interp: "Quanto maior, melhor o retorno sobre o capital investido."
    },
    dy: {
      title: "DY (Dividend Yield)",
      expl: "Rendimento de dividendos em relação ao patrimônio.",
      formula: "Dividendo Distribuído / Patrimônio Líquido × 100",
      interp: "Mostra quanto você recebe de dividendos mensalmente."
    },
    tir: {
      title: "TIR (Taxa Interna de Retorno)",
      expl: "Rentabilidade anualizada considerando todo o período.",
      formula: "Taxa que iguala valor presente dos fluxos a zero",
      interp: "Permite comparar com outras taxas de mercado."
    },
    margem: {
      title: "Margem Líquida",
      expl: "Eficiência na conversão de receita em dividendos.",
      formula: "Dividendo / Receita Bruta × 100",
      interp: "Quanto da receita vira dividendo real."
    },
    vantagem: {
      title: "Vantagem Relativa",
      expl: "Diferença de ROI (Retorno sobre Investimento) entre as opções.",
      formula: "ROI FII - ROI Direto",
      interp: "Positivo favorece FII, negativo favorece Direto."
    },
    diferenca: {
      title: "Diferença Absoluta",
      expl: "Diferença financeira final entre as duas opções.",
      formula: "Valor Total FII - Valor Total Direto",
      interp: "Quanto dinheiro a mais (ou a menos) o FII gera."
    }
  };

  const content = tooltips[type];
  if (!content) return "";

  return `
    <i class="fas fa-question-circle tooltip-icon"></i>
    <div class="metric-tooltip">
      <span class="tooltip-title">${content.title}</span>
      <div class="tooltip-section">
        <span class="tooltip-label">O que é:</span>
        ${content.expl}
      </div>
      <div class="tooltip-section">
        <span class="tooltip-label">Cálculo:</span>
        ${content.formula}
      </div>
      <div class="tooltip-section">
        <span class="tooltip-label">Interpretação:</span>
        ${content.interp}
      </div>
    </div>
  `;
}

// ========== ALERTAS ==========
function mostrarAlertas() {
  const alertAnterior = document.querySelector(".alert-container");
  if (alertAnterior) {
    alertAnterior.remove();
  }

  const alertas = [];

  // Filtrar meses com prejuízo, mas ignorar meses com venda de ativo
  // pois o lucro da venda não está no lucroOperacional
  const mesesPrejuizoDireto = dadosDireto.filter(
    (d) => d.lucroOperacional < 0 && d.receitaVenda === 0
  ).length;
  const mesesPrejuizoFII = dadosFII.filter(
    (d) => d.lucroOperacional < 0 && d.receitaVenda === 0
  ).length;

  if (mesesPrejuizoDireto > 0) {
    alertas.push(
      `⚠️ Investimento Direto: ${mesesPrejuizoDireto} meses com prejuízo`
    );
  }

  if (mesesPrejuizoFII > 0) {
    alertas.push(`⚠️ FII: ${mesesPrejuizoFII} meses com prejuízo`);
  }

  const plNegativoDireto = dadosDireto.some((d) => d.plFinal < 0);
  const plNegativoFII = dadosFII.some((d) => d.plFinal < 0);

  if (plNegativoDireto) {
    alertas.push(
      `🔴 Investimento Direto: Patrimônio Líquido Negativo detectado`
    );
  }

  if (plNegativoFII) {
    alertas.push(`🔴 FII: Patrimônio Líquido Negativo detectado`);
  }

  const caixaNegativoDireto = dadosDireto.some((d) => d.valorCaixa < 0);
  const caixaNegativoFII = dadosFII.some((d) => d.valorCaixa < 0);

  if (caixaNegativoDireto) {
    alertas.push(`🟠 Investimento Direto: Caixa Negativo detectado`);
  }

  if (caixaNegativoFII) {
    alertas.push(`🟠 FII: Caixa Negativo detectado`);
  }

  if (alertas.length > 0) {
    const alertContainer = document.createElement("div");
    alertContainer.className = "alert-container";
    alertContainer.innerHTML = `
      <h4>⚠️ Alertas da Simulação</h4>
      ${alertas.map((alerta) => `<div>• ${alerta}</div>`).join("")}
    `;
    const resultsDiv = document.getElementById("results");
    const summaryGrid = resultsDiv.querySelector(".summary-grid");
    resultsDiv.insertBefore(alertContainer, summaryGrid);
  }
}

// ========== GRÁFICOS ==========
function updateCharts() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js não está disponível");
    return;
  }

  Object.values(charts).forEach((chart) => {
    if (chart && typeof chart.destroy === "function") {
      try {
        chart.destroy();
      } catch (e) {
        console.warn("Erro ao destruir gráfico:", e);
      }
    }
  });

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          color: COLORS.grayDark,
          font: {
            size: 11,
            family: "Roboto, sans-serif",
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4,
      },
    },
    scales: {
      x: {
        ticks: {
          color: COLORS.grayMedium,
          font: {
            size: 9,
            family: "Roboto, sans-serif",
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: {
          color: "rgba(197, 164, 126, 0.1)",
        },
      },
      y: {
        ticks: {
          color: COLORS.grayMedium,
          font: {
            size: 9,
            family: "Roboto, sans-serif",
          },
        },
        grid: {
          color: "rgba(197, 164, 126, 0.1)",
        },
      },
    },
  };

  const ctxValor = document.getElementById("chartValorAcumulado");
  if (ctxValor) {
    let acumDividendosDireto = 0,
      acumDividendosFII = 0;
    const valorAcumDireto = [];
    const valorAcumFII = [];
    const labels = [];

    for (let i = 0; i < dadosDireto.length; i++) {
      const distribuicoesCaixaIndexador = document.getElementById(
        "distribuicoesCaixaIndexador"
      ).checked;

      if (distribuicoesCaixaIndexador) {
        acumDividendosDireto += dividendosDistribuidos.direto[i].valorCorrigido;
        acumDividendosFII += dividendosDistribuidos.fii[i].valorCorrigido;
      } else {
        acumDividendosDireto += dadosDireto[i].dividendo;
        acumDividendosFII += dadosFII[i].dividendo;
      }

      valorAcumDireto.push(acumDividendosDireto + dadosDireto[i].plFinal);
      valorAcumFII.push(acumDividendosFII + dadosFII[i].plFinal);
      labels.push(`Mês ${dadosDireto[i].mes}`);
    }

    charts.valor = new Chart(ctxValor, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Valor Total Direto",
            data: valorAcumDireto,
            borderColor: COLORS.grayMedium,
            backgroundColor: `rgba(74, 74, 74, 0.1)`,
            fill: false,
            tension: 0.1,
            borderWidth: 2,
          },
          {
            label: "Valor Total FII",
            data: valorAcumFII,
            borderColor: COLORS.accentGold,
            backgroundColor: `rgba(197, 164, 126, 0.1)`,
            fill: false,
            tension: 0.1,
            borderWidth: 2,
          },
        ],
      },
      options: commonOptions,
    });
  }

  updateOtherCharts(commonOptions);
}

function updateOtherCharts(commonOptions) {
  const ctxROE = document.getElementById("chartROE");
  if (ctxROE) {
    charts.roe = new Chart(ctxROE, {
      type: "line",
      data: {
        labels: dadosDireto.map((d) => `Mês ${d.mes}`),
        datasets: [
          {
            label: "ROE Direto (%)",
            data: dadosDireto.map((d) => d.roe),
            borderColor: COLORS.grayMedium,
            backgroundColor: `rgba(74, 74, 74, 0.1)`,
            fill: false,
            tension: 0.1,
            borderWidth: 2,
          },
          {
            label: "ROE FII (%)",
            data: dadosFII.map((d) => d.roe),
            borderColor: COLORS.accentGold,
            backgroundColor: `rgba(197, 164, 126, 0.1)`,
            fill: false,
            tension: 0.1,
            borderWidth: 2,
          },
        ],
      },
      options: commonOptions,
    });
  }

  const ctxDY = document.getElementById("chartDividendYield");
  if (ctxDY) {
    charts.dy = new Chart(ctxDY, {
      type: "line",
      data: {
        labels: dadosDireto.map((d) => `Mês ${d.mes}`),
        datasets: [
          {
            label: "DY Direto (%)",
            data: dadosDireto.map((d) => d.dy),
            borderColor: COLORS.grayMedium,
            backgroundColor: `rgba(74, 74, 74, 0.1)`,
            fill: false,
            tension: 0.1,
            borderWidth: 2,
          },
          {
            label: "DY FII (%)",
            data: dadosFII.map((d) => d.dy),
            borderColor: COLORS.accentGold,
            backgroundColor: `rgba(197, 164, 126, 0.1)`,
            fill: false,
            tension: 0.1,
            borderWidth: 2,
          },
        ],
      },
      options: commonOptions,
    });
  }

  const ctxCustos = document.getElementById("chartCustos");
  if (ctxCustos && custosFII.length > 0) {
    const primeiros60 = custosFII.slice(0, Math.min(60, custosFII.length));
    charts.custos = new Chart(ctxCustos, {
      type: "bar",
      data: {
        labels: primeiros60.map((c) => `Mês ${c.mes}`),
        datasets: [
          {
            label: "Taxa Admin",
            data: primeiros60.map((c) => c.admin),
            backgroundColor: `rgba(197, 164, 126, 0.8)`,
          },
          {
            label: "Taxa Gestão",
            data: primeiros60.map((c) => c.gestao),
            backgroundColor: `rgba(182, 149, 104, 0.8)`,
          },
          {
            label: "Taxa Custódia",
            data: primeiros60.map((c) => c.custodia),
            backgroundColor: `rgba(212, 184, 150, 0.8)`,
          },
          {
            label: "Taxa Consultoria",
            data: primeiros60.map((c) => c.consultoria),
            backgroundColor: `rgba(74, 74, 74, 0.8)`,
          },
          {
            label: "CVM Anual",
            data: primeiros60.map((c) => c.cvmAnual || 0),
            backgroundColor: `rgba(220, 38, 38, 0.8)`,
          },
          {
            label: "CVM Registro",
            data: primeiros60.map((c) => c.cvmRegistro || 0),
            backgroundColor: `rgba(185, 28, 28, 0.8)`,
          },
          {
            label: "ANBIMA Registro",
            data: primeiros60.map((c) => c.anbimaRegistro || 0),
            backgroundColor: `rgba(153, 27, 27, 0.8)`,
          },
          {
            label: "Taxa Distribuição",
            data: primeiros60.map((c) => c.distribuicao || 0),
            backgroundColor: `rgba(59, 130, 246, 0.8)`,
          },
          {
            label: "Outros Custos",
            data: primeiros60.map((c) => c.outros),
            backgroundColor: `rgba(107, 107, 107, 0.8)`,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 15,
              color: COLORS.grayDark,
              font: {
                size: 11,
                family: "Roboto, sans-serif",
              },
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(context.parsed.y);
                }
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: {
              color: COLORS.grayMedium,
              font: {
                size: 9,
                family: "Roboto, sans-serif",
              },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
            },
            grid: {
              color: "rgba(197, 164, 126, 0.1)",
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              color: COLORS.grayMedium,
              font: {
                size: 9,
                family: "Roboto, sans-serif",
              },
            },
            grid: {
              color: "rgba(197, 164, 126, 0.1)",
            },
          },
        },
      },
    });
  }
}

// ========== TABELAS ==========
function updateTables() {
  updateDetailTables();
}

function updateDetailTables() {
  const diretoBody = document.getElementById("tabelaDetalhesDiretoBody");
  diretoBody.innerHTML = "";

  dadosDireto.forEach((d) => {
    const isNegative = d.lucroOperacional < 0;
    const rowClass = isNegative ? 'class="row-prejuizo"' : "";
    const lucroClass = isNegative ? "receita-negativa" : "receita-total";

    diretoBody.innerHTML += `
      <tr ${rowClass}>
        <td class="text-center">${d.mes}</td>
        <td class="column-group group-patrimonio visible">${formatCurrency(
          d.valorImovel
        )}</td>
        <td class="column-group group-patrimonio visible">${formatCurrency(
          d.valorCaixa
        )}</td>
        <td class="column-group group-patrimonio visible">${formatCurrency(
          d.plInicio
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.aluguelBruto
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.perdaVacancia
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.perdaInadimplencia
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.aluguelEfetivo
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.custosOperacionais
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.custoITBI
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.irAluguel
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.irVenda
        )}</td>
        <td class="column-group group-custos visible custo-total">${formatCurrency(
          d.totalCustos
        )}</td>
        <td class="column-group group-resultado visible ${lucroClass}">${formatCurrency(
      d.lucroOperacional
    )}</td>
        <td class="column-group group-resultado visible">${formatCurrency(
          d.irDividendo
        )}</td>
        <td class="column-group group-resultado visible">${formatCurrency(
          d.dividendo
        )}</td>
        <td class="column-group group-resultado visible">${formatCurrency(
          d.reinvestimento
        )}</td>
        <td class="column-group group-indicadores visible">${formatNumber(
          d.roe,
          2
        )}%</td>
        <td class="column-group group-indicadores visible">${formatNumber(
          d.dy,
          2
        )}%</td>
        <td class="column-group group-indicadores visible">${formatNumber(
          d.margem,
          2
        )}%</td>
      </tr>
    `;
  });

  const fiiBody = document.getElementById("tabelaDetalhesFIIBody");
  fiiBody.innerHTML = "";

  dadosFII.forEach((d) => {
    const isNegative = d.lucroOperacional < 0;
    const rowClass = isNegative ? 'class="row-prejuizo"' : "";
    const lucroClass = isNegative ? "receita-negativa" : "receita-total";

    fiiBody.innerHTML += `
      <tr ${rowClass}>
        <td class="text-center">${d.mes}</td>
        <td class="column-group group-patrimonio visible">${formatCurrency(
          d.valorImovel
        )}</td>
        <td class="column-group group-patrimonio visible">${formatCurrency(
          d.valorCaixa
        )}</td>
        <td class="column-group group-patrimonio visible">${formatCurrency(
          d.plInicio
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.aluguelBruto
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.perdaVacancia
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.perdaInadimplencia
        )}</td>
        <td class="column-group group-receitas visible">${formatCurrency(
          d.aluguelEfetivo
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.custosAdmin
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.custosGestao
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.custosCustodia
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.custosConsultoria
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.custoITBI
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.irAluguel
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.taxaCVMAnualMes || 0
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.taxaCVMRegistroMes || 0
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.taxaANBIMARegistroMes || 0
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.taxaDistribuicaoMes || 0
        )}</td>
        <td class="column-group group-custos visible">${formatCurrency(
          d.outrosCustosMes
        )}</td>
        <td class="column-group group-custos visible custo-total">${formatCurrency(
          d.totalCustosFII
        )}</td>
        <td class="column-group group-resultado visible ${lucroClass}">${formatCurrency(
      d.lucroOperacional
    )}</td>
        <td class="column-group group-resultado visible">${formatCurrency(
          d.irDividendo
        )}</td>
        <td class="column-group group-resultado visible">${formatCurrency(
          d.dividendo
        )}</td>
        <td class="column-group group-resultado visible">${formatCurrency(
          d.reinvestimento
        )}</td>
        <td class="column-group group-indicadores visible">${formatNumber(
          d.roe,
          2
        )}%</td>
        <td class="column-group group-indicadores visible">${formatNumber(
          d.dy,
          2
        )}%</td>
        <td class="column-group group-indicadores visible">${formatNumber(
          d.margem,
          2
        )}%</td>
      </tr>
    `;
  });
}

// ========== ANÁLISE DE SENSIBILIDADE ==========
function updateSensitivity() {
  if (!dadosDireto.length || !dadosFII.length) return;

  const totalDividendosDireto = dadosDireto.reduce(
    (sum, d) => sum + d.dividendo,
    0
  );
  const totalDividendosFII = dadosFII.reduce((sum, d) => sum + d.dividendo, 0);
  const plFinalDireto = dadosDireto[dadosDireto.length - 1].plFinal;
  const plFinalFII = dadosFII[dadosFII.length - 1].plFinal;

  const valorTotalDireto = totalDividendosDireto + plFinalDireto;
  const valorTotalFII = totalDividendosFII + plFinalFII;

  const scenarios = [
    {
      name: "Cenário Base",
      direto: valorTotalDireto,
      fii: valorTotalFII,
    },
    {
      name: "IPCA +2% a.a.",
      direto: valorTotalDireto * 1.15,
      fii: valorTotalFII * 1.15,
    },
    {
      name: "Custos FII +50%",
      direto: valorTotalDireto,
      fii: valorTotalFII * 0.92,
    },
    {
      name: "Vacância +3%",
      direto: valorTotalDireto * 0.97,
      fii: valorTotalFII * 0.97,
    },
    {
      name: "IR FII = 5%",
      direto: valorTotalDireto,
      fii: valorTotalFII * 0.95,
    },
  ];

  const sensBody = document.getElementById("tabelaSensibilidadeBody");
  sensBody.innerHTML = "";

  scenarios.forEach((scenario) => {
    const diff = scenario.fii - scenario.direto;
    const diffPercent =
      Math.abs(scenario.direto) > 100
        ? (diff / Math.abs(scenario.direto)) * 100
        : 0;
    const resultado =
      Math.abs(diffPercent) < 1
        ? "Equivalente"
        : diffPercent > 0
        ? "FII Melhor"
        : "Direto Melhor";
    const resultadoClass =
      Math.abs(diffPercent) < 1
        ? "neutral"
        : diffPercent > 0
        ? "success"
        : "warning";

    sensBody.innerHTML += `
      <tr>
        <td>${scenario.name}</td>
        <td class="text-right">${formatCurrency(scenario.direto)}</td>
        <td class="text-right">${formatCurrency(scenario.fii)}</td>
        <td class="text-right">${formatCurrency(diff)}</td>
        <td class="text-right">${formatNumber(diffPercent, 2)}%</td>
        <td><span class="badge ${resultadoClass}">${resultado}</span></td>
      </tr>
    `;
  });
}

// ========== SALVAR SIMULAÇÃO ==========
async function salvarSimulacao(forcarNova = false) {
  try {
    const titulo = document.getElementById("titulo").value.trim();
    const clienteId = document.getElementById("cliente").value;
    const descricao = document.getElementById("descricao").value.trim();

    // Verificar título primeiro
    if (!titulo) {
      showModalTitulo();
      return;
    }

    // Depois verificar cliente
    if (!clienteId) {
      showModalCliente();
      return;
    }

    if (!tipoFundoFII || !tipoFundoFII._id) {
      showNotification("Tipo de fundo FII não encontrado", "error");
      return;
    }

    if (dadosDireto.length === 0 || dadosFII.length === 0) {
      showNotification("Execute a simulação antes de salvar", "error");
      return;
    }

    // Se já existe ID e não está forçando nova, perguntar
    if (simulacaoId && !forcarNova) {
      const confirmed = await confirmarSobrescrita();
      if (confirmed === null) return; // Cancelou
      if (confirmed === false) {
        // Quer criar nova
        simulacaoId = null;
      }
      // Se true, continua com o ID atual (sobrescrever)
    }

    const parametros = {
      valorImovel: parseCurrencyInput(document.getElementById("valorImovel")),
      valorCaixa: parseCurrencyInput(document.getElementById("valorCaixa")),
      aluguelInicial: parseCurrencyInput(
        document.getElementById("aluguelInicial")
      ),
      duracao: parseInt(document.getElementById("duracao").value),
      correcaoImovelIPCA: document.getElementById("correcaoImovelIPCA").checked,
      correcaoCaixaIndexador: document.getElementById("correcaoCaixaIndexador")
        .checked,
      distribuicoesCaixaIndexador: document.getElementById(
        "distribuicoesCaixaIndexador"
      ).checked,
      habilitarVenda: document.getElementById("habilitarVenda").checked,
      mesVenda: parseInt(document.getElementById("mesVenda").value),
      valorVenda: parseCurrencyInput(document.getElementById("valorVenda")),
      ipcaAnual: parseFloat(document.getElementById("ipcaAnual").value),
      correcaoCaixaAnual: parseFloat(
        document.getElementById("correcaoCaixaAnual").value
      ),
      waccAnual: parseFloat(document.getElementById("waccAnual").value),
      irAluguelDireto: parseFloat(
        document.getElementById("irAluguelDireto").value
      ),
      irDividendoDireto: parseFloat(
        document.getElementById("irDividendoDireto").value
      ),
      irGanhoDireto: parseFloat(document.getElementById("irGanhoDireto").value),
      itbiDireto: parseFloat(document.getElementById("itbiDireto").value),
      irAluguelFII: parseFloat(document.getElementById("irAluguelFII").value),
      irDividendoFII: parseFloat(
        document.getElementById("irDividendoFII").value
      ),
      irGanhoFII: parseFloat(document.getElementById("irGanhoFII").value),
      itbiFII: parseFloat(document.getElementById("itbiFII").value),
      taxaAdmin: parseFloat(document.getElementById("taxaAdmin").value),
      minAdmin: parseCurrencyInput(document.getElementById("minAdmin")),
      taxaGestao: parseFloat(document.getElementById("taxaGestao").value),
      minGestao: parseCurrencyInput(document.getElementById("minGestao")),
      taxaCustodia: parseFloat(document.getElementById("taxaCustodia").value),
      minCustodia: parseCurrencyInput(document.getElementById("minCustodia")),
      taxaConsultoria: parseFloat(
        document.getElementById("taxaConsultoria").value
      ),
      minConsultoria: parseCurrencyInput(
        document.getElementById("minConsultoria")
      ),
      outrosCustos: parseCurrencyInput(document.getElementById("outrosCustos")),
      taxaDistribuicao: parseFloat(
        document.getElementById("taxaDistribuicao").value
      ),
      parcelasDistribuicao: parseInt(
        document.getElementById("parcelasDistribuicao").value
      ),
      baseDistribuicao: document.getElementById("baseDistribuicao").value,
      distribDireto: parseFloat(document.getElementById("distribDireto").value),
      distribFII: parseFloat(document.getElementById("distribFII").value),
      taxaVacancia: parseFloat(document.getElementById("taxaVacancia").value),
      taxaInadimplencia: parseFloat(
        document.getElementById("taxaInadimplencia").value
      ),
      custosManutencao: parseFloat(
        document.getElementById("custosManutencao").value
      ),
    };

    const totalDividendosDireto = dadosDireto.reduce(
      (sum, d) => sum + d.dividendo,
      0
    );
    const totalDividendosFII = dadosFII.reduce(
      (sum, d) => sum + d.dividendo,
      0
    );
    const plFinalDireto = dadosDireto[dadosDireto.length - 1].plFinal;
    const plFinalFII = dadosFII[dadosFII.length - 1].plFinal;
    const valorTotalDireto = totalDividendosDireto + plFinalDireto;
    const valorTotalFII = totalDividendosFII + plFinalFII;

    const resultados = {
      investimentoDireto: {
        totalDividendos: totalDividendosDireto,
        plFinal: plFinalDireto,
        valorTotal: valorTotalDireto,
        tir: document.getElementById("tirDireto") 
          ? parseFloat(document.getElementById("tirDireto").textContent.replace(',', '.')) 
          : 0,
      },
      fii: {
        totalDividendos: totalDividendosFII,
        plFinal: plFinalFII,
        valorTotal: valorTotalFII,
        tir: document.getElementById("tirFII") 
          ? parseFloat(document.getElementById("tirFII").textContent.replace(',', '.')) 
          : 0,
      },
      diferenca: valorTotalFII - valorTotalDireto,
      diferencaPercentual:
        ((valorTotalFII - valorTotalDireto) / valorTotalDireto) * 100,
    };

    const dadosSimulacao = {
      titulo,
      descricao,
      cliente: clienteId,
      tipoFundo: tipoFundoFII._id,
      status: "concluida",
      parametros,
      resultados,
      detalhes: {
        direto: dadosDireto,
        fii: dadosFII,
        custosFII: custosFII,
      },
    };

    let response;
    if (simulacaoId) {
      response = await api.updateSimulacao(simulacaoId, dadosSimulacao);
    } else {
      response = await api.createSimulacao(dadosSimulacao);
    }

    if (response.success) {
      showNotification(
        simulacaoId
          ? "Simulação atualizada com sucesso!"
          : "Simulação salva com sucesso!",
        "success"
      );

      if (!simulacaoId) {
        simulacaoId = response.data._id;
        const newUrl = new URL(window.location);
        newUrl.searchParams.set("id", simulacaoId);
        window.history.pushState({}, "", newUrl);
      }

      atualizarBotaoSalvar();
    } else {
      showNotification(response.message || "Erro ao salvar simulação", "error");
    }
  } catch (error) {
    console.error("Erro ao salvar simulação:", error);
    handleError(error);
  }
}

async function confirmarSobrescrita() {
  return new Promise((resolve) => {
    const modalHtml = `
      <div id="modalSobrescrita" class="modal" style="display: flex;">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h2>Salvar Simulação</h2>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 1rem; color: var(--gray-dark);">
              Esta simulação já foi salva anteriormente. O que deseja fazer?
            </p>
            <div style="background: rgba(197, 164, 126, 0.1); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
              <strong>Sobrescrever:</strong> Atualiza a simulação existente<br>
              <strong>Criar Nova:</strong> Salva como uma nova simulação
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="resolverSobrescrita(null)">
              Cancelar
            </button>
            <button class="btn" onclick="resolverSobrescrita(false)" 
                    style="background: linear-gradient(135deg, rgb(74, 74, 74) 0%, rgb(45, 45, 45) 100%);">
              <i class="fas fa-plus"></i> Criar Nova
            </button>
            <button class="btn" onclick="resolverSobrescrita(true)">
              <i class="fas fa-save"></i> Sobrescrever
            </button>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = modalHtml;
    document.body.appendChild(tempDiv.firstElementChild);

    window.resolverSobrescrita = (valor) => {
      document.getElementById("modalSobrescrita").remove();
      delete window.resolverSobrescrita;
      resolve(valor);
    };
  });
}

function atualizarBotaoSalvar() {
  const btnSalvar = document.querySelector(
    'button[onclick*="salvarSimulacao"]'
  );
  if (btnSalvar && simulacaoId) {
    btnSalvar.innerHTML = '<i class="fas fa-save"></i> Atualizar Simulação';
  }
}

// ========== CARREGAR SIMULAÇÃO ==========
async function carregarSimulacao(id) {
  try {
    const response = await api.getSimulacao(id);

    if (response.success && response.data) {
      const sim = response.data;

      document.getElementById("titulo").value = sim.titulo || "";
      document.getElementById("descricao").value = sim.descricao || "";
      document.getElementById("cliente").value = sim.cliente?._id || "";

      const p = sim.parametros;
      if (p) {
        document.getElementById("valorImovel").value =
          p.valorImovel.toLocaleString("pt-BR");
        document.getElementById("valorCaixa").value =
          p.valorCaixa.toLocaleString("pt-BR");
        document.getElementById("aluguelInicial").value =
          p.aluguelInicial.toLocaleString("pt-BR");
        document.getElementById("duracao").value = p.duracao;
        document.getElementById("correcaoImovelIPCA").checked =
          p.correcaoImovelIPCA;
        document.getElementById("correcaoCaixaIndexador").checked =
          p.correcaoCaixaIndexador;
        document.getElementById("distribuicoesCaixaIndexador").checked =
          p.distribuicoesCaixaIndexador;
        document.getElementById("habilitarVenda").checked = p.habilitarVenda;
        document.getElementById("mesVenda").value = p.mesVenda;
        document.getElementById("valorVenda").value =
          p.valorVenda.toLocaleString("pt-BR");
        document.getElementById("ipcaAnual").value = p.ipcaAnual;
        document.getElementById("correcaoCaixaAnual").value =
          p.correcaoCaixaAnual;
        document.getElementById("waccAnual").value = p.waccAnual;
        document.getElementById("irAluguelDireto").value = p.irAluguelDireto;
        document.getElementById("irDividendoDireto").value =
          p.irDividendoDireto;
        document.getElementById("irGanhoDireto").value = p.irGanhoDireto;
        document.getElementById("itbiDireto").value = p.itbiDireto;
        document.getElementById("irAluguelFII").value = p.irAluguelFII;
        document.getElementById("irDividendoFII").value = p.irDividendoFII;
        document.getElementById("irGanhoFII").value = p.irGanhoFII;
        document.getElementById("itbiFII").value = p.itbiFII;
        document.getElementById("taxaAdmin").value = p.taxaAdmin;
        document.getElementById("minAdmin").value =
          p.minAdmin.toLocaleString("pt-BR");
        document.getElementById("taxaGestao").value = p.taxaGestao;
        document.getElementById("minGestao").value =
          p.minGestao.toLocaleString("pt-BR");
        document.getElementById("taxaCustodia").value = p.taxaCustodia;
        document.getElementById("minCustodia").value =
          p.minCustodia.toLocaleString("pt-BR");
        document.getElementById("taxaConsultoria").value = p.taxaConsultoria;
        document.getElementById("minConsultoria").value =
          p.minConsultoria.toLocaleString("pt-BR");
        document.getElementById("outrosCustos").value =
          p.outrosCustos.toLocaleString("pt-BR");

        // Taxa de distribuição
        if (p.taxaDistribuicao !== undefined) {
          document.getElementById("taxaDistribuicao").value =
            p.taxaDistribuicao;
        }
        if (p.parcelasDistribuicao !== undefined) {
          document.getElementById("parcelasDistribuicao").value =
            p.parcelasDistribuicao;
        }
        if (p.baseDistribuicao !== undefined) {
          document.getElementById("baseDistribuicao").value =
            p.baseDistribuicao;
        }

        document.getElementById("distribDireto").value = p.distribDireto;
        document.getElementById("distribFII").value = p.distribFII;
        document.getElementById("taxaVacancia").value = p.taxaVacancia;
        document.getElementById("taxaInadimplencia").value =
          p.taxaInadimplencia;
        document.getElementById("custosManutencao").value = p.custosManutencao;
      }

      // Definir o ID da simulação para detectar sobrescrita futura
      simulacaoId = id;
      
      showNotification("Simulação carregada com sucesso!", "success");

      // Atualizar botão de salvar
      atualizarBotaoSalvar();

      setTimeout(() => {
        calcular();
      }, 500);
    }
  } catch (error) {
    console.error("Erro ao carregar simulação:", error);
    handleError(error);
  }
}

// ========== MODAL DE CLIENTE ==========
function showModalCliente() {
  document.getElementById("modalCliente").style.display = "flex";
}

function closeModalCliente() {
  document.getElementById("modalCliente").style.display = "none";
}

function confirmarCliente() {
  const clienteId = document.getElementById("clienteModal").value;
  if (clienteId) {
    document.getElementById("cliente").value = clienteId;
    closeModalCliente();
    salvarSimulacao();
  } else {
    showNotification("Por favor, selecione um cliente", "error");
  }
}

function showModalCadastroCliente() {
  document.getElementById("modalCadastroCliente").style.display = "flex";
  document.getElementById("novoClienteNome").focus();
}

function closeModalCadastroCliente() {
  document.getElementById("modalCadastroCliente").style.display = "none";
  // Limpar campos
  document.getElementById("novoClienteNome").value = "";
  document.getElementById("novoClienteTipo").value = "PF";
  document.getElementById("novoClienteCpfCnpj").value = "";
  document.getElementById("novoClienteEmail").value = "";
  document.getElementById("novoClienteTelefone").value = "";
}

function ajustarCampoCpfCnpj() {
  const tipo = document.getElementById("novoClienteTipo").value;
  const input = document.getElementById("novoClienteCpfCnpj");

  if (tipo === "PF") {
    input.placeholder = "000.000.000-00";
    input.maxLength = 14;
  } else {
    input.placeholder = "00.000.000/0000-00";
    input.maxLength = 18;
  }
}

async function salvarNovoCliente() {
  try {
    const nome = document.getElementById("novoClienteNome").value.trim();
    const tipo = document.getElementById("novoClienteTipo").value;
    const cpfCnpj = document.getElementById("novoClienteCpfCnpj").value.trim();
    const email = document.getElementById("novoClienteEmail").value.trim();
    const telefone = document
      .getElementById("novoClienteTelefone")
      .value.trim();

    if (!nome) {
      showNotification("Nome é obrigatório", "error");
      return;
    }

    const novoCliente = {
      nome,
      tipo,
      cpfCnpj,
      email: email || undefined,
      telefone: telefone || undefined,
      ativo: true,
    };

    const response = await api.createCliente(novoCliente);

    if (response.success) {
      showNotification("Cliente cadastrado com sucesso!", "success");

      // Adicionar à lista de clientes
      const selectCliente = document.getElementById("cliente");
      const selectClienteModal = document.getElementById("clienteModal");

      const option = document.createElement("option");
      option.value = response.data._id;
      option.textContent = `${response.data.nome} - ${response.data.cpfCnpj}`;
      option.dataset.nome = response.data.nome.toLowerCase();
      option.dataset.cpfcnpj = response.data.cpfCnpj;

      selectCliente.appendChild(option.cloneNode(true));
      selectClienteModal.appendChild(option);

      // Selecionar o novo cliente em ambos os selects
      selectCliente.value = response.data._id;
      selectClienteModal.value = response.data._id;

      closeModalCadastroCliente();

      // Reabrir modal de seleção para confirmar
      showModalCliente();
    } else {
      showNotification(
        response.message || "Erro ao cadastrar cliente",
        "error"
      );
    }
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    handleError(error);
  }
}

// ========== MODAL DE TÍTULO ==========
function showModalTitulo() {
  // Preencher com valores atuais se existirem
  const tituloAtual = document.getElementById("titulo").value;
  const descricaoAtual = document.getElementById("descricao").value;

  document.getElementById("tituloModal").value = tituloAtual;
  document.getElementById("descricaoModal").value = descricaoAtual;

  document.getElementById("modalTitulo").style.display = "flex";
  document.getElementById("tituloModal").focus();
}

function closeModalTitulo() {
  document.getElementById("modalTitulo").style.display = "none";
}

function confirmarTitulo() {
  const titulo = document.getElementById("tituloModal").value.trim();

  if (!titulo) {
    showNotification("Por favor, informe o título da simulação", "error");
    return;
  }

  // Atualizar campos principais
  document.getElementById("titulo").value = titulo;
  document.getElementById("descricao").value = document
    .getElementById("descricaoModal")
    .value.trim();

  closeModalTitulo();

  // Continuar com o salvamento
  salvarSimulacao();
}

// ========== LIMPAR SIMULAÇÃO (COM CONFIRMAÇÃO PADRÃO) ==========
async function limparSimulacao() {
  // Verifica se a função confirmAction existe (do dashboard.js)
  if (typeof confirmAction === "function") {
    const confirmed = await confirmAction({
      title: "Limpar Simulação",
      message:
        "Tem certeza que deseja limpar toda a simulação? Esta ação não pode ser desfeita.",
      confirmText: "Sim, limpar",
      cancelText: "Cancelar",
      type: "warning",
    });

    if (confirmed) {
      location.reload();
    }
  } else {
    // Fallback caso confirmAction não exista
    if (
      confirm(
        "Tem certeza que deseja limpar toda a simulação? Esta ação não pode ser desfeita."
      )
    ) {
      location.reload();
    }
  }
}

// ========== NOTIFICAÇÕES ==========
function showNotification(message, type = "info") {
  const existing = document.querySelector(".notification");
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: ${
      type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"
    }; color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: fixed; top: 20px; right: 20px; z-index: 10001; max-width: 400px;">
      <i class="fas fa-${
        type === "success"
          ? "check-circle"
          : type === "error"
          ? "exclamation-circle"
          : "info-circle"
      }"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; margin-left: auto;">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// ========== TRATAMENTO DE ERROS ==========
function handleError(error) {
  console.error("Erro:", error);
  const message =
    error.response?.data?.message ||
    error.message ||
    "Ocorreu um erro inesperado";
  showNotification(message, "error");
}
