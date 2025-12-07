// ========== FILTRO DE CUSTOS DO GRÁFICO ==========
function setupCostFilters() {
  const checkboxes = document.querySelectorAll('.cost-filter-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateCostChart();
    });
  });
}

function updateCostChart() {
  if (!charts.custos || !window.allCostDatasets) return;
  
  const checkboxes = document.querySelectorAll('.cost-filter-checkbox');
  const selectedCosts = [];
  
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedCosts.push(checkbox.dataset.cost);
    }
  });
  
  // Filtrar datasets baseado na seleção
  const filteredDatasets = window.allCostDatasets.filter(dataset => 
    selectedCosts.includes(dataset.id)
  );
  
  // Atualizar gráfico
  charts.custos.data.datasets = filteredDatasets;
  charts.custos.update();
}
