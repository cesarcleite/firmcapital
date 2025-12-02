// Menu scroll
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".main-nav");
  const logo = document.querySelector(".logo img");

  if (window.scrollY > 50) {
    nav.classList.add("scrolled");
    logo.src = "images/logos/logo_firm2.png";
  } else {
    nav.classList.remove("scrolled");
    logo.src = "images/logos/logo_firm.png";
  }
});

// Menu mobile
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  menuToggle.classList.toggle("active");
});

// Fechar menu ao clicar em link
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuToggle.classList.remove("active");
  });
});
