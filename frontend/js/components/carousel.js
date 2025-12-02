document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".carousel-slide");
  const dotsContainer = document.querySelector(".carousel-dots");
  let currentSlide = 0;
  let interval;
  let zoomInterval;
  let isAnimating = false;

  // Constantes de tempo
  const TRANSITION_DURATION = 1200; // Duração da transição entre slides
  const SLIDE_INTERVAL = 10000; // Intervalo entre mudanças de slide
  const ZOOM_DURATION = 10000; // Duração do zoom

  // Criar dots
  slides.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.className = "carousel-dot";
    dot.addEventListener("click", () => {
      if (!isAnimating && currentSlide !== index) {
        showSlide(index, true);
      }
    });
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll(".carousel-dot");

  function startZoom(slide) {
    clearInterval(zoomInterval);
    const startTime = Date.now();

    zoomInterval = setInterval(() => {
      const progress = (Date.now() - startTime) / ZOOM_DURATION;
      const scale = 1 + 0.05 * Math.min(progress, 1);

      if (progress >= 1) {
        clearInterval(zoomInterval);
        slide.style.transform = "scale(1)";
        startZoom(slide);
      } else {
        slide.style.transform = `scale(${scale})`;
      }
    }, 16);
  }

  function showSlide(index, userAction = false) {
    if (isAnimating) return;
    isAnimating = true;

    if (userAction) {
      resetInterval();
    }

    const currentActive = document.querySelector(".carousel-slide.active");
    const newSlide = slides[(index + slides.length) % slides.length];

    // Parar zoom atual
    clearInterval(zoomInterval);

    // Transição do slide atual
    if (currentActive) {
      currentActive.style.transition = `all ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      currentActive.classList.add("transition-out");
      currentActive.classList.remove("active");
    }

    // Preparar novo slide
    newSlide.style.transition = `all ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    newSlide.style.transform = "scale(1)";
    newSlide.classList.add("active", "transition-in");

    updateDots(index);

    setTimeout(() => {
      if (currentActive) {
        currentActive.classList.remove("transition-out");
        currentActive.style.transition = "";
      }
      newSlide.classList.remove("transition-in");
      newSlide.style.transition = "";
      isAnimating = false;

      // Iniciar zoom do novo slide
      startZoom(newSlide);
    }, TRANSITION_DURATION);
  }

  function updateDots(index) {
    dots.forEach((dot) => dot.classList.remove("active"));
    currentSlide = (index + slides.length) % slides.length;
    dots[currentSlide].classList.add("active");
  }

  function nextSlide() {
    if (!isAnimating) {
      showSlide(currentSlide + 1);
    }
  }

  function resetInterval() {
    clearInterval(interval);
    interval = setInterval(nextSlide, SLIDE_INTERVAL);
  }

  // Inicialização
  slides[0].classList.add("active");
  dots[0].classList.add("active");
  startZoom(slides[0]); // Inicia zoom imediatamente no primeiro slide
  resetInterval();

  // Limpar intervalos ao fechar
  window.addEventListener("beforeunload", () => {
    clearInterval(interval);
    clearInterval(zoomInterval);
  });
});
