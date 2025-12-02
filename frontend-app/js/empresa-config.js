// frontend/js/empresa-config.js

class EmpresaConfig {
  constructor() {
    this.config = null;
    this.loaded = false;
    this.CACHE_KEY = "empresa_config";
    this.CACHE_DURATION = 1000 * 60 * 60;
    this.DEBUG = true;
  }

  log(emoji, ...args) {
    if (this.DEBUG) {
      console.log(`${emoji} [EmpresaConfig]`, ...args);
    }
  }

  loadFromCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      this.log("✅", "Configurações carregadas do cache");
      return data;
    } catch (error) {
      console.error("Erro ao ler cache:", error);
      return null;
    }
  }

  saveToCache(data) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  }

  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
  }

  async load(forceRefresh = false) {
    if (this.loaded && !forceRefresh) {
      return this.config;
    }

    if (!forceRefresh) {
      const cached = this.loadFromCache();
      if (cached) {
        this.config = cached;
        this.loaded = true;
        this.loadFromAPI(true);
        return this.config;
      }
    }

    return await this.loadFromAPI(false);
  }

  async loadFromAPI(isBackground = false) {
    try {
      const response = await api.getEmpresa();

      if (response.success) {
        this.config = response.data;
        this.loaded = true;
        this.saveToCache(this.config);

        if (!isBackground) {
          this.log("✅", "Configurações carregadas da API:", this.config.nome);
        } else {
          this.log("🔄", "Cache atualizado em background");
          this.aplicarLogos();
        }

        return this.config;
      }
    } catch (error) {
      console.error("Erro ao carregar da API:", error);
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  getDefaultConfig() {
    return {
      nome: "Firm Capital",
      configuracoes: {
        logoClaro: "../images/logos/logo_firm.png",
        logoEscuro: "../images/logos/logo_firm.png",
        coresPersonalizadas: {
          primaria: "#2d2d2d",
          secundaria: "#c5a47e",
          fundo: "#f4f1ea",
        },
      },
    };
  }

  async aplicarLogos() {
    if (!this.config) {
      await this.load();
    }

    const logoElements = document.querySelectorAll(
      ".sidebar-logo, [data-empresa-logo]"
    );

    this.log("🖼️", `Encontrados ${logoElements.length} elementos de logo`);

    logoElements.forEach((img, index) => {
      this.log("---", `Processando logo #${index + 1}`);
      const logoUrl = this.getLogo(img);

      if (logoUrl) {
        img.style.opacity = "0";
        img.style.transition = "opacity 0.3s ease";

        img.src = logoUrl;

        img.onload = () => {
          img.style.opacity = "1";
          this.log("✅", `Logo #${index + 1} carregado com sucesso`);
        };

        img.onerror = () => {
          console.warn("Erro ao carregar logo, usando fallback");
          img.src = "../images/logos/logo_firm.png";
          img.style.opacity = "1";
        };
      }
    });
  }

  getLogo(element) {
    const usarLogoClaro = this.shouldUseLogoClaro(element);

    this.log(
      "📋",
      "Decisão final:",
      usarLogoClaro ? "LOGO CLARO" : "LOGO ESCURO"
    );

    const logoPath = usarLogoClaro
      ? this.config.configuracoes.logoClaro
      : this.config.configuracoes.logoEscuro;

    this.log("📂", "Path escolhido:", logoPath);

    if (!logoPath) {
      this.log("⚠️", "Path não encontrado, usando fallback");
      return (
        this.config.configuracoes.logoClaro ||
        this.config.configuracoes.logoEscuro
      );
    }

    // Se for URL absoluta ou caminho relativo local, retornar como está
    if (
      logoPath.startsWith("http") ||
      logoPath.startsWith("..") ||
      logoPath.startsWith("./")
    ) {
      return logoPath;
    }

    const baseURL = api.baseURL.replace("/api", "");
    const finalUrl = `${baseURL}${logoPath}`;
    this.log("🔗", "URL final:", finalUrl);

    return finalUrl;
  }

  shouldUseLogoClaro(element) {
    this.log("🔍", "--- INICIANDO DETECÇÃO ---");

    const tipoForcado = element.getAttribute("data-logo-tipo");
    if (tipoForcado) {
      this.log("🎯", "Tipo forçado via atributo:", tipoForcado);
      return tipoForcado === "claro";
    }

    const bgColor = this.getBackgroundColor(element);
    this.log("🎨", "Cor de fundo detectada:", bgColor);

    const luminosidade = this.calcularLuminosidade(bgColor);
    this.log("💡", "Luminosidade calculada:", luminosidade.toFixed(2));

    const usarClaro = luminosidade < 128;
    this.log(
      "⚖️",
      `Lógica: luminosidade (${luminosidade.toFixed(2)}) ${
        usarClaro ? "<" : ">="
      } 128`
    );
    this.log(
      "🎯",
      `Decisão: usar logo ${usarClaro ? "CLARO" : "ESCURO"} (fundo ${
        usarClaro ? "escuro" : "claro"
      })`
    );

    return usarClaro;
  }

  getBackgroundColor(element) {
    let el = element;
    let bgColor = "rgb(255, 255, 255)";
    let foundAt = "padrão (branco)";

    this.log("🔎", "Buscando cor de fundo...");

    let nivel = 0;
    while (el && el !== document.body && nivel < 10) {
      const computedStyle = window.getComputedStyle(el);
      const bg = computedStyle.backgroundColor;
      const bgImage = computedStyle.backgroundImage;

      this.log(
        `  └─ Nível ${nivel}:`,
        el.className || el.tagName,
        "→ bg:",
        bg,
        ", bgImage:",
        bgImage
      );

      // DETECTAR GRADIENTE
      if (bgImage && bgImage !== "none" && bgImage.includes("gradient")) {
        const cores = bgImage.match(/rgba?\([^)]+\)/g);
        if (cores && cores.length > 0) {
          bgColor = cores[0];
          foundAt = `${el.className || el.tagName} (gradiente nível ${nivel})`;
          this.log("  ✓ Gradiente encontrado! Usando primeira cor:", bgColor);
          break;
        }
      }

      // DETECTAR COR SÓLIDA
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        bgColor = bg;
        foundAt = `${el.className || el.tagName} (nível ${nivel})`;
        this.log("  ✓ Cor sólida encontrada!");
        break;
      }

      el = el.parentElement;
      nivel++;
    }

    this.log("📍", "Cor final encontrada em:", foundAt);
    return bgColor;
  }

  calcularLuminosidade(rgbString) {
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) {
      this.log("⚠️", "Não conseguiu extrair RGB, usando luminosidade máxima");
      return 255;
    }

    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);

    this.log("🔢", `RGB: R=${r}, G=${g}, B=${b}`);

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    return lum;
  }

  async aplicarCores() {
    if (!this.config) {
      await this.load();
    }

    const cores = this.config.configuracoes.coresPersonalizadas;

    if (cores) {
      document.documentElement.style.setProperty("--gray-dark", cores.primaria);
      document.documentElement.style.setProperty(
        "--accent-gold",
        cores.secundaria
      );
      document.documentElement.style.setProperty("--beige", cores.fundo);

      this.log("🎨", "Cores personalizadas aplicadas:", cores);
    }
  }

  async aplicarTudo() {
    await this.load();
    await this.aplicarLogos();
    await this.aplicarCores();
  }
}

// Instância global
const empresaConfig = new EmpresaConfig();

// PRÉ-CARREGAR
(async function preload() {
  const cached = empresaConfig.loadFromCache();
  if (cached) {
    empresaConfig.config = cached;
    empresaConfig.loaded = true;

    if (cached.configuracoes?.coresPersonalizadas) {
      const cores = cached.configuracoes.coresPersonalizadas;
      document.documentElement.style.setProperty("--gray-dark", cores.primaria);
      document.documentElement.style.setProperty(
        "--accent-gold",
        cores.secundaria
      );
      document.documentElement.style.setProperty("--beige", cores.fundo);
    }
  }
})();

// Aplicar quando DOM carregar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    empresaConfig.aplicarTudo();
  });
} else {
  empresaConfig.aplicarTudo();
}
