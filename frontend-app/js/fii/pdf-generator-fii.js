/**
 * Gerador de PDF Premium para Simulação FII vs Investimento Direto
 * Design profissional com visual elegante - VERSÃO COM CONTROLE TOTAL DE MARGENS
 */

class SimulacaoPDFGenerator {
  constructor() {
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 20;
    this.usableWidth = this.pageWidth - 2 * this.margin; // 170mm
    this.colors = {
      primary: [197, 164, 126],
      primaryDark: [182, 149, 104],
      dark: [45, 45, 45],
      medium: [74, 74, 74],
      light: [232, 228, 219],
      white: [255, 255, 255],
      success: [34, 197, 94],
      warning: [239, 68, 68],
    };

    this.logoBase64 = null;
    this.logoWidth = 0;
    this.logoHeight = 0;

    // Definições dinâmicas de tipo de fundo
    this.siglaFundo = (typeof TIPO_FUNDO_ATUAL !== 'undefined') ? TIPO_FUNDO_ATUAL : "FII";
    this.termoFundo = this.siglaFundo === "FIP-IE" ? "Fundo de Infraestrutura (FIP-IE)" : "Fundo Imobiliário";
    this.termoFundoCurto = this.siglaFundo === "FIP-IE" ? "FIP-IE" : "Fundo Imobiliário";
  }

