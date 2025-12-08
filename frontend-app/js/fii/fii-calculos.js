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

// ========== CÁLCULO DE CRI (Certificados de Recebíveis Imobiliários) ==========

// Calcular cronograma de CRI - SAC (Sistema de Amortização Constante)
function calcularSAC_CRI(valorEmissao, taxaMensal, numParcelas, carenciaMeses) {
  const amortizacaoMensal = valorEmissao / numParcelas;
  const cronograma = [];
  let saldoDevedor = valorEmissao;

  for (let i = 1; i <= numParcelas; i++) {
    const juros = saldoDevedor * taxaMensal;
    const amortizacao = i > carenciaMeses ? amortizacaoMensal : 0;
    const parcela = juros + amortizacao;

    cronograma.push({
      periodo: i,
      juros: juros,
      amortizacao: amortizacao,
      parcela: parcela,
      saldoDevedor: saldoDevedor
    });

    saldoDevedor -= amortizacao;
  }

  return cronograma;
}

// Calcular cronograma de CRI - PRICE (Tabela Price - Parcelas Fixas)
function calcularPrice_CRI(valorEmissao, taxaMensal, numParcelas, carenciaMeses) {
  const cronograma = [];
  let saldoDevedor = valorEmissao;

  // Calcular parcela fixa (após carência)
  const parcelasAmortizacao = numParcelas - carenciaMeses;
  const parcelaFixa = parcelasAmortizacao > 0 
    ? valorEmissao * (taxaMensal * Math.pow(1 + taxaMensal, parcelasAmortizacao)) / 
      (Math.pow(1 + taxaMensal, parcelasAmortizacao) - 1)
    : 0;

  for (let i = 1; i <= numParcelas; i++) {
    const juros = saldoDevedor * taxaMensal;
    const amortizacao = i > carenciaMeses ? (parcelaFixa - juros) : 0;
    const parcela = juros + amortizacao;

    cronograma.push({
      periodo: i,
      juros: juros,
      amortizacao: amortizacao,
      parcela: parcela,
      saldoDevedor: saldoDevedor
    });

    saldoDevedor -= amortizacao;
  }

  return cronograma;
}

// Calcular cronograma de CRI - BULLET (Pagamento único no vencimento)
function calcularBullet_CRI(valorEmissao, taxaMensal, numParcelas, carenciaMeses) {
  const cronograma = [];

  for (let i = 1; i <= numParcelas; i++) {
    const juros = valorEmissao * taxaMensal;
    const amortizacao = (i === numParcelas) ? valorEmissao : 0;
    const parcela = juros + amortizacao;

    cronograma.push({
      periodo: i,
      juros: juros,
      amortizacao: amortizacao,
      parcela: parcela,
      saldoDevedor: valorEmissao - amortizacao
    });
  }

  return cronograma;
}

// Calcular custos de emissão de CRI
function calcularCustosEmissaoCRI(config) {
  const valorEmissao = config.valorEmissao;
  
  const taxaCVM = valorEmissao * (config.custoCRI_CVM / 100);
  const coordenador = valorEmissao * (config.custoCRI_Coordenador / 100);
  const agente = config.custoCRI_Agente;
  const juridica = config.custoCRI_Juridica;
  const outros = config.custoCRI_Outros;
  
  const total = taxaCVM + coordenador + agente + juridica + outros;
  
  return {
    taxaCVM,
    coordenador,
    agente,
    juridica,
    outros,
    total
  };
}

