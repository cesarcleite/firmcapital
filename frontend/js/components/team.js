document.addEventListener("DOMContentLoaded", function () {
  const track = document.querySelector(".team-carousel-track");
  const prevButton = document.querySelector(".team-carousel-button.team-prev");
  const nextButton = document.querySelector(".team-carousel-button.team-next");
  const members = document.querySelectorAll(".team-member");
  const membersToShow = 4;
  let currentPosition = 0;

  prevButton.addEventListener("click", () => {
    currentPosition = Math.max(0, currentPosition - membersToShow);
    track.style.transform = `translateX(-${currentPosition * 25}%)`;
  });

  nextButton.addEventListener("click", () => {
    currentPosition = Math.min(
      members.length - membersToShow,
      currentPosition + membersToShow
    );
    track.style.transform = `translateX(-${currentPosition * 25}%)`;
  });
});
