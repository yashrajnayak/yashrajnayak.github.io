/* The page is complete HTML. These enhancements are optional. */
const siteData = JSON.parse(document.getElementById("site-data").textContent);
const projects = siteData.projects;
const ui = siteData.ui;
const pins = [...document.querySelectorAll("[data-project]")];
pins.forEach((pin) => {
  pin.disabled = false;
});
pins.forEach((pin) =>
  pin.addEventListener("click", () => {
    const project = projects[pin.dataset.project];
    if (!project) return;
    pins.forEach((button) =>
      button.setAttribute("aria-pressed", String(button === pin)),
    );
    const image = document.getElementById("map-image");
    image.src = project.image;
    image.alt = project.alt;
    document.getElementById("map-category").textContent = project.category;
    document.getElementById("map-title").textContent = project.title;
    document.getElementById("map-description").textContent =
      project.description;
    document.getElementById("map-link").href = project.link;
  }),
);

const nameButton = document.querySelector(".name-button");
const canvas = document.getElementById("name-particles");
nameButton.disabled = false;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;
function stopParticles() {
  cancelAnimationFrame(frame);
  nameButton.classList.remove("playing");
  const context = canvas.getContext("2d");
  context?.clearRect(0, 0, canvas.width, canvas.height);
}
nameButton.addEventListener("click", () => {
  if (reduceMotion.matches || nameButton.classList.contains("playing")) return;
  const text = nameButton.querySelector(".wordmark");
  const rect = nameButton.getBoundingClientRect();
  const style = getComputedStyle(text);
  canvas.width = Math.ceil(rect.width);
  canvas.height = Math.ceil(rect.height);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.letterSpacing = style.letterSpacing;
  context.textBaseline = "alphabetic";
  context.fillStyle = style.color;
  const metrics = context.measureText(text.textContent);
  const baseline =
    (canvas.height +
      metrics.actualBoundingBoxAscent -
      metrics.actualBoundingBoxDescent) /
    2;
  context.fillText(text.textContent, 0, baseline);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const dots = [];
  const spacing = rect.width < 450 ? 3 : 4;
  for (let y = 0; y < canvas.height; y += spacing) {
    for (let x = 0; x < canvas.width; x += spacing) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 120)
        dots.push({
          x,
          y,
          dx: (Math.random() - 0.5) * 80,
          dy: (Math.random() - 0.5) * 70,
        });
    }
  }
  nameButton.classList.add("playing");
  const start = performance.now();
  function draw(now) {
    const progress = Math.min((now - start) / 1250, 1);
    if (progress === 1 || reduceMotion.matches) {
      stopParticles();
      return;
    }
    const spread = Math.sin(progress * Math.PI);
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const dot of dots)
      context.fillRect(
        dot.x + dot.dx * spread,
        dot.y + dot.dy * spread,
        spacing * 0.8,
        spacing * 0.8,
      );
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
});
reduceMotion.addEventListener("change", stopParticles);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopParticles();
});

// Native local video: no third-party player or branding overlay.
const films = [...document.querySelectorAll(".ambient-video")];
const mainFilm = document.getElementById("btw-film");
const filmControls = document.querySelector(".film-controls");
const playButton = document.querySelector('[data-film-action="play"]');
const soundButton = document.querySelector('[data-film-action="sound"]');
const visibleFilms = new Set();
const manuallyPaused = new WeakSet();
if (mainFilm) {
filmControls.hidden = false;
mainFilm.controls = false;
function syncVideoControls() {
  playButton.textContent = mainFilm.paused ? ui.play : ui.pause;
  soundButton.textContent = mainFilm.muted ? ui.soundOn : ui.soundOff;

}
function toggleFilm(film) {
  if (film.paused) {
    manuallyPaused.delete(film);
    film.play().catch(syncVideoControls);
  } else {
    manuallyPaused.add(film);
    film.pause();
  }
}
playButton.addEventListener("click", () => toggleFilm(mainFilm));
soundButton.addEventListener("click", () => {
  mainFilm.muted = !mainFilm.muted;
  syncVideoControls();
});
document
  .querySelector('[data-film-action="fullscreen"]')
  .addEventListener("click", async () => {
    if (mainFilm.requestFullscreen)
      await mainFilm.requestFullscreen().catch(() => {});
    else if (mainFilm.webkitEnterFullscreen) mainFilm.webkitEnterFullscreen();
  });
films.forEach((film) => {
  film.addEventListener("play", syncVideoControls);
  film.addEventListener("pause", syncVideoControls);
});
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
      isIntersecting = isIntersecting && intersectionRatio >= 0.35;
      if (isIntersecting) visibleFilms.add(target);
      else visibleFilms.delete(target);
      if (!isIntersecting) target.pause();
      else if (
        !target.hidden &&
        !reduceMotion.matches &&
        !manuallyPaused.has(target) &&
        !document.hidden
      )
        target.play().catch(syncVideoControls);
    });
  },
  { threshold: 0.35 },
);
films.forEach((film) => observer.observe(film));
reduceMotion.addEventListener("change", () => {
  if (reduceMotion.matches) films.forEach((film) => film.pause());
});
document.addEventListener("visibilitychange", () => {
  films.forEach((film) => {
    if (document.hidden) film.pause();
    else if (
      visibleFilms.has(film) &&
      !film.hidden &&
      !reduceMotion.matches &&
      !manuallyPaused.has(film)
    )
      film.play().catch(syncVideoControls);
  });
});
syncVideoControls();

}
