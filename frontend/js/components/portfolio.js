document.addEventListener("DOMContentLoaded", function () {
  const carouselTrack = document.querySelector(".portfolio-carousel-track");
  const slides = Array.from(carouselTrack.children);
  const prevButton = document.querySelector(
    ".portfolio-carousel-button.portfolio-prev"
  );
  const nextButton = document.querySelector(
    ".portfolio-carousel-button.portfolio-next"
  );

  let currentSlide = 0;

  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove(
        "portfolio-previous",
        "portfolio-current",
        "portfolio-next"
      );

      if (index === currentSlide) {
        slide.classList.add("portfolio-current");
      } else if (index === (currentSlide - 1 + slides.length) % slides.length) {
        slide.classList.add("portfolio-previous");
      } else if (index === (currentSlide + 1) % slides.length) {
        slide.classList.add("portfolio-next");
      }
    });

    // Centraliza o carrossel
    if (slides.length <= 3) {
      carouselTrack.style.justifyContent = "center";
      carouselTrack.style.transform = "translateX(0)"; // Reseta a transformação
    } else {
      carouselTrack.style.justifyContent = "flex-start"; // Reseta para o comportamento padrão
    }
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlides();
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlides();
  }

  // Inicialização
  updateSlides();

  // Event Listeners
  nextButton.addEventListener("click", nextSlide);
  prevButton.addEventListener("click", prevSlide);

  // Opcional: Adicionar navegação por teclado
  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") {
      nextSlide();
    } else if (event.key === "ArrowLeft") {
      prevSlide();
    }
  });
});
