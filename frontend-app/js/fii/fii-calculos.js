// ========== TAXAS REGULATÓRIAS ==========
let taxasCVM = {
  anual: null,
  registro: null,
  oferta: null,
};
let taxasANBIMA = {
  registro: null,
  oferta: null,
};

// Organizar taxas por tipo (usa a variável global taxasRegulatorias do fii-interface.js)
function organizarTaxasPorTipo() {
  if (!window.taxasRegulatorias || window.taxasRegulatorias.length === 0)
    return;

  window.taxasRegulatorias.forEach((taxa) => {
    if (!taxa.ativo) return;

    switch (taxa.tipo) {
      case "cvm_anual":
        taxasCVM.anual = taxa;
        break;
      case "cvm_registro":
        taxasCVM.registro = taxa;
        break;
      case "cvm_oferta":
        taxasCVM.oferta = taxa;
        break;
      case "anbima_registro":
        taxasANBIMA.registro = taxa;
        break;
      case "anbima_oferta":
        taxasANBIMA.oferta = taxa;
        break;
    }
  });
}

// Calcular taxa CVM Anual (faixas de PL)
function calcularTaxaCVMAnual(pl) {
  if (!taxasCVM.anual) return 0;

  const taxa = taxasCVM.anual;

  if (
    taxa.tipoCalculo === "faixas_pl" &&
    taxa.faixas &&
    taxa.faixas.length > 0
  ) {
    const faixaAplicavel = taxa.faixas.find(
      (f) => pl >= f.plMinimo && pl <= f.plMaximo
    );

    if (faixaAplicavel) {
      const valorCalculado = pl * (faixaAplicavel.aliquota / 100);
      return Math.max(valorCalculado, taxa.valorMinimo || 0);
    }

    const ultimaFaixa = taxa.faixas[taxa.faixas.length - 1];
    const valorCalculado = pl * (ultimaFaixa.aliquota / 100);
    return Math.max(valorCalculado, taxa.valorMinimo || 0);
  }

  return taxa.valorMinimo || 0;
}

// Calcular taxa CVM Registro (única)
function calcularTaxaCVMRegistro() {
  if (!taxasCVM.registro) return 0;
  return taxasCVM.registro.valorFixo || 0;
}

// Calcular taxa ANBIMA Registro (única)
function calcularTaxaANBIMARegistro() {
  if (!taxasANBIMA.registro) return 0;
  return taxasANBIMA.registro.valorFixo || 0;
}

// Calcular taxa CVM/ANBIMA Oferta (sobre valor da oferta)
function calcularTaxaOferta(valorOferta) {
  let totalTaxaOferta = 0;

  if (taxasCVM.oferta) {
    const taxa = taxasCVM.oferta;
    if (taxa.tipoCalculo === "percentual_com_minimo") {
      const valorCalculado = valorOferta * (taxa.percentual / 100);
      totalTaxaOferta += Math.max(valorCalculado, taxa.valorMinimo || 0);
    }
  }

  if (taxasANBIMA.oferta) {
    const taxa = taxasANBIMA.oferta;
    if (taxa.tipoCalculo === "percentual_com_minimo") {
      const valorCalculado = valorOferta * (taxa.percentual / 100);
      totalTaxaOferta += Math.max(valorCalculado, taxa.valorMinimo || 0);
    }
  }

  return totalTaxaOferta;
}

