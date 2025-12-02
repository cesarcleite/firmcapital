document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const submitButton = document.getElementById("submit-button");
  const modal = document.getElementById("success-modal");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Ativar estado de loading
    submitButton.classList.add("loading");

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        showModal();
        form.reset();
      } else {
        throw new Error("Erro no envio");
      }
    } catch (error) {
      alert(
        "Ocorreu um erro ao enviar a mensagem. Por favor, tente novamente."
      );
    } finally {
      // Desativar estado de loading
      submitButton.classList.remove("loading");
    }
  });
});

function showModal() {
  const modal = document.getElementById("success-modal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("success-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// Fechar modal clicando fora
document.addEventListener("click", (e) => {
  const modal = document.getElementById("success-modal");
  if (e.target === modal) {
    closeModal();
  }
});
