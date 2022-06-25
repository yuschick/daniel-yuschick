const backToTopWrapper = document.querySelector(".back-to-top-wrapper");
const backToTopBtn = backToTopWrapper.querySelector("button");

function scrollFunction() {
  if (
    document.body.scrollTop > 500 ||
    document.documentElement.scrollTop > 500
  ) {
    backToTopWrapper.classList.add("active");
    backToTopBtn.tabIndex = 0;
  } else {
    backToTopWrapper.classList.remove("active");
    backToTopBtn.tabIndex = -1;
  }
}

function goToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

if (backToTopWrapper) {
  window.onscroll = function () {
    scrollFunction();
  };
}
