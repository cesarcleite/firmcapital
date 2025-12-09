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
        const resultsEl = document.getElementById("results");
        if (resultsEl) {
            resultsEl.style.display = "block";
            resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
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

// ========== CARD CRI ==========
function mostrarCardCRI() {
  const cardExistente = document.getElementById('criFullCard');
  if (cardExistente) cardExistente.remove();
  
  if (!window.resultadosSimulacao || !window.resultadosSimulacao.cri) return;
  
  const criData = window.resultadosSimulacao.cri;
  const card = document.createElement('div');
  card.id = 'criFullCard';
  card.style.cssText = 'display:block;margin-top:1.5rem;padding:1.5rem;background:white;border:1px solid #dee2e6;border-radius:8px;';
  
  card.innerHTML = `
    <h3 style="margin:0 0 1rem 0;font-size:1.1rem;color:var(--gray-dark);border-bottom:1px solid #e9ecef;padding-bottom:0.75rem;">
      CRI - Certificados de Recebíveis Imobiliários
    </h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-bottom:1rem;">
      <div style="padding:1rem;border:1px solid #e9ecef;border-radius:6px;">
        <div style="font-size:0.85rem;color:var(--gray-medium);margin-bottom:0.5rem;">Valor da Emissão</div>
        <div style="font-size:1.3rem;font-weight:600;color:var(--gray-dark);">${formatCurrency(criData.valorEmissao)}</div>
      </div>
      <div style="padding:1rem;border:1px solid #e9ecef;border-radius:6px;">
        <div style="font-size:0.85rem;color:var(--gray-medium);margin-bottom:0.5rem;">Juros Totais (Teóricos)</div>
        <div style="font-size:1.3rem;font-weight:600;color:var(--gray-dark);">${formatCurrency(criData.jurosTotais)}</div>
      </div>
      <div style="padding:1rem;border:1px solid #28a745;border-radius:6px;background:#f8fff9;">
        <div style="font-size:0.85rem;color:var(--gray-dark);margin-bottom:0.5rem;font-weight:500;">Economia Fiscal Total</div>
        <div style="font-size:1.3rem;font-weight:700;color:#28a745;">${formatCurrency(criData.economiaFiscal)}</div>
      </div>
    </div>
    <div style="padding:0.75rem;background:rgba(197,164,126,0.1);border-radius:6px;font-size:0.85rem;color:var(--gray-dark);">
      <strong>Benefício Fiscal:</strong> Dedução de 34% dos juros pagos (empresa deduz IR/CSLL). Em visão consolidada, não há movimento de caixa - apenas redução da base tributável.
    </div>
  `;
  
  const container = document.querySelector('.container') || document.querySelector('.content-area');
  if (container) {
    const botaoCalcular = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Calcular'));
    if (botaoCalcular && botaoCalcular.parentElement) {
      botaoCalcular.parentElement.insertAdjacentElement('afterend', card);
    } else {
      container.appendChild(card);
    }
  }
}
