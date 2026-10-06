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
    // Clear candidates when switching back to a project with only one image.
    if (project.sources) {
      image.sizes = project.sizes;
      image.srcset = project.sources.map(source => `${source.src} ${source.width}w`).join(', ');
    } else {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
    }
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
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function syncNameInteraction() {
  nameButton.disabled = reduceMotion.matches;
  if (reduceMotion.matches) {
    nameButton.setAttribute('role', 'presentation');
    nameButton.removeAttribute('aria-label');
  } else {
    nameButton.removeAttribute('role');
    nameButton.setAttribute('aria-label', ui.animate);
  }
}
syncNameInteraction();
let frame = 0;
let titleMode = "idle";
const wordmark = nameButton.querySelector(".wordmark");
// A zero-size inline box exposes the browser's real text baseline. Centering
// the canvas ink bounds instead makes the title jump when the effect starts.
const baselineProbe = document.createElement("span");
baselineProbe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
baselineProbe.setAttribute("aria-hidden", "true");
wordmark.append(baselineProbe);
const titleLetters = Array.from(wordmark.firstChild.textContent, (letter) => {
  const span = document.createElement("span");
  span.textContent = letter;
  span.className = "title-letter";
  return span;
});
wordmark.firstChild.replaceWith(...titleLetters);
let hoveredLetter = null;
const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
function stopParticles() {
  cancelAnimationFrame(frame);
  titleMode = "idle";
  hoveredLetter?.classList.remove("hovered-letter");
  hoveredLetter = null;
  nameButton.classList.remove("playing");
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}
function prepareTitle() {
  const rect = canvas.getBoundingClientRect();
  const textRect = wordmark.getBoundingClientRect();
  const style = getComputedStyle(wordmark);
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(canvas.width / rect.width, 0, 0, canvas.height / rect.height, 0, 0);
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.letterSpacing = style.letterSpacing;
  context.textBaseline = "alphabetic";
  context.fillStyle = style.color;
  context.strokeStyle = style.color;
  context.lineWidth = 1;
  const x = textRect.left - rect.left;
  const baseline = baselineProbe.getBoundingClientRect().top - rect.top;
  const label = wordmark.textContent;
  context.fillText(label, x, baseline);
  return { context, rect, x, baseline, label };
}
nameButton.addEventListener("click", () => {
  if (reduceMotion.matches || titleMode === "click") return;
  stopParticles();
  const title = prepareTitle();
  if (!title) return;
  const { context, rect } = title;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const dots = [];
  const spacing = rect.width < 450 ? 3 : 4;
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  for (let y = 0; y < rect.height; y += spacing) {
    for (let x = 0; x < rect.width; x += spacing) {
      if (pixels[(Math.floor(y * sy) * canvas.width + Math.floor(x * sx)) * 4 + 3] > 120)
        dots.push({ x, y, dx: (Math.random() - 0.5) * 80, dy: (Math.random() - 0.5) * 70 });
    }
  }
  titleMode = "click";
  nameButton.classList.add("playing");
  const start = performance.now();
  function draw(now) {
    const progress = Math.min((now - start) / 1250, 1);
    if (progress === 1 || reduceMotion.matches) {
      stopParticles();
      return;
    }
    const spread = Math.sin(progress * Math.PI);
    context.clearRect(0, 0, rect.width, rect.height);
    for (const dot of dots)
      context.fillRect(dot.x + dot.dx * spread, dot.y + dot.dy * spread, spacing * 0.8, spacing * 0.8);
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
});
nameButton.addEventListener("pointermove", (event) => {
  if (reduceMotion.matches || !hoverPointer.matches || titleMode === "click") return;
  const letter = event.target.closest(".title-letter");
  if (letter === hoveredLetter) return;
  stopParticles();
  if (!letter || !letter.textContent.trim()) return;
  const title = prepareTitle();
  if (!title) return;
  const { context, rect, baseline } = title;
  const letterRect = letter.getBoundingClientRect();
  const x = letterRect.left - rect.left;
  const label = letter.textContent;
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillText(label, x, baseline);
  // Sample points on the actual glyph contours, retaining the site's font.
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const points = [];
  const step = Math.max(14, rect.width / 55);
  for (let px = 0; px < rect.width; px += step) {
    let first = -1;
    let last = -1;
    for (let py = 0; py < rect.height; py++) {
      if (pixels[(Math.floor(py * sy) * canvas.width + Math.floor(px * sx)) * 4 + 3] > 120) {
        if (first < 0) first = py;
        last = py;
      }
    }
    if (first >= 0) {
      points.push({ x: px, y: first });
      if (last - first > step) points.push({ x: px, y: last });
    }
  }
  titleMode = "hover";
  hoveredLetter = letter;
  letter.classList.add("hovered-letter");
  const start = performance.now();
  function drawHover(now) {
    const progress = Math.min((now - start) / 900, 1);
    context.clearRect(0, 0, rect.width, rect.height);
    context.globalAlpha = 1;
    context.strokeText(label, x, baseline);
    context.globalAlpha = 1 - Math.min(progress * 3, 1);
    context.fillText(label, x, baseline);
    for (const point of points) {
      const phase = Math.max(0, Math.min((progress - (point.x - x) / letterRect.width * 0.45) * 3, 1));
      context.globalAlpha = phase;
      context.beginPath();
      context.arc(point.x, point.y, 1.4 + Math.sin(phase * Math.PI) * 2, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    if (progress < 1) frame = requestAnimationFrame(drawHover);
  }
  frame = requestAnimationFrame(drawHover);
});
nameButton.addEventListener("pointerleave", () => {
  if (titleMode === "hover") stopParticles();
});
window.addEventListener("resize", stopParticles);
reduceMotion.addEventListener("change", () => { stopParticles(); syncNameInteraction(); });
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
const mobileFilm = window.matchMedia('(max-width: 760px)');
const connection = navigator.connection;
const allowAmbientPlayback = () => !mobileFilm.matches && !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
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
      allowAmbientPlayback() &&
        !manuallyPaused.has(target) &&
        !document.hidden
      )
        target.play().catch(syncVideoControls);
    });
  },
  { threshold: 0.35 },
);
films.forEach((film) => observer.observe(film));
const pauseForPreferences = () => { if (reduceMotion.matches || !allowAmbientPlayback()) films.forEach(film => film.pause()); };
reduceMotion.addEventListener('change', pauseForPreferences);
mobileFilm.addEventListener('change', pauseForPreferences);
connection?.addEventListener('change', pauseForPreferences);
document.addEventListener("visibilitychange", () => {
  films.forEach((film) => {
    if (document.hidden) film.pause();
    else if (
      visibleFilms.has(film) &&
      !film.hidden &&
      !reduceMotion.matches &&
      allowAmbientPlayback() &&
      !manuallyPaused.has(film)
    )
      film.play().catch(syncVideoControls);
  });
});
syncVideoControls();

}
