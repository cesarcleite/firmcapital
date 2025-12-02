document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".clients-track");

  // Duplica os logos para criar o efeito infinito
  const logos = track.innerHTML;
  track.innerHTML = logos + logos;

  // Reinicia a animação quando necessário
  track.addEventListener("animationend", () => {
    track.style.transform = "translateX(0)";
    void track.offsetWidth; // Força um reflow
    track.style.animation = "none";

    setTimeout(() => {
      track.style.animation = "scroll 30s linear infinite";
    }, 0);
  });
});
