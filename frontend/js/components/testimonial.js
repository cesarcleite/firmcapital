document.addEventListener("DOMContentLoaded", function () {
  const carouselTrack = document.querySelector(".testimonial-carousel-track");
  const slides = Array.from(carouselTrack.children);
  const prevButton = document.querySelector(
    ".testimonial-carousel-button.testimonial-prev"
  );
  const nextButton = document.querySelector(
    ".testimonial-carousel-button.testimonial-next"
  );

  let currentSlide = 0;

  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove(
        "testimonial-previous",
        "testimonial-current",
        "testimonial-next"
      );

      if (index === currentSlide) {
        slide.classList.add("testimonial-current");
      } else if (index === (currentSlide - 1 + slides.length) % slides.length) {
        slide.classList.add("testimonial-previous");
      } else if (index === (currentSlide + 1) % slides.length) {
        slide.classList.add("testimonial-next");
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