  async gerarPDF() {
    try {
      // VERIFICAR SE A SIMULAÇÃO FOI SALVA
      if (!simulacaoId) {
        showNotification(
          "É necessário salvar a simulação antes de gerar o PDF",
          "error"
        );

        // Perguntar se deseja salvar agora
        if (typeof confirmAction === "function") {
          const confirmed = await confirmAction({
            title: "Simulação não salva",
            message:
              "Para gerar o PDF, é necessário salvar a simulação primeiro. Deseja salvar agora?",
            confirmText: "Sim, salvar",
            cancelText: "Cancelar",
            type: "warning",
          });

          if (confirmed) {
            await salvarSimulacao();
            // Se salvou com sucesso, simulacaoId será definido
            if (!simulacaoId) {
              return; // Usuário cancelou ou houve erro ao salvar
            }
          } else {
            return;
          }
        } else {
          // Fallback se confirmAction não existir
          if (
            confirm(
              "Para gerar o PDF, é necessário salvar a simulação primeiro. Deseja salvar agora?"
            )
          ) {
            await salvarSimulacao();
            if (!simulacaoId) {
              return;
            }
          } else {
            return;
          }
        }
      }

      // Verificar se há dados da simulação
      if (!dadosDireto || !dadosFII || dadosDireto.length === 0) {
        showNotification("Execute a simulação antes de gerar o PDF", "error");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "mm", "a4");

      // Carregar logo escuro
      await this.carregarLogo();

      // Página 1: Capa
      this.criarCapa(doc);

      // Página 2: Resumo Executivo
      doc.addPage();
      this.criarResumoExecutivo(doc);

      // Página 3: Premissas
      doc.addPage();
      this.criarPremissas(doc);

      // Página 4: Resultados Comparativos
      doc.addPage();
      this.criarResultadosComparativos(doc);

      // Página 5: Análise Gráfica
      doc.addPage();
      await this.criarAnaliseGrafica(doc);

      // Página 6: Detalhamento Mensal
      doc.addPage();
      this.criarDetalhamentoMensal(doc);

      // Adicionar cabeçalho e rodapé em todas as páginas
      this.adicionarCabecalhoRodape(doc);

      // Salvar
      const titulo = document.getElementById("titulo").value || "Simulacao_FII";
      const nomeArquivo = `${titulo.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(nomeArquivo);

      showNotification("PDF gerado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showNotification("Erro ao gerar PDF: " + error.message, "error");
    }
  }

  async carregarLogo() {
    try {
      // Procurar pelo logo escuro (logo_firm2.png)
      let logoImg = document.querySelector('img[src*="logo_firm2"]');

      // Se não encontrar, criar e carregar
      if (!logoImg) {
        logoImg = new Image();
        logoImg.src = "../images/logos/logo_firm2.png";
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
      }

      if (logoImg && logoImg.complete) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        this.logoWidth = logoImg.naturalWidth || logoImg.width;
        this.logoHeight = logoImg.naturalHeight || logoImg.height;

        canvas.width = this.logoWidth;
        canvas.height = this.logoHeight;
        ctx.drawImage(logoImg, 0, 0);
        this.logoBase64 = canvas.toDataURL("image/png");
      }
    } catch (error) {
      console.warn("Não foi possível carregar o logo:", error);
    }
  }

  criarCapa(doc) {
    // Fundo decorativo superior
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, 0, this.pageWidth, 100, "F");

    // Barra dourada decorativa
    doc.setFillColor(...this.colors.primaryDark);
    doc.rect(0, 95, this.pageWidth, 10, "F");

    // Logo com proporção correta
    if (this.logoBase64) {
      const maxLogoWidth = 50;
      const maxLogoHeight = 40;
      const aspectRatio = this.logoWidth / this.logoHeight;

      let logoW, logoH;
      if (aspectRatio > 1) {
        logoW = maxLogoWidth;
        logoH = maxLogoWidth / aspectRatio;
      } else {
        logoH = maxLogoHeight;
        logoW = maxLogoHeight * aspectRatio;
      }

      doc.addImage(
        this.logoBase64,
        "PNG",
        (this.pageWidth - logoW) / 2,
        25,
        logoW,
        logoH
      );
    }

    // Título principal
    doc.setTextColor(...this.colors.white);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("ANÁLISE COMPARATIVA", this.pageWidth / 2, 75, {
      align: "center",
    });

    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Investimento Direto vs ${this.termoFundo}`,
      this.pageWidth / 2,
      88,
      { align: "center" }
    );

    // Box de informações
    let yPos = 120;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(this.margin, yPos, this.usableWidth, 80, 3, 3, "F");

    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(this.margin, yPos, this.usableWidth, 80, 3, 3, "S");

    yPos += 12;

    // Informações da simulação
    doc.setTextColor(...this.colors.dark);
    const titulo = document.getElementById("titulo").value || "Sem título";
    const clienteSelect = document.getElementById("cliente");
    const clienteNome =
      clienteSelect.options[clienteSelect.selectedIndex]?.text ||
      "Não informado";
    const descricao = document.getElementById("descricao").value || "";

    // Título da simulação
    doc.setFontSize(14);
    doc.setTextColor(...this.colors.primary);
    doc.text(titulo, this.pageWidth / 2, yPos, {
      align: "center",
      maxWidth: this.usableWidth - 10,
    });

    yPos += 15;

    // Grade de informações
    const col1X = this.margin + 10;
    const col2X = this.pageWidth / 2 + 5;

    doc.setFontSize(9);
    doc.setTextColor(...this.colors.medium);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", col1X, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.dark);
    doc.text(clienteNome, col1X, yPos + 5, {
      maxWidth: this.usableWidth / 2 - 15,
    });

    doc.setTextColor(...this.colors.medium);
    doc.setFont("helvetica", "bold");
    doc.text("DATA:", col2X, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.dark);
    doc.text(
      new Date().toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      col2X,
      yPos + 5,
      { maxWidth: this.usableWidth / 2 - 15 }
    );

    if (descricao) {
      yPos += 18;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.medium);
      doc.setFontSize(9);
      doc.text("DESCRIÇÃO:", col1X, yPos);

      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.dark);
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(descricao, this.usableWidth - 20);
      doc.text(descLines, col1X, yPos);
    }

    // Disclaimer na parte inferior - COM CONTROLE DE MARGEM
    yPos = this.pageHeight - 40;
    doc.setFillColor(...this.colors.light);
    doc.rect(this.margin, yPos, this.usableWidth, 20, "F");

    doc.setFontSize(8);
    doc.setTextColor(...this.colors.medium);
    doc.setFont("helvetica", "italic");
    const disclaimer =
      "Este relatório foi gerado automaticamente pelo sistema Firm Capital. As projeções apresentadas são baseadas nas premissas fornecidas e não constituem garantia de rentabilidade futura.";
    const disclaimerLines = doc.splitTextToSize(
      disclaimer,
      this.usableWidth - 10
    );
    doc.text(disclaimerLines, this.margin + 5, yPos + 7);
  }

  criarResumoExecutivo(doc) {
    this.adicionarTituloSecao(doc, "RESUMO EXECUTIVO", 30);

    // Calcular métricas
    let totalDivDireto = 0;
    let totalDivFII = 0;

    // Usar dividendosDistribuidos se disponível para pegar valores corrigidos (mesma lógica da tela)
    if (typeof dividendosDistribuidos !== 'undefined' && dividendosDistribuidos.direto && dividendosDistribuidos.direto.length > 0) {
        totalDivDireto = dividendosDistribuidos.direto.reduce((sum, d) => sum + (d.valorCorrigido !== undefined ? d.valorCorrigido : d.valor), 0);
        totalDivFII = dividendosDistribuidos.fii.reduce((sum, d) => sum + (d.valorCorrigido !== undefined ? d.valorCorrigido : d.valor), 0);
    } else {
        totalDivDireto = dadosDireto.reduce((sum, d) => sum + d.dividendo, 0);
        totalDivFII = dadosFII.reduce((sum, d) => sum + d.dividendo, 0);
    }
    const plFinalDireto = dadosDireto[dadosDireto.length - 1].plFinal;
    const plFinalFII = dadosFII[dadosFII.length - 1].plFinal;
    const valorTotalDireto = totalDivDireto + plFinalDireto;
    const valorTotalFII = totalDivFII + plFinalFII;
    const diferenca = valorTotalFII - valorTotalDireto;
    const diferencaPct = (diferenca / valorTotalDireto) * 100;

    // Cards de destaque
    const cardWidth = (this.usableWidth - 10) / 2;
    const cardHeight = 35;
    let yPos = 50;

    // Card Investimento Direto
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(this.margin, yPos, cardWidth, cardHeight, 2, 2, "F");
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(this.margin, yPos, cardWidth, cardHeight, 2, 2, "S");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.medium);
    doc.text("INVESTIMENTO DIRETO", this.margin + cardWidth / 2, yPos + 8, {
      align: "center",
    });

    doc.setFontSize(18);
    doc.setTextColor(...this.colors.dark);
    doc.text(
      this.formatMoeda(valorTotalDireto),
      this.margin + cardWidth / 2,
      yPos + 22,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.setTextColor(...this.colors.medium);
    doc.text(
      "Valor Total (Dividendos + PL)",
      this.margin + cardWidth / 2,
      yPos + 29,
      { align: "center" }
    );

    // Card FII
    const col2X = this.margin + cardWidth + 10;
    doc.setFillColor(...this.colors.light);
    doc.roundedRect(col2X, yPos, cardWidth, cardHeight, 2, 2, "F");
    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(col2X, yPos, cardWidth, cardHeight, 2, 2, "S");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text(this.termoFundoCurto.toUpperCase(), col2X + cardWidth / 2, yPos + 8, {
      align: "center",
    });

    doc.setFontSize(18);
    doc.setTextColor(...this.colors.dark);
    doc.text(
      this.formatMoeda(valorTotalFII),
      col2X + cardWidth / 2,
      yPos + 22,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.setTextColor(...this.colors.medium);
    doc.text(
      "Valor Total (Dividendos + PL)",
      col2X + cardWidth / 2,
      yPos + 29,
      { align: "center" }
    );

    yPos += 45;

    // 3 Cards: Vantagem, Margem Líquida e Vantagem Relativa
    const smallCardWidth = (this.usableWidth - 20) / 3;
    const smallCardHeight = 25;

    const margemMedioDireto =
      dadosDireto.reduce((sum, d) => sum + d.margem, 0) / dadosDireto.length;
    const margemMedioFII =
      dadosFII.reduce((sum, d) => sum + d.margem, 0) / dadosFII.length;
    const vantagem = diferenca > 0 ? this.siglaFundo : "Direto";
    const corVantagem =
      diferenca > 0 ? this.colors.primary : this.colors.medium;
    const vantagemRelativa = Math.abs(diferencaPct);

    // Card 1: Vantagem
    doc.setFillColor(
      diferenca > 0 ? 252 : 245,
      diferenca > 0 ? 248 : 245,
      diferenca > 0 ? 243 : 245
    );
    doc.roundedRect(
      this.margin,
      yPos,
      smallCardWidth,
      smallCardHeight,
      2,
      2,
      "F"
    );
    doc.setDrawColor(...corVantagem);
    doc.setLineWidth(0.8);
    doc.roundedRect(
      this.margin,
      yPos,
      smallCardWidth,
      smallCardHeight,
      2,
      2,
      "S"
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...corVantagem);
    doc.text("VANTAGEM", this.margin + smallCardWidth / 2, yPos + 7, {
      align: "center",
    });

    doc.setFontSize(11);
    doc.text(
      vantagem.toUpperCase(),
      this.margin + smallCardWidth / 2,
      yPos + 15,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      this.formatMoedaCurto(Math.abs(diferenca)),
      this.margin + smallCardWidth / 2,
      yPos + 21,
      { align: "center" }
    );

    // Card 2: Margem Líquida
    const col2Xsmall = this.margin + smallCardWidth + 10;
    const margemVantagem = margemMedioFII > margemMedioDireto;
    doc.setFillColor(
      margemVantagem ? 252 : 245,
      margemVantagem ? 248 : 245,
      margemVantagem ? 243 : 245
    );
    doc.roundedRect(
      col2Xsmall,
      yPos,
      smallCardWidth,
      smallCardHeight,
      2,
      2,
      "F"
    );
    doc.setDrawColor(
      ...(margemVantagem ? this.colors.primary : this.colors.medium)
    );
    doc.setLineWidth(0.8);
    doc.roundedRect(
      col2Xsmall,
      yPos,
      smallCardWidth,
      smallCardHeight,
      2,
      2,
      "S"
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      ...(margemVantagem ? this.colors.primary : this.colors.medium)
    );
    doc.text("MARGEM LÍQUIDA", col2Xsmall + smallCardWidth / 2, yPos + 7, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(
      `Dir: ${margemMedioDireto.toFixed(1)}%`,
      col2Xsmall + smallCardWidth / 2,
      yPos + 15,
      { align: "center" }
    );

    doc.setFontSize(10);
    doc.text(
      `${this.siglaFundo}: ${margemMedioFII.toFixed(1)}%`,
      col2Xsmall + smallCardWidth / 2,
      yPos + 21,
      { align: "center" }
    );

    // Card 3: Vantagem Relativa
    const col3Xsmall = col2Xsmall + smallCardWidth + 10;
    doc.setFillColor(
      diferenca > 0 ? 252 : 245,
      diferenca > 0 ? 248 : 245,
      diferenca > 0 ? 243 : 245
    );
    doc.roundedRect(
      col3Xsmall,
      yPos,
      smallCardWidth,
      smallCardHeight,
      2,
      2,
      "F"
    );
    doc.setDrawColor(...corVantagem);
    doc.setLineWidth(0.8);
    doc.roundedRect(
      col3Xsmall,
      yPos,
      smallCardWidth,
      smallCardHeight,
      2,
      2,
      "S"
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...corVantagem);
    doc.text("VANTAGEM RELATIVA", col3Xsmall + smallCardWidth / 2, yPos + 7, {
      align: "center",
    });

    doc.setFontSize(14);
    doc.text(
      `${vantagemRelativa.toFixed(2)}%`,
      col3Xsmall + smallCardWidth / 2,
      yPos + 17,
      { align: "center" }
    );

    yPos += 35;

    // Tabela comparativa detalhada
    const roeMedioDireto =
      dadosDireto.reduce((sum, d) => sum + d.roe, 0) / dadosDireto.length;
    const roeMedioFII =
      dadosFII.reduce((sum, d) => sum + d.roe, 0) / dadosFII.length;
    const dyMedioDireto =
      dadosDireto.reduce((sum, d) => sum + d.dy, 0) / dadosDireto.length;
    const dyMedioFII =
      dadosFII.reduce((sum, d) => sum + d.dy, 0) / dadosFII.length;

    const investimentoInicial =
      parseCurrencyInput(document.getElementById("valorImovel")) +
      parseCurrencyInput(document.getElementById("valorCaixa"));

    const dadosComparativos = [
      [
        "Investimento Inicial",
        this.formatMoeda(investimentoInicial),
        this.formatMoeda(investimentoInicial),
        "-",
      ],
      [
        "Dividendos Acumulados",
        this.formatMoeda(totalDivDireto),
        this.formatMoeda(totalDivFII),
        this.formatMoeda(totalDivFII - totalDivDireto),
      ],
      [
        "Patrimônio Final",
        this.formatMoeda(plFinalDireto),
        this.formatMoeda(plFinalFII),
        this.formatMoeda(plFinalFII - plFinalDireto),
      ],
      [
        "Valor Total Final",
        this.formatMoeda(valorTotalDireto),
        this.formatMoeda(valorTotalFII),
        this.formatMoeda(diferenca),
      ],
      [
        "ROE Médio Mensal",
        this.formatPct(roeMedioDireto),
        this.formatPct(roeMedioFII),
        this.formatPct(roeMedioFII - roeMedioDireto),
      ],
      [
        "DY Médio Mensal",
        this.formatPct(dyMedioDireto),
        this.formatPct(dyMedioFII),
        this.formatPct(dyMedioFII - dyMedioDireto),
      ],
    ];

    doc.autoTable({
      startY: yPos,
      head: [["Métrica", "Inv. Direto", this.siglaFundo, "Diferença"]],
      body: dadosComparativos,
      theme: "striped",
      headStyles: {
        fillColor: this.colors.primary,
        textColor: this.colors.white,
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      margin: { left: this.margin, right: this.margin },
      tableWidth: this.usableWidth,
    });

    // Conclusão - COM CONTROLE RIGOROSO DE MARGEM
    yPos = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("CONCLUSÃO:", this.margin, yPos);

    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let conclusao = "";
    if (Math.abs(diferencaPct) < 1) {
      conclusao =
        "Os resultados indicam equivalência entre as modalidades, com diferença inferior a 1%. A decisão deve considerar outros fatores como liquidez, gestão e objetivos do investidor.";
    } else if (diferenca > 0) {
      conclusao = `O ${this.termoFundo} apresenta vantagem financeira de ${this.formatMoeda(
        diferenca
      )} (${diferencaPct.toFixed(
        2
      )}%) sobre o investimento direto, considerando o período analisado. Essa vantagem é resultado principalmente das diferenças tributárias e de custos operacionais.`;
    } else {
      conclusao = `O investimento direto demonstra vantagem de ${this.formatMoeda(
        Math.abs(diferenca)
      )} (${Math.abs(diferencaPct).toFixed(
        2
      )}%) em relação ao ${this.siglaFundo}. Esse resultado pode estar relacionado aos custos de administração do fundo e à estrutura tributária aplicada.`;
    }

    const conclusaoLines = doc.splitTextToSize(conclusao, this.usableWidth);
    doc.text(conclusaoLines, this.margin, yPos);
  }

  criarPremissas(doc) {
    this.adicionarTituloSecao(doc, "PREMISSAS DA SIMULAÇÃO", 30);

    let yPos = 50;

    // Seção 1: Parâmetros Básicos
    this.adicionarSubtitulo(doc, "1. Parâmetros Básicos", yPos);
    yPos += 8;

    const parametrosBasicos = [
      [
        "Valor do Imóvel",
        this.formatMoeda(
          parseCurrencyInput(document.getElementById("valorImovel"))
        ),
      ],
      [
        "Valor em Caixa",
        this.formatMoeda(
          parseCurrencyInput(document.getElementById("valorCaixa"))
        ),
      ],
      [
        "Aluguel Mensal Inicial",
        this.formatMoeda(
          parseCurrencyInput(document.getElementById("aluguelInicial"))
        ),
      ],
      [
        "Período de Análise",
        document.getElementById("duracao").value + " meses",
      ],
    ];

    doc.autoTable({
      startY: yPos,
      body: parametrosBasicos,
      theme: "plain",
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: this.colors.medium },
        1: { halign: "right" },
      },
      margin: { left: this.margin + 5, right: this.margin + 5 },
      tableWidth: this.usableWidth - 10,
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // Seção 2: Indexadores (2 colunas)
    this.adicionarSubtitulo(doc, "2. Indexadores e Correção", yPos);
    yPos += 8;

    const col1Width = (this.usableWidth - 10) / 2;

    const indexadores1 = [
      ["IPCA Anual", document.getElementById("ipcaAnual").value + "% a.a."],
      [
        "Correção Caixa",
        document.getElementById("correcaoCaixaAnual").value + "% a.a.",
      ],
    ];

    const indexadores2 = [
      ["WACC", document.getElementById("waccAnual").value + "% a.a."],
      [
        "Correção IPCA Imóvel",
        document.getElementById("correcaoImovelIPCA").checked ? "Sim" : "Não",
      ],
    ];

    doc.autoTable({
      startY: yPos,
      body: indexadores1,
      theme: "plain",
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45, textColor: this.colors.medium },
        1: { cellWidth: 30 },
      },
      margin: { left: this.margin + 5, right: this.pageWidth / 2 + 5 },
      tableWidth: col1Width - 5,
    });

    doc.autoTable({
      startY: yPos,
      body: indexadores2,
      theme: "plain",
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45, textColor: this.colors.medium },
        1: { cellWidth: 30 },
      },
      margin: { left: this.pageWidth / 2 + 10, right: this.margin + 5 },
      tableWidth: col1Width - 5,
    });

    yPos = Math.max(doc.lastAutoTable.finalY) + 12;

    // Seção 3: Tributação (2 colunas)
    this.adicionarSubtitulo(doc, "3. Estrutura Tributária", yPos);
    yPos += 8;

    const tributacaoDireto = [
      ["IR Aluguéis", document.getElementById("irAluguelDireto").value + "%"],
      [
        "IR Dividendos",
        document.getElementById("irDividendoDireto").value + "%",
      ],
      [
        "IR Ganho Capital",
        document.getElementById("irGanhoDireto").value + "%",
      ],
      ["ITBI", document.getElementById("itbiDireto").value + "%"],
    ];

    const tributacaoFII = [
      ["IR Aluguéis", document.getElementById("irAluguelFII").value + "%"],
      ["IR Dividendos", document.getElementById("irDividendoFII").value + "%"],
      ["IR Ganho Capital", document.getElementById("irGanhoFII").value + "%"],
      ["ITBI", document.getElementById("itbiFII").value + "%"],
    ];

    // Investimento Direto
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.medium);
    doc.text("Investimento Direto", this.margin + 5, yPos);
    yPos += 5;

    doc.autoTable({
      startY: yPos,
      body: tributacaoDireto,
      theme: "plain",
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 45, textColor: this.colors.medium },
        1: { cellWidth: 25 },
      },
      margin: { left: this.margin + 5, right: this.pageWidth / 2 + 5 },
      tableWidth: col1Width - 5,
    });

    // FII
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text("Fundo Imobiliário", this.pageWidth / 2 + 10, yPos - 5);

    doc.autoTable({
      startY: yPos,
      body: tributacaoFII,
      theme: "plain",
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 45, textColor: this.colors.medium },
        1: { cellWidth: 25 },
      },
      margin: { left: this.pageWidth / 2 + 10, right: this.margin + 5 },
      tableWidth: col1Width - 5,
    });

    yPos = Math.max(doc.lastAutoTable.finalY) + 12;

    // Seção 4: Custos FII
    this.adicionarSubtitulo(doc, "4. Custos e Taxas do FII", yPos);
    yPos += 8;

    const custosFII = [
      [
        "Taxa Administração",
        document.getElementById("taxaAdmin").value + "% a.a.",
        "Mín: " +
          this.formatMoedaCurto(
            parseCurrencyInput(document.getElementById("minAdmin"))
          ),
      ],
      [
        "Taxa Gestão",
        document.getElementById("taxaGestao").value + "% a.a.",
        "Mín: " +
          this.formatMoedaCurto(
            parseCurrencyInput(document.getElementById("minGestao"))
          ),
      ],
      [
        "Taxa Custódia",
        document.getElementById("taxaCustodia").value + "% a.a.",
        "Mín: " +
          this.formatMoedaCurto(
            parseCurrencyInput(document.getElementById("minCustodia"))
          ),
      ],
      [
        "Taxa Consultoria",
        document.getElementById("taxaConsultoria").value + "% a.a.",
        "Mín: " +
          this.formatMoedaCurto(
            parseCurrencyInput(document.getElementById("minConsultoria"))
          ),
      ],
      [
        "Outros Custos",
        "-",
        this.formatMoedaCurto(
          parseCurrencyInput(document.getElementById("outrosCustos"))
        ),
      ],
    ];

    doc.autoTable({
      startY: yPos,
      head: [["Tipo", "Percentual", "Fixo"]],
      body: custosFII,
      theme: "grid",
      headStyles: {
        fillColor: this.colors.primary,
        textColor: this.colors.white,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: this.usableWidth,
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // Verificar se precisa de nova página para seção 5
    if (yPos > 220) {
      doc.addPage();
      yPos = 50;
    }

    // Seção 5: Outros Parâmetros
    this.adicionarSubtitulo(doc, "5. Outros Parâmetros Operacionais", yPos);
    yPos += 8;

    const outrosParametros = [
      [
        "Distribuição Dividendos - Direto",
        document.getElementById("distribDireto").value + "%",
      ],
      [
        "Distribuição Dividendos - FII",
        document.getElementById("distribFII").value + "%",
      ],
      ["Taxa de Vacância", document.getElementById("taxaVacancia").value + "%"],
      [
        "Taxa de Inadimplência",
        document.getElementById("taxaInadimplencia").value + "%",
      ],
      [
        "Custos de Manutenção",
        document.getElementById("custosManutencao").value + "% a.a.",
      ],
    ];

    doc.autoTable({
      startY: yPos,
      body: outrosParametros,
      theme: "plain",
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: this.colors.medium },
        1: { halign: "right" },
      },
      margin: { left: this.margin + 5, right: this.margin + 5 },
      tableWidth: this.usableWidth - 10,
    });
  }

  criarResultadosComparativos(doc) {
    this.adicionarTituloSecao(doc, "RESULTADOS COMPARATIVOS", 30);

    let yPos = 50;

    const totalDivDireto = dadosDireto.reduce((sum, d) => sum + d.dividendo, 0);
    const totalDivFII = dadosFII.reduce((sum, d) => sum + d.dividendo, 0);
    const plFinalDireto = dadosDireto[dadosDireto.length - 1].plFinal;
    const plFinalFII = dadosFII[dadosFII.length - 1].plFinal;

    // Tabela de Performance
    const metricas = [
      [
        "Dividendos Totais",
        this.formatMoeda(totalDivDireto),
        this.formatMoeda(totalDivFII),
        this.formatDiferenca(totalDivFII - totalDivDireto),
      ],
      [
        "Patrimônio Final",
        this.formatMoeda(plFinalDireto),
        this.formatMoeda(plFinalFII),
        this.formatDiferenca(plFinalFII - plFinalDireto),
      ],
      [
        "Retorno Total",
        this.formatMoeda(totalDivDireto + plFinalDireto),
        this.formatMoeda(totalDivFII + plFinalFII),
        this.formatDiferenca(
          totalDivFII + plFinalFII - (totalDivDireto + plFinalDireto)
        ),
      ],
    ];

    doc.autoTable({
      startY: yPos,
      head: [["Métrica", "Inv. Direto", "FII", "Diferença"]],
      body: metricas,
      theme: "striped",
      headStyles: {
        fillColor: this.colors.primary,
        textColor: this.colors.white,
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { halign: "right", cellWidth: 40 },
        2: { halign: "right", cellWidth: 40 },
        3: { halign: "right", cellWidth: 40, fontStyle: "bold" },
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: this.usableWidth,
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Indicadores de Rentabilidade
    this.adicionarSubtitulo(doc, "Indicadores de Rentabilidade", yPos);
    yPos += 8;

    const roeMedioDireto =
      dadosDireto.reduce((sum, d) => sum + d.roe, 0) / dadosDireto.length;
    const roeMedioFII =
      dadosFII.reduce((sum, d) => sum + d.roe, 0) / dadosFII.length;
    const dyMedioDireto =
      dadosDireto.reduce((sum, d) => sum + d.dy, 0) / dadosDireto.length;
    const dyMedioFII =
      dadosFII.reduce((sum, d) => sum + d.dy, 0) / dadosFII.length;
    const margemMedioDireto =
      dadosDireto.reduce((sum, d) => sum + d.margem, 0) / dadosDireto.length;
    const margemMedioFII =
      dadosFII.reduce((sum, d) => sum + d.margem, 0) / dadosFII.length;

    const indicadores = [
      [
        "ROE Médio Mensal",
        this.formatPct(roeMedioDireto),
        this.formatPct(roeMedioFII),
        this.formatPct(roeMedioFII - roeMedioDireto),
      ],
      [
        "Dividend Yield Médio",
        this.formatPct(dyMedioDireto),
        this.formatPct(dyMedioFII),
        this.formatPct(dyMedioFII - dyMedioDireto),
      ],
      [
        "Margem Líquida Média",
        this.formatPct(margemMedioDireto),
        this.formatPct(margemMedioFII),
        this.formatPct(margemMedioFII - margemMedioDireto),
      ],
    ];

    doc.autoTable({
      startY: yPos,
      body: indicadores,
      theme: "grid",
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { halign: "center", cellWidth: 40 },
        2: { halign: "center", cellWidth: 40 },
        3: { halign: "center", cellWidth: 40, fontStyle: "bold" },
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: this.usableWidth,
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Análise de Custos (se FII) - COM CONTROLE DE MARGEM
    if (custosFII && custosFII.length > 0) {
      this.adicionarSubtitulo(doc, "Análise de Custos do FII", yPos);
      yPos += 8;

      const custoMedioAdmin =
        custosFII.reduce((sum, c) => sum + c.admin, 0) / custosFII.length;
      const custoMedioGestao =
        custosFII.reduce((sum, c) => sum + c.gestao, 0) / custosFII.length;
      const custoMedioCustodia =
        custosFII.reduce((sum, c) => sum + c.custodia, 0) / custosFII.length;
      const custoTotalMedio =
        custosFII.reduce((sum, c) => sum + c.total, 0) / custosFII.length;
      const custoTotalAcumulado = custosFII.reduce(
        (sum, c) => sum + c.total,
        0
      );

      const custosAnalise = [
        ["Administração Média Mensal", this.formatMoeda(custoMedioAdmin)],
        ["Gestão Média Mensal", this.formatMoeda(custoMedioGestao)],
        ["Custódia Média Mensal", this.formatMoeda(custoMedioCustodia)],
        ["Custo Total Médio Mensal", this.formatMoeda(custoTotalMedio)],
        ["Custo Total Acumulado", this.formatMoeda(custoTotalAcumulado)],
      ];

      doc.autoTable({
        startY: yPos,
        body: custosAnalise,
        theme: "plain",
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: {
            fontStyle: "bold",
            cellWidth: 75,
            textColor: this.colors.medium,
          },
          1: { halign: "right", cellWidth: "auto" },
        },
        margin: { left: this.margin + 5, right: this.margin + 5 },
      });

      yPos = doc.lastAutoTable.finalY + 10;

      const aluguelTotal = custosFII.reduce((sum, c) => sum + c.aluguel, 0);
      const pctCustos = (custoTotalAcumulado / aluguelTotal) * 100;

      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...this.colors.medium);
      const custoText = `Os custos do FII representam ${pctCustos.toFixed(
        2
      )}% do total de aluguéis recebidos.`;
      const custoLines = doc.splitTextToSize(custoText, this.usableWidth - 10);
      doc.text(custoLines, this.margin + 5, yPos);
    }
  }

  async criarAnaliseGrafica(doc) {
    this.adicionarTituloSecao(doc, "ANÁLISE GRÁFICA", 30);

    let yPos = 50;

    // Gráfico 1: Valor Acumulado - MANTENDO PROPORÇÃO
    const chartValor = document.getElementById("chartValorAcumulado");
    if (chartValor) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("Evolução do Valor Total Acumulado", this.margin, yPos - 3);

      const { imgData, aspectRatio } =
        this.capturarGraficoComProporcao(chartValor);

      // Definir largura máxima e calcular altura proporcional
      const imgWidth = this.usableWidth;
      const imgHeight = imgWidth / aspectRatio;

      doc.setDrawColor(...this.colors.primary);
      doc.setLineWidth(0.5);
      doc.rect(this.margin, yPos, imgWidth, imgHeight);

      doc.addImage(imgData, "PNG", this.margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 15;
    }

    // Gráficos 2 e 3: ROE e DY (lado a lado) - MANTENDO PROPORÇÃO
    const chartROE = document.getElementById("chartROE");
    const chartDY = document.getElementById("chartDividendYield");

    if (chartROE && chartDY) {
      const maxChartWidth = (this.usableWidth - 10) / 2;

      // ROE
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("ROE Mensal (%)", this.margin, yPos - 3);

      const { imgData: imgROE, aspectRatio: ratioROE } =
        this.capturarGraficoComProporcao(chartROE);
      const chartWidthROE = maxChartWidth;
      const chartHeightROE = chartWidthROE / ratioROE;

      doc.setDrawColor(...this.colors.primary);
      doc.setLineWidth(0.5);
      doc.rect(this.margin, yPos, chartWidthROE, chartHeightROE);
      doc.addImage(
        imgROE,
        "PNG",
        this.margin,
        yPos,
        chartWidthROE,
        chartHeightROE
      );

      // DY
      const col2X = this.margin + maxChartWidth + 10;
      doc.text("Dividend Yield (%)", col2X, yPos - 3);

      const { imgData: imgDY, aspectRatio: ratioDY } =
        this.capturarGraficoComProporcao(chartDY);
      const chartWidthDY = maxChartWidth;
      const chartHeightDY = chartWidthDY / ratioDY;

      doc.rect(col2X, yPos, chartWidthDY, chartHeightDY);
      doc.addImage(imgDY, "PNG", col2X, yPos, chartWidthDY, chartHeightDY);

      // Usar a maior altura entre os dois gráficos
      const maxHeight = Math.max(chartHeightROE, chartHeightDY);
      yPos += maxHeight + 15;
    }

    // Insights
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("Principais Insights:", this.margin, yPos);

    yPos += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.medium);

    const insights = [
      "A evolução do patrimônio total mostra a composição entre dividendos distribuídos e valorização do ativo.",
      "O ROE mensal indica a rentabilidade do patrimônio investido em cada modalidade.",
      "O Dividend Yield demonstra o retorno em dividendos em relação ao patrimônio líquido.",
    ];

    insights.forEach((insight) => {
      const lines = doc.splitTextToSize(insight, this.usableWidth - 10);
      doc.text(lines, this.margin + 5, yPos);
      yPos += lines.length * 5 + 2;
    });
  }

  capturarGraficoComProporcao(chartCanvas) {
    // Criar canvas temporário
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");

    // Obter dimensões reais do canvas
    const originalWidth = chartCanvas.width;
    const originalHeight = chartCanvas.height;
    const aspectRatio = originalWidth / originalHeight;

    // Definir dimensões do canvas temporário (mesmas do original)
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;

    // Fundo branco
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Desenhar o gráfico mantendo proporções
    ctx.drawImage(chartCanvas, 0, 0, originalWidth, originalHeight);

    return {
      imgData: tempCanvas.toDataURL("image/png", 1.0),
      aspectRatio: aspectRatio,
    };
  }

  criarDetalhamentoMensal(doc) {
    this.adicionarTituloSecao(doc, "DETALHAMENTO MENSAL", 30);

    let yPos = 45;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...this.colors.medium);
    doc.text("Resumo dos principais meses da simulação", this.margin, yPos);

    yPos += 10;

    // Selecionar meses representativos
    const totalMeses = dadosDireto.length;
    const mesesSelecionados = [];

    mesesSelecionados.push(0);
    for (let i = 1; i < 9; i++) {
      mesesSelecionados.push(Math.floor((totalMeses * i) / 10));
    }
    mesesSelecionados.push(totalMeses - 1);

    const dadosTabela = mesesSelecionados.map((idx) => {
      const direto = dadosDireto[idx];
      const fii = dadosFII[idx];

      return [
        `M${direto.mes}`,
        this.formatMoedaCurto(direto.plInicio),
        this.formatMoedaCurto(direto.dividendo),
        this.formatMoedaCurto(fii.dividendo),
        this.formatPct(direto.roe, 1),
        this.formatPct(fii.roe, 1),
        this.formatMoedaCurto(direto.plFinal),
        this.formatMoedaCurto(fii.plFinal),
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [
        [
          "Mês",
          "PL Inic.",
          "Div. D.",
          "Div. F.",
          "ROE D",
          "ROE F",
          "PL D.",
          "PL F.",
        ],
      ],
      body: dadosTabela,
      theme: "grid",
      headStyles: {
        fillColor: this.colors.primary,
        textColor: this.colors.white,
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold" },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "right" },
        7: { halign: "right" },
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      margin: { left: this.margin, right: this.margin },
      tableWidth: this.usableWidth,
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // Estatísticas do Período - COM CONTROLE DE MARGEM
    this.adicionarSubtitulo(doc, "Estatísticas do Período", yPos);
    yPos += 8;

    const mesesPositivosDireto = dadosDireto.filter(
      (d) => d.lucroOperacional > 0
    ).length;
    const mesesPositivosFII = dadosFII.filter(
      (d) => d.lucroOperacional > 0
    ).length;
    const dividendoMedioDireto =
      dadosDireto.reduce((sum, d) => sum + d.dividendo, 0) / dadosDireto.length;
    const dividendoMedioFII =
      dadosFII.reduce((sum, d) => sum + d.dividendo, 0) / dadosFII.length;

    const estatisticas = [
      ["Total de Meses Analisados", totalMeses.toString()],
      [
        "Meses Lucro - Direto",
        `${mesesPositivosDireto} (${(
          (mesesPositivosDireto / totalMeses) *
          100
        ).toFixed(1)}%)`,
      ],
      [
        "Meses Lucro - FII",
        `${mesesPositivosFII} (${(
          (mesesPositivosFII / totalMeses) *
          100
        ).toFixed(1)}%)`,
      ],
      ["Dividendo Médio - Direto", this.formatMoeda(dividendoMedioDireto)],
      ["Dividendo Médio - FII", this.formatMoeda(dividendoMedioFII)],
    ];

    doc.autoTable({
      startY: yPos,
      body: estatisticas,
      theme: "plain",
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: this.colors.medium },
        1: { halign: "right" },
      },
      margin: { left: this.margin + 5, right: this.margin + 5 },
      tableWidth: this.usableWidth - 10,
    });
  }

  adicionarCabecalhoRodape(doc) {
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      if (i === 1) continue;

      // Cabeçalho
      doc.setDrawColor(...this.colors.primary);
      doc.setLineWidth(1);
      doc.line(this.margin, 15, this.pageWidth - this.margin, 15);

      // Logo com fundo branco
      if (this.logoBase64) {
        const aspectRatio = this.logoWidth / this.logoHeight;
        const logoH = 12;
        const logoW = logoH * aspectRatio;

        // Fundo branco para o logo
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(this.margin - 1, 7, logoW + 2, logoH + 2, 1, 1, "F");

        doc.addImage(this.logoBase64, "PNG", this.margin, 8, logoW, logoH);
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.medium);
      doc.text(
        "Firm Capital - Análise Comparativa",
        this.pageWidth - this.margin,
        12,
        { align: "right" }
      );

      // Rodapé
      doc.setDrawColor(...this.colors.primary);
      doc.setLineWidth(0.5);
      doc.line(
        this.margin,
        this.pageHeight - 15,
        this.pageWidth - this.margin,
        this.pageHeight - 15
      );

      doc.setFontSize(7);
      doc.setTextColor(...this.colors.medium);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
        this.margin,
        this.pageHeight - 10
      );
      doc.text(
        `Página ${i} de ${totalPages}`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: "right" }
      );
    }
  }

  adicionarTituloSecao(doc, titulo, yPos) {
    doc.setFillColor(...this.colors.primary);
    doc.rect(this.margin, yPos - 5, this.usableWidth, 10, "F");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    doc.text(titulo, this.margin + 5, yPos + 2);
  }

  adicionarSubtitulo(doc, subtitulo, yPos) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text(subtitulo, this.margin, yPos);

    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(this.margin, yPos + 1, this.margin + 60, yPos + 1);
  }

  formatMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  }

  formatMoedaCurto(valor) {
    if (Math.abs(valor) >= 1000000) {
      return "R$ " + (valor / 1000000).toFixed(1) + "M";
    } else if (Math.abs(valor) >= 1000) {
      return "R$ " + (valor / 1000).toFixed(0) + "k";
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(valor);
  }

  formatPct(valor, decimals = 2) {
    return valor.toFixed(decimals) + "%";
  }

  formatDiferenca(valor) {
    const sinal = valor >= 0 ? "+" : "";
    return sinal + this.formatMoeda(valor);
  }
}

// Instância global
const pdfGenerator = new SimulacaoPDFGenerator();

// Função para chamar do HTML
function gerarPDFSimulacao() {
  pdfGenerator.gerarPDF();
}
