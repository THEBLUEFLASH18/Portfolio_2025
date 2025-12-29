

document.addEventListener("DOMContentLoaded", () => {
    const progressFill = document.querySelector(".progress-fill");
    let progress = 30;

    const interval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress > 100) {
            progress = 100;
            clearInterval(interval);
            window.location.href = 'index.html';
        }
        progressFill.style.width = `${progress}%`;
    }, 200);
});