// ========== CÁLCULO PRINCIPAL ==========
function performCalculation() {
  console.log("Iniciando cálculo...");
  // Organizar taxas regulatórias antes de calcular
  organizarTaxasPorTipo();

  // Coletar todos os parâmetros
  const valorImovelInicial = parseCurrencyInput(
    document.getElementById("valorImovel")
  );
  const valorCaixaInicial = parseCurrencyInput(
    document.getElementById("valorCaixa")
  );
  const investimentoInicial = valorImovelInicial + valorCaixaInicial;
  const aluguelInicial = parseCurrencyInput(
    document.getElementById("aluguelInicial")
  );
  const duracao = parseInt(document.getElementById("duracao").value);

  const correcaoImovelIPCA =
    document.getElementById("correcaoImovelIPCA").checked;
  const correcaoCaixaIndexador = document.getElementById(
    "correcaoCaixaIndexador"
  ).checked;
  const distribuicoesCaixaIndexador = document.getElementById(
    "distribuicoesCaixaIndexador"
  ).checked;

  const habilitarVenda = document.getElementById("habilitarVenda").checked;
  const mesVenda = parseInt(document.getElementById("mesVenda").value);
  const valorVenda = parseCurrencyInput(document.getElementById("valorVenda"));

  const ipcaAnual =
    parseFloat(document.getElementById("ipcaAnual").value) / 100;
  const correcaoCaixaAnual =
    parseFloat(document.getElementById("correcaoCaixaAnual").value) / 100;
  const waccAnual =
    parseFloat(document.getElementById("waccAnual").value) / 100;

  // Tributação
  const irAluguelDireto =
    parseFloat(document.getElementById("irAluguelDireto").value) / 100;
  const irDividendoDireto =
    parseFloat(document.getElementById("irDividendoDireto").value) / 100;
  const irGanhoDireto =
    parseFloat(document.getElementById("irGanhoDireto").value) / 100;
  const itbiDireto =
    parseFloat(document.getElementById("itbiDireto").value) / 100;
  const irAluguelFII =
    parseFloat(document.getElementById("irAluguelFII").value) / 100;
  const irDividendoFII =
    parseFloat(document.getElementById("irDividendoFII").value) / 100;
  const irGanhoFII =
    parseFloat(document.getElementById("irGanhoFII").value) / 100;
  const itbiFII = parseFloat(document.getElementById("itbiFII").value) / 100;

  // Custos FII
  const taxaAdmin =
    parseFloat(document.getElementById("taxaAdmin").value) / 100;
  const minAdmin = parseCurrencyInput(document.getElementById("minAdmin"));
  const taxaGestao =
    parseFloat(document.getElementById("taxaGestao").value) / 100;
  const minGestao = parseCurrencyInput(document.getElementById("minGestao"));
  const taxaCustodia =
    parseFloat(document.getElementById("taxaCustodia").value) / 100;
  const minCustodia = parseCurrencyInput(
    document.getElementById("minCustodia")
  );
  const taxaConsultoria =
    parseFloat(document.getElementById("taxaConsultoria").value) / 100;
  const minConsultoria = parseCurrencyInput(
    document.getElementById("minConsultoria")
  );
  const outrosCustos = parseCurrencyInput(
    document.getElementById("outrosCustos")
  );

  // Taxa de Distribuição
  const taxaDistribuicao =
    parseFloat(document.getElementById("taxaDistribuicao").value) / 100;
  const parcelasDistribuicao = parseInt(
    document.getElementById("parcelasDistribuicao").value
  );
  const baseDistribuicao = document.getElementById("baseDistribuicao").value;

  // Calcular valor da taxa de distribuição
  const baseCalculo =
    baseDistribuicao === "imovel" ? valorImovelInicial : investimentoInicial;
  const taxaDistribuicaoTotal = baseCalculo * taxaDistribuicao;
  const taxaDistribuicaoMensal = taxaDistribuicaoTotal / parcelasDistribuicao;

  // Distribuição
  const distribDireto =
    parseFloat(document.getElementById("distribDireto").value) / 100;
  const distribFII =
    parseFloat(document.getElementById("distribFII").value) / 100;

  // Custos operacionais
  const taxaVacancia =
    parseFloat(document.getElementById("taxaVacancia").value) / 100;
  const taxaInadimplencia =
    parseFloat(document.getElementById("taxaInadimplencia").value) / 100;
  const custosManutencao =
    parseFloat(document.getElementById("custosManutencao").value) / 100;

  if (
    investimentoInicial <= 0 ||
    aluguelInicial <= 0 ||
    duracao <= 0 ||
    (habilitarVenda && (valorVenda <= 0 || mesVenda <= 0 || mesVenda > duracao))
  ) {
    throw new Error("Valores de entrada inválidos. Verifique todos os campos.");
  }

  const ipcaMensal = Math.pow(1 + ipcaAnual, 1 / 12) - 1;
  const correcaoCaixaMensal = Math.pow(1 + correcaoCaixaAnual, 1 / 12) - 1;
  const waccMensal = Math.pow(1 + waccAnual, 1 / 12) - 1;

  // Calcula aluguéis mensais
  let alugueis = new Array(duracao + 1).fill(0);
  alugueis[1] = aluguelInicial;
  for (let m = 2; m <= duracao; m++) {
    alugueis[m] = alugueis[m - 1] * (1 + ipcaMensal);
  }

  dividendosDistribuidos = { direto: [], fii: [] };

  // SIMULAÇÃO INVESTIMENTO DIRETO
  let totalDividendosDireto = 0;
  let valorInicialDireto =
    investimentoInicial + investimentoInicial * itbiDireto;
  let cashFlowDireto = [-valorInicialDireto];
  let detalheDireto = [];

  let valorImovelAtualDireto = valorImovelInicial;
  let valorCaixaAtualDireto = valorCaixaInicial;

  for (let m = 1; m <= duracao; m++) {
    if (m > 1) {
      if (correcaoImovelIPCA) {
        valorImovelAtualDireto = valorImovelAtualDireto * (1 + ipcaMensal);
      }
      if (correcaoCaixaIndexador) {
        valorCaixaAtualDireto =
          valorCaixaAtualDireto * (1 + correcaoCaixaMensal);
      }
    }

    const plInicio = valorImovelAtualDireto + valorCaixaAtualDireto;

    const aluguelBruto = alugueis[m];
    const perdaVacancia = aluguelBruto * taxaVacancia;
    const perdaInadimplencia = aluguelBruto * taxaInadimplencia;
    const aluguelEfetivo = aluguelBruto - perdaVacancia - perdaInadimplencia;
    const custosOperacionais = valorImovelInicial * (custosManutencao / 12);
    const custoITBI = m === 1 ? investimentoInicial * itbiDireto : 0;
    const baseIR = Math.max(0, aluguelEfetivo - custosOperacionais);
    const irAluguel = baseIR * irAluguelDireto;

    let receitaVenda = 0,
      irVenda = 0;

    if (habilitarVenda && m === mesVenda) {
      receitaVenda = valorVenda;
      const ganhoCapital = Math.max(0, valorVenda - valorImovelInicial);
      irVenda = ganhoCapital * irGanhoDireto;
      valorCaixaAtualDireto += valorVenda - irVenda;
      valorImovelAtualDireto = 0;
    }

    const totalCustos = custosOperacionais + custoITBI + irAluguel + irVenda;
    const lucroOperacional = aluguelEfetivo + receitaVenda - totalCustos;

    let irDividendo = 0;
    let dividendo = 0;
    let reinvestimento = 0;

    if (lucroOperacional > 0) {
      const lucroADistribuir = lucroOperacional * distribDireto;
      irDividendo = lucroADistribuir * irDividendoDireto;
      dividendo = lucroADistribuir - irDividendo;
      reinvestimento = lucroOperacional * (1 - distribDireto);
    } else {
      dividendo = 0;
      irDividendo = 0;
      reinvestimento = lucroOperacional;
    }

    dividendosDistribuidos.direto.push({
      mes: m,
      valor: dividendo,
      valorCorrigido: dividendo,
    });

    totalDividendosDireto += dividendo;
    cashFlowDireto.push(dividendo);

    const roe = plInicio > 0 ? ((dividendo + reinvestimento) / plInicio) * 100 : 0;
    const dy = plInicio > 0 ? (dividendo / plInicio) * 100 : 0;
    const margemBase = distribDireto * aluguelBruto;
    const margem = margemBase > 0 ? (dividendo / margemBase) * 100 : 0;

    if (!habilitarVenda || m !== mesVenda) {
      valorCaixaAtualDireto += reinvestimento;
    }

    const plFinal = valorImovelAtualDireto + valorCaixaAtualDireto;

    detalheDireto.push({
      mes: m,
      valorImovel: valorImovelAtualDireto,
      valorCaixa: valorCaixaAtualDireto,
      plInicio,
      plFinal,
      aluguelBruto,
      perdaVacancia,
      perdaInadimplencia,
      aluguelEfetivo,
      custosOperacionais,
      custoITBI,
      irAluguel,
      receitaVenda,
      irVenda,
      totalCustos,
      lucroOperacional,
      irDividendo,
      dividendo,
      reinvestimento,
      roe,
      dy,
      margem,
      dividendoAcumulado: totalDividendosDireto,
    });
  }

  // SIMULAÇÃO FII
  let totalDividendosFII = 0;
  let valorInicialFII = investimentoInicial + investimentoInicial * itbiFII;
  let cashFlowFII = [-valorInicialFII];
  let detalheFII = [];
  custosFII = [];

  let valorImovelAtualFII = valorImovelInicial;
  let valorCaixaAtualFII = valorCaixaInicial;

  // Taxas regulatórias no primeiro mês (registro)
  const taxaCVMRegistroTotal = calcularTaxaCVMRegistro();
  const taxaANBIMARegistroTotal = calcularTaxaANBIMARegistro();

  for (let m = 1; m <= duracao; m++) {
    if (m > 1) {
      if (correcaoImovelIPCA) {
        valorImovelAtualFII = valorImovelAtualFII * (1 + ipcaMensal);
      }
      if (correcaoCaixaIndexador) {
        valorCaixaAtualFII = valorCaixaAtualFII * (1 + correcaoCaixaMensal);
      }
    }

    const plInicio = valorImovelAtualFII + valorCaixaAtualFII;

    const aluguelBruto = alugueis[m];
    const perdaVacancia = aluguelBruto * taxaVacancia;
    const perdaInadimplencia = aluguelBruto * taxaInadimplencia;
    const aluguelEfetivo = aluguelBruto - perdaVacancia - perdaInadimplencia;

    const custosAdmin = Math.max(plInicio * (taxaAdmin / 12), minAdmin);
    const custosGestao = Math.max(plInicio * (taxaGestao / 12), minGestao);
    const custosCustodia = Math.max(
      plInicio * (taxaCustodia / 12),
      minCustodia
    );
    const custosConsultoria = Math.max(
      plInicio * (taxaConsultoria / 12),
      minConsultoria
    );
    const custoITBI = m === 1 ? investimentoInicial * itbiFII : 0;

    const baseIRAluguel = Math.max(0, aluguelEfetivo);
    const irAluguel = baseIRAluguel * irAluguelFII;

    // Taxas regulatórias
    let taxaCVMAnualMes = 0;
    let taxaCVMRegistroMes = 0;
    let taxaANBIMARegistroMes = 0;

    // No primeiro mês: taxa de registro
    if (m === 1) {
      taxaCVMRegistroMes = taxaCVMRegistroTotal;
      taxaANBIMARegistroMes = taxaANBIMARegistroTotal;
    }

    // Taxa CVM Anual: proporcional mensal
    if (taxasCVM.anual) {
      const taxaAnualTotal = calcularTaxaCVMAnual(plInicio);
      taxaCVMAnualMes = taxaAnualTotal / 12;
    }

    // Taxa de Distribuição (nos primeiros X meses)
    let taxaDistribuicaoMes = 0;
    if (m <= parcelasDistribuicao) {
      taxaDistribuicaoMes = taxaDistribuicaoMensal;
    }

    let receitaVenda = 0,
      irVenda = 0;

    if (habilitarVenda && m === mesVenda) {
      receitaVenda = valorVenda;
      const ganhoCapital = Math.max(0, valorVenda - valorImovelInicial);
      irVenda = ganhoCapital * irGanhoFII;
      valorCaixaAtualFII += valorVenda - irVenda;
      valorImovelAtualFII = 0;
    }

    const totalCustosFII =
      custosAdmin +
      custosGestao +
      custosCustodia +
      custosConsultoria +
      outrosCustos +
      custoITBI +
      irAluguel +
      taxaCVMAnualMes +
      taxaCVMRegistroMes +
      taxaANBIMARegistroMes +
      taxaDistribuicaoMes;

    const lucroOperacional = aluguelEfetivo + receitaVenda - totalCustosFII;

    let irDividendo = 0;
    let dividendo = 0;
    let reinvestimento = 0;

    if (lucroOperacional > 0) {
      const lucroDistribuivel = lucroOperacional * distribFII;
      irDividendo = lucroDistribuivel * irDividendoFII;
      dividendo = lucroDistribuivel - irDividendo;
      reinvestimento = lucroOperacional * (1 - distribFII);
    } else {
      dividendo = 0;
      irDividendo = 0;
      reinvestimento = lucroOperacional;
    }

    dividendosDistribuidos.fii.push({
      mes: m,
      valor: dividendo,
      valorCorrigido: dividendo,
    });

    totalDividendosFII += dividendo;
    cashFlowFII.push(dividendo);

    // ROE = (Dividendo Distribuído + Reinvestimento) / PL Início * 100
    const roe = plInicio > 0 ? ((dividendo + reinvestimento) / plInicio) * 100 : 0;
    // DY = Dividendo Líquido Distribuído / PL Início * 100
    const dy = plInicio > 0 ? (dividendo / plInicio) * 100 : 0;
    const margemBase = distribFII * aluguelBruto;
    const margem = margemBase > 0 ? (dividendo / margemBase) * 100 : 0;

    if (!habilitarVenda || m !== mesVenda) {
      valorCaixaAtualFII += reinvestimento;
    }

    const plFinal = valorImovelAtualFII + valorCaixaAtualFII;

    detalheFII.push({
      mes: m,
      valorImovel: valorImovelAtualFII,
      valorCaixa: valorCaixaAtualFII,
      plInicio,
      plFinal,
      aluguelBruto,
      perdaVacancia,
      perdaInadimplencia,
      aluguelEfetivo,
      custosAdmin,
      custosGestao,
      custosCustodia,
      custosConsultoria,
      custoITBI,
      irAluguel,
      outrosCustosMes: outrosCustos,
      taxaCVMAnualMes,
      taxaCVMRegistroMes,
      taxaANBIMARegistroMes,
      taxaDistribuicaoMes,
      totalCustosFII,
      receitaVenda,
      irVenda,
      lucroOperacional,
      irDividendo,
      dividendo,
      reinvestimento,
      roe,
      dy,
      margem,
      dividendoAcumulado: totalDividendosFII,
    });

    custosFII.push({
      mes: m,
      admin: custosAdmin,
      gestao: custosGestao,
      custodia: custosCustodia,
      consultoria: custosConsultoria,
      outros: outrosCustos,
      itbi: custoITBI,
      irAluguel: irAluguel,
      cvmAnual: taxaCVMAnualMes,
      cvmRegistro: taxaCVMRegistroMes,
      anbimaRegistro: taxaANBIMARegistroMes,
      distribuicao: taxaDistribuicaoMes,
      total: totalCustosFII,
      aluguel: aluguelBruto,
    });
  }
  
  window.custosFII = custosFII; // ✅ Expor globalmente para debug/interface

  if (distribuicoesCaixaIndexador) {
    totalDividendosDireto = 0;
    totalDividendosFII = 0;

    for (let i = 0; i < dividendosDistribuidos.direto.length; i++) {
      const mesesParaFinal = duracao - dividendosDistribuidos.direto[i].mes;
      const fatorCorrecao = Math.pow(1 + correcaoCaixaMensal, mesesParaFinal);
      dividendosDistribuidos.direto[i].valorCorrigido =
        dividendosDistribuidos.direto[i].valor * fatorCorrecao;
      totalDividendosDireto += dividendosDistribuidos.direto[i].valorCorrigido;
    }

    for (let i = 0; i < dividendosDistribuidos.fii.length; i++) {
      const mesesParaFinal = duracao - dividendosDistribuidos.fii[i].mes;
      const fatorCorrecao = Math.pow(1 + correcaoCaixaMensal, mesesParaFinal);
      dividendosDistribuidos.fii[i].valorCorrigido =
        dividendosDistribuidos.fii[i].valor * fatorCorrecao;
      totalDividendosFII += dividendosDistribuidos.fii[i].valorCorrigido;
    }
  }

  dadosDireto = detalheDireto;
  dadosFII = detalheFII;

  const plFinalDireto =
    dadosDireto.length > 0
      ? dadosDireto[dadosDireto.length - 1].plFinal
      : investimentoInicial;
  const plFinalFII =
    dadosFII.length > 0
      ? dadosFII[dadosFII.length - 1].plFinal
      : investimentoInicial;

  const valorTotalDireto = totalDividendosDireto + plFinalDireto;
  const valorTotalFII = totalDividendosFII + plFinalFII;

  cashFlowDireto.push(plFinalDireto);
  cashFlowFII.push(plFinalFII);

  const tirDiretoMensal = calcularTIR(cashFlowDireto);
  const tirFIIMensal = calcularTIR(cashFlowFII);
  const tirDiretoAnual = isFinite(tirDiretoMensal)
    ? (Math.pow(1 + tirDiretoMensal, 12) - 1) * 100
    : 0;
  const tirFIIAnual = isFinite(tirFIIMensal)
    ? (Math.pow(1 + tirFIIMensal, 12) - 1) * 100
    : 0;

  const roeMedioDireto =
    dadosDireto.reduce((sum, d) => sum + (isFinite(d.roe) ? d.roe : 0), 0) /
    dadosDireto.length;
  const roeMedioFII =
    dadosFII.reduce((sum, d) => sum + (isFinite(d.roe) ? d.roe : 0), 0) /
    dadosFII.length;
  const dyMedioDireto =
    dadosDireto.reduce((sum, d) => sum + (isFinite(d.dy) ? d.dy : 0), 0) /
    dadosDireto.length;
  const dyMedioFII =
    dadosFII.reduce((sum, d) => sum + (isFinite(d.dy) ? d.dy : 0), 0) /
    dadosFII.length;
  const margemMedioDireto =
    dadosDireto.reduce(
      (sum, d) => sum + (isFinite(d.margem) ? d.margem : 0),
      0
    ) / dadosDireto.length;
  const margemMedioFII =
    dadosFII.reduce((sum, d) => sum + (isFinite(d.margem) ? d.margem : 0), 0) /
    dadosFII.length;

  // ✅ CORREÇÃO: Armazenar resultados consolidados para o PDF (igual ao FIP-IE)
  window.resultadosSimulacao = {
    direto: {
      totalDividendos: totalDividendosDireto,
      plFinal: plFinalDireto,
      valorTotal: valorTotalDireto,
      roeMedio: roeMedioDireto,
      dyMedio: dyMedioDireto,
      margemMedia: margemMedioDireto,
      tir: tirDiretoAnual
    },
    fii: {
      totalDividendos: totalDividendosFII,
      plFinal: plFinalFII,
      valorTotal: valorTotalFII,
      roeMedio: roeMedioFII,
      dyMedio: dyMedioFII,
      margemMedia: margemMedioFII,
      tir: tirFIIAnual
    },
    diferenca: valorTotalFII - valorTotalDireto,
    diferencaPct: ((valorTotalFII - valorTotalDireto) / valorTotalDireto) * 100
  };

  updateInterface(
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
  );

  mostrarAlertas();
  updateCharts();
  updateTables();
  updateSensitivity();
}

// ========== CÁLCULO TIR ==========
function calcularTIR(cashflows) {
  if (cashflows.length < 2) return 0;

  const precision = 0.000001;
  let low = -0.99;
  let high = 5;
  let iterations = 0;
  const maxIterations = 1000;

  while (high - low > precision && iterations < maxIterations) {
    const mid = (low + high) / 2;
    let npv = 0;

    for (let i = 0; i < cashflows.length; i++) {
      npv += cashflows[i] / Math.pow(1 + mid, i);
    }

    if (Math.abs(npv) < precision) break;
    if (npv > 0) low = mid;
    else high = mid;
    iterations++;
  }

  const result = (low + high) / 2;
  return isFinite(result) ? result : 0;
}
