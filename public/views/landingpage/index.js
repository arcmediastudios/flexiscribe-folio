var prevScrollPos = window.pageYOffset;

function openSideMenu() {
    document.getElementById("mySideMenu").classList.toggle("side-menu-open");
}

window.onscroll = function() {
    var logo = document.querySelector(".logo");
    var hamburger = document.querySelector(".hamburger");
    var currentScrollPos = window.pageYOffset;

    if (currentScrollPos <= 0) {
        logo.style.top = "20px";
        logo.style.left = "20px";
        hamburger.style.transform = "translateY(0)";
        hamburger.classList.remove("hidden");
    } else {
        logo.style.top = "-50px";
        logo.style.left = "20px";
        hamburger.style.transform = "translateY(-50px)";
        hamburger.classList.add("hidden");
    }

    prevScrollPos = currentScrollPos;
};