// Calcular parcela de CRI para um mês específico
function calcularParcelaCRI(mes, config, cronograma) {
  if (!config.habilitarCRI || !cronograma) {
    return null;
  }

  const mesEmissao = config.mesEmissao;
  const periodicidade = config.periodicidadeCRI;

  // Mês de emissão: retorna entrada de recursos e custos
  if (mes === mesEmissao) {
    const custos = calcularCustosEmissaoCRI(config);
    const recursosLiquidos = config.valorEmissao - custos.total;
    
    return {
      tipo: 'emissao',
      entrada: recursosLiquidos,
      custos: custos
    };
  }

  // Verificar se é mês de pagamento
  const mesesDesdeEmissao = mes - mesEmissao;
  
  if (mesesDesdeEmissao > 0 && mesesDesdeEmissao % periodicidade === 0) {
    const indiceParcela = Math.floor(mesesDesdeEmissao / periodicidade);
    
    if (indiceParcela > 0 && indiceParcela <= cronograma.length) {
      const parcela = cronograma[indiceParcela - 1];
      
      return {
        tipo: 'pagamento',
        juros: parcela.juros,
        amortizacao: parcela.amortizacao,
        parcela: parcela.parcela,
        saldoDevedor: parcela.saldoDevedor
      };
    }
  }

  return null;
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

  // ========== CRI: LER CONFIGURAÇÃO ==========
  const habilitarCRI = document.getElementById("habilitarCRI")?.checked || false;
  const cdiAnual = parseFloat(document.getElementById("cdiAnual")?.value || 15) / 100;
  
  let configCRI = null;
  let cronogramaCRI = null;

  if (habilitarCRI) {
    const valorEmissaoCRI = parseCurrencyInput(document.getElementById("valorEmissaoCRI"));
    const prazoAnosCRI = parseInt(document.getElementById("prazoCRI").value);
    const carenciaAnosCRI = parseInt(document.getElementById("carenciaCRI").value);
    const sistemaCRI = document.getElementById("sistemaAmortizacaoCRI").value;
    const periodicidadeCRI = parseInt(document.getElementById("periodicidadeCRI").value);
    const mesEmissaoCRI = parseInt(document.getElementById("mesEmissaoCRI").value);
    const indexadorCRI = document.getElementById("indexadorCRI").value;
    const taxaJurosCRI_input = parseFloat(document.getElementById("taxaJurosCRI").value.replace(',', '.'));

    // Calcular taxa mensal baseada no indexador
    let taxaMensalCRI;
    
    if (indexadorCRI === 'cdi') {
      // CDI: usar percentual do CDI
      const cdiMensal = Math.pow(1 + cdiAnual, 1 / 12) - 1;
      taxaMensalCRI = cdiMensal * (taxaJurosCRI_input / 100);
    } else if (indexadorCRI === 'ipca') {
      // IPCA + taxa
      const ipcaMensalCalc = Math.pow(1 + ipcaAnual, 1 / 12) - 1;
      const taxaAdicional = Math.pow(1 + (taxaJurosCRI_input / 100), 1 / 12) - 1;
      taxaMensalCRI = (1 + ipcaMensalCalc) * (1 + taxaAdicional) - 1;
    } else if (indexadorCRI === 'prefixado') {
      // Taxa pré-fixada anual convertida para mensal
      taxaMensalCRI = Math.pow(1 + (taxaJurosCRI_input / 100), 1 / 12) - 1;
    } else if (indexadorCRI === 'igpm') {
      // IGP-M (simplificado: usar mesma taxa que IPCA)
      const igpmMensal = Math.pow(1 + ipcaAnual, 1 / 12) - 1;
      const taxaAdicional = Math.pow(1 + (taxaJurosCRI_input / 100), 1 / 12) - 1;
      taxaMensalCRI = (1 + igpmMensal) * (1 + taxaAdicional) - 1;
    }

    const totalParcelasCRI = Math.floor((prazoAnosCRI * 12) / periodicidadeCRI);
    const carenciaMesesCRI = carenciaAnosCRI * 12;
    const carenciaParcelasCRI = Math.floor(carenciaMesesCRI / periodicidadeCRI);

    // Gerar cronograma baseado no sistema
    if (sistemaCRI === 'sac') {
      cronogramaCRI = calcularSAC_CRI(valorEmissaoCRI, taxaMensalCRI, totalParcelasCRI, carenciaParcelasCRI);
    } else if (sistemaCRI === 'price') {
      cronogramaCRI = calcularPrice_CRI(valorEmissaoCRI, taxaMensalCRI, totalParcelasCRI, carenciaParcelasCRI);
    } else if (sistemaCRI === 'bullet') {
      cronogramaCRI = calcularBullet_CRI(valorEmissaoCRI, taxaMensalCRI, totalParcelasCRI, carenciaParcelasCRI);
    }

    configCRI = {
      habilitarCRI: true,
      valorEmissao: valorEmissaoCRI,
      prazoAnos: prazoAnosCRI,
      carenciaAnos: carenciaAnosCRI,
      sistema: sistemaCRI,
      periodicidadeCRI: periodicidadeCRI,
      mesEmissao: mesEmissaoCRI,
      indexador: indexadorCRI,
      taxaJurosCRI: taxaJurosCRI_input,
      taxaMensalCRI: taxaMensalCRI,
      custoCRI_CVM: parseFloat(document.getElementById("custoCRI_CVM").value.replace(',', '.')),
      custoCRI_Coordenador: parseFloat(document.getElementById("custoCRI_Coordenador").value.replace(',', '.')),
      custoCRI_Agente: parseCurrencyInput(document.getElementById("custoCRI_Agente")),
      custoCRI_Juridica: parseCurrencyInput(document.getElementById("custoCRI_Juridica")),
      custoCRI_Outros: parseCurrencyInput(document.getElementById("custoCRI_Outros"))
    };

    console.log('CRI Configurado:', configCRI);
    console.log('Cronograma CRI gerado:', cronogramaCRI);
  }

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

    // totalCustos: apenas custos operacionais reais, SEM IR de venda
    // (irVenda já foi descontado do caixa na linha 269)
    const totalCustos = custosOperacionais + custoITBI + irAluguel;
    const lucroOperacional = aluguelEfetivo - totalCustos;

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

    // ROE e DY: tratamento especial para meses com venda
    let roe, dy;
    if (receitaVenda > 0) {
      // No mês da venda, ROE = ganho total / PL início
      const ganhoVenda = valorVenda - irVenda - valorImovelAtualDireto;
      const resultadoTotal = aluguelEfetivo - custosOperacionais + ganhoVenda;
      roe = plInicio > 0 ? (resultadoTotal / plInicio) * 100 : 0;
      dy = plInicio > 0 ? (dividendo / plInicio) * 100 : 0;
    } else {
      // Cálculo normal
      roe = plInicio > 0 ? ((dividendo + reinvestimento) / plInicio) * 100 : 0;
      dy = plInicio > 0 ? (dividendo / plInicio) * 100 : 0;
    }
    
    // Para meses com venda, calcular margem considerando a receita de venda
    let margem;
    if (receitaVenda > 0) {
      // Margem baseada no ganho total vs receita total
      const receitaTotal = aluguelEfetivo + receitaVenda;
      const ganhoLiquido = receitaVenda - irVenda + aluguelEfetivo - custosOperacionais;
      margem = receitaTotal > 0 ? (ganhoLiquido / receitaTotal) * 100 : 0;
    } else {
      // Margem = Dividendo Líquido / Receita Bruta (quanto da receita vira dividendo)
      margem = aluguelBruto > 0 ? (dividendo / aluguelBruto) * 100 : 0;
    }


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

    // ========== CRI: CONSOLIDADO ==========
    // Visão consolidada: FII = Empresa
    // Empresa paga parcela → FII recebe parcela = ZERO no consolidado
    // ÚNICA diferença: juros deduzem da base de IR
    
    let jurosCRI = 0;           // Juros do mês (dedutíveis do IR)
    let custosEmissaoMesCRI = 0;   // Custos de emissão CRI
    
    // TODO: Implementar leitura de habilitarCRI e configuração
    // Por enquanto, deixar como 0 para não quebrar cálculos existentes
    
    // Base de IR: lucro MENOS juros dedutíveis do CRI
    const baseIRAluguel = Math.max(0, aluguelEfetivo - jurosCRI);
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

    const lucroOperacional = aluguelEfetivo - totalCustosFII;

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

    // ROE e DY: tratamento especial para meses com venda
    let roe, dy;
    if (receitaVenda > 0) {
      // No mês da venda, ROE = ganho total / PL início
      const ganhoVenda = valorVenda - irVenda - valorImovelAtualFII;
      const resultadoTotal = aluguelEfetivo - totalCustosFII + ganhoVenda;
      roe = plInicio > 0 ? (resultadoTotal / plInicio) * 100 : 0;
      dy = plInicio > 0 ? (dividendo / plInicio) * 100 : 0;
    } else {
      // Cálculo normal
      roe = plInicio > 0 ? ((dividendo + reinvestimento) / plInicio) * 100 : 0;
      dy = plInicio > 0 ? (dividendo / plInicio) * 100 : 0;
    }
    
    // Para meses com venda, calcular margem considerando a receita de venda
    let margem;
    if (receitaVenda > 0) {
      // Margem baseada no ganho total vs receita total
      const receitaTotal = aluguelEfetivo + receitaVenda;
      const ganhoLiquido = receitaVenda - irVenda + aluguelEfetivo - totalCustosFII;
      margem = receitaTotal > 0 ? (ganhoLiquido / receitaTotal) * 100 : 0;
    } else {
      // Margem = Dividendo Líquido / Receita Bruta (quanto da receita vira dividendo)
      margem = aluguelBruto > 0 ? (dividendo / aluguelBruto) * 100 : 0;
    }


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


  // Cálculo da TIR
  // CashFlow já foi construído no loop com dividendos mensais
  // Adicionar apenas plFinal ao último mês (que já tem o dividendo do mês)
  const ultimoMesDireto = cashFlowDireto.length - 1;
  const ultimoMesFII = cashFlowFII.length - 1;
  
  if (ultimoMesDireto >= 0) {
    cashFlowDireto[ultimoMesDireto] = (cashFlowDireto[ultimoMesDireto] || 0) + plFinalDireto;
  }
  
  if (ultimoMesFII >= 0) {
    cashFlowFII[ultimoMesFII] = (cashFlowFII[ultimoMesFII] || 0) + plFinalFII;
  }

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
