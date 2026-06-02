const canvas = document.querySelector("#fx");
const ctx = canvas.getContext("2d", { alpha: true });
const colors = ["#4285f4", "#ea4335", "#fbbc04", "#34a853"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = {
  frame: 0,
  particles: [],
  pointer: { x: innerWidth * 0.5, y: innerHeight * 0.5 },
  running: true,
};

const MAX_PARTICLES = reduceMotion ? 36 : 140;
const DPR_LIMIT = 1.25;

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, DPR_LIMIT);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawn(x, y, amount = 1, force = 1) {
  const room = MAX_PARTICLES - state.particles.length;
  const count = Math.max(0, Math.min(amount, room));

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.16 + Math.random() * 0.62) * force;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 120 + Math.random() * 150,
      size: 0.8 + Math.random() * 1.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinkle: Math.random() * Math.PI * 2,
    });
  }
}

function seed() {
  state.particles = [];
  const amount = reduceMotion ? 24 : 84;
  for (let i = 0; i < amount; i += 1) {
    spawn(Math.random() * innerWidth, Math.random() * innerHeight, 1, 0.35);
  }
}

function drawParticle(particle) {
  const alpha = Math.max(0, 1 - particle.age / particle.life);
  const pulse = 0.7 + Math.sin(particle.twinkle) * 0.3;
  ctx.globalAlpha = alpha * pulse * 0.54;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}

function tick() {
  if (!state.running) return;

  state.frame += 1;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.globalCompositeOperation = "source-over";

  if (!reduceMotion && state.frame % 5 === 0) {
    const centerX = innerWidth * 0.5;
    const centerY = innerHeight * 0.42;
    const radius = Math.min(innerWidth, innerHeight) * (0.2 + Math.random() * 0.26);
    const angle = performance.now() * 0.00016 + Math.random() * Math.PI * 2;
    spawn(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * 0.42, 1, 0.42);
  }

  state.particles = state.particles.filter((particle) => {
    particle.age += 1;
    particle.twinkle += 0.045;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.992;
    particle.vy *= 0.992;

    drawParticle(particle);

    return particle.age < particle.life && particle.x > -40 && particle.x < innerWidth + 40 && particle.y > -40 && particle.y < innerHeight + 40;
  });

  window.__particleCount = state.particles.length;

  requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  resize();
  seed();
});

window.addEventListener("pointermove", (event) => {
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  if (!reduceMotion && state.frame % 3 === 0) {
    spawn(event.clientX, event.clientY, 1, 0.9);
  }
});

document.addEventListener("visibilitychange", () => {
  state.running = !document.hidden;
  if (state.running) requestAnimationFrame(tick);
});

resize();
seed();
requestAnimationFrame(tick);
