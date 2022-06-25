backToTopBtn = document.querySelector(".back-to-top-wrapper");

function scrollFunction() {
  if (
    document.body.scrollTop > 500 ||
    document.documentElement.scrollTop > 500
  ) {
    backToTopBtn.classList.add("active");
  } else {
    backToTopBtn.classList.remove("active");
  }
}

function goToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

if (backToTopBtn) {
  window.onscroll = function () {
    scrollFunction();
  };
}
