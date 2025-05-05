const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
canvas.width = W; canvas.height = H;

window.addEventListener('resize', () => {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
});

function randomColor() {
  const colors = ['#ff0043', '#14fc56', '#1e90ff', '#fff200', '#ff7f00', '#ff00ff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

class Firework {
  constructor() {
    this.x = Math.random() * W;
    this.y = H;
    this.targetY = 100 + Math.random() * (H / 2);
    this.color = randomColor();
    this.particles = [];
    this.exploded = false;
  }
  update() {
    if (!this.exploded) {
      this.y -= 8;
      if (this.y <= this.targetY) {
        this.exploded = true;
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const speed = Math.random() * 4 + 2;
          this.particles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1
          });
        }
      }
    } else {
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha -= 0.015;
      });
      this.particles = this.particles.filter(p => p.alpha > 0);
    }
  }
  draw(ctx) {
    if (!this.exploded) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    } else {
      this.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });
    }
  }
  done() {
    return this.exploded && this.particles.length === 0;
  }
}

let fireworks = [];
let fireworkMode = "few"; // "few", "many", "off", "hearts"
let explosionTimeout = null;
let heartParticles = [];
let heartParticlesActive = false;

function animateFireworks() {
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // Controla la cantidad de fuegos artificiales según el modo
  let prob = 0.01;
  if (fireworkMode === "many") prob = 0.25;
  else if (fireworkMode === "few") prob = 0.02;
  else if (fireworkMode === "off") prob = 0;
  else if (fireworkMode === "hearts") prob = 0;

  if (Math.random() < prob) fireworks.push(new Firework());
  fireworks.forEach(fw => { fw.update(); fw.draw(ctx); });
  fireworks = fireworks.filter(fw => !fw.done());

  // Dibuja corazones flotantes si están activos
  if (heartParticlesActive) {
    drawHeartParticles();
  }

  requestAnimationFrame(animateFireworks);
}

// --- Corazones flotantes ---
function launchHeartParticles() {
  heartParticles = [];
  heartParticlesActive = true;
  // Genera muchos corazones en la parte baja de la pantalla
  for (let i = 0; i < 80; i++) {
    heartParticles.push({
      x: Math.random() * W,
      y: H + 30 + Math.random() * 60,
      size: 18 + Math.random() * 18,
      speed: 1.2 + Math.random() * 1.8,
      drift: (Math.random() - 0.5) * 1.2,
      alpha: 0.7 + Math.random() * 0.3,
      color: randomHeartColor(),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03
    });
  }
  // Los corazones flotan durante 15 segundos
  setTimeout(() => {
    heartParticlesActive = false;
    setTimeout(() => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    }, 800);
  }, 15000);
}

function drawHeartParticles() {
  heartParticles.forEach(h => {
    h.y -= h.speed;
    h.x += h.drift;
    h.alpha -= 0.003;
    h.rotation += h.rotationSpeed;
    drawHeart(ctx, h.x, h.y, h.size, h.color, h.alpha, h.rotation);
  });
  heartParticles = heartParticles.filter(h => h.y + h.size > 0 && h.alpha > 0);
}

// Dibuja un corazón en el canvas
function drawHeart(ctx, x, y, size, color, alpha, rotation) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  // Forma de corazón con Bezier
  let s = size / 32;
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(0, -12 * s, -16 * s, -12 * s, -16 * s, 0);
  ctx.bezierCurveTo(-16 * s, 12 * s, 0, 16 * s, 0, 28 * s);
  ctx.bezierCurveTo(0, 16 * s, 16 * s, 12 * s, 16 * s, 0);
  ctx.bezierCurveTo(16 * s, -12 * s, 0, -12 * s, 0, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 * s;
  ctx.fill();
  ctx.restore();
}

function randomHeartColor() {
  const colors = ['#ff0043', '#ff7f00', '#ff00ff', '#fff200', '#ffb6c1', '#ff69b4', '#e75480'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const intro = document.getElementById('intro-heart');
const main = document.getElementById('main-content');
const mensaje = document.querySelector('.mensaje');
const spans = document.querySelectorAll('.mensaje span');

const letterSpans = Array.from(spans).filter(span => span.textContent.trim() !== '');

// --- Estrellas animadas antes de formar la palabra ---
function animateStarsWander(wordSpans, callback) {
  const starsCount = wordSpans.length;
  const stars = [];
  const starElems = [];

  // Centro de la pantalla
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // Crea estrellas en posiciones aleatorias
  for (let i = 0; i < starsCount; i++) {
    const star = {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      elem: document.createElement('div')
    };
    star.elem.textContent = '⭐';
    star.elem.style.position = 'fixed';
    star.elem.style.left = `${star.x}px`;
    star.elem.style.top = `${star.y}px`;
    star.elem.style.fontSize = '2.5vw';
    star.elem.style.opacity = '0.85';
    star.elem.style.pointerEvents = 'none';
    star.elem.style.zIndex = '20';
    star.elem.style.transform = 'scale(0.9)';
    document.body.appendChild(star.elem);
    stars.push(star);
    starElems.push(star.elem);
  }

  let wanderTime = 0;
  const wanderDuration = 1800; // ms que pasean las estrellas (ajusta si quieres)
  let lastTime = performance.now();

  function wanderStep(now) {
    const dt = now - lastTime;
    lastTime = now;
    wanderTime += dt;

    // Mueve cada estrella
    for (let star of stars) {
      // Rebote en los bordes
      star.x += star.vx;
      star.y += star.vy;
      if (star.x < 0 || star.x > W - 32) star.vx *= -1;
      if (star.y < 0 || star.y > H - 32) star.vy *= -1;
      star.elem.style.left = `${star.x}px`;
      star.elem.style.top = `${star.y}px`;
    }

    if (wanderTime < wanderDuration) {
      requestAnimationFrame(wanderStep);
    } else {
      // Llama callback para formar la palabra
      callback(stars, starElems);
    }
  }
  requestAnimationFrame(wanderStep);
}

// --- Modifica showStarLetterSequence para usar el nuevo efecto ---
function showStarLetterSequence(callback) {
  mensaje.style.visibility = 'hidden';
  spans.forEach(span => {
    span.style.visibility = 'hidden';
    span.style.opacity = '0';
    span.style.transform = 'scale(1)';
  });

  mensaje.style.display = 'flex';
  mensaje.style.visibility = 'hidden';
  spans.forEach(span => { span.style.display = ''; });
  void mensaje.offsetWidth;

  // Solo calcula posiciones de letras
  const positions = [];
  letterSpans.forEach(span => {
    const rect = span.getBoundingClientRect();
    positions.push({
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    });
  });

  // 1. Paseo de estrellas antes de formar la palabra
  animateStarsWander(letterSpans, (stars, starElems) => {
    // 2. Ahora anima cada estrella hacia su letra
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    let i = 0;
    function animateNext() {
      if (i === 0) {
        mensaje.style.visibility = 'visible';
        fireworkMode = "few";
      }
      if (i >= letterSpans.length) {
        // Mostrar todas las letras y llamar callback
        letterSpans.forEach(span => {
          span.style.visibility = 'visible';
          span.style.opacity = '1';
          span.style.transform = 'scale(1)';
        });
        // Cambia a modo explosión de fuegos artificiales
        fireworkMode = "many";
        if (explosionTimeout) clearTimeout(explosionTimeout);
        explosionTimeout = setTimeout(() => {
          fireworkMode = "hearts";
          launchHeartParticles();
        }, 5000);
        if (callback) callback();
        // Elimina todas las estrellas DOM
        starElems.forEach(e => e.remove());
        return;
      }
      // Destino de la letra
      const dest = positions[i];
      const star = stars[i];
      // Anima la estrella hacia la letra
      gsap.to(star.elem, {
        duration: 0.7,
        left: `${dest.left - dest.width / 2}px`,
        top: `${dest.top - dest.height / 2}px`,
        scale: 1.2,
        ease: "power3.in",
        onComplete: () => {
          gsap.to(star.elem, {
            duration: 0.25,
            opacity: 0,
            scale: 1.8,
            onComplete: () => {
              star.elem.remove();
            }
          });
          letterSpans[i].style.visibility = 'visible';
          letterSpans[i].style.opacity = '0';
          letterSpans[i].style.transform = 'scale(2.2)';
          gsap.to(letterSpans[i], {
            duration: 0.4,
            opacity: 1,
            scale: 1,
            ease: "back.out(2)",
            onComplete: () => {
              i++;
              setTimeout(animateNext, 180);
            }
          });
        }
      });
    }
    animateNext();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Animación de latido extra con GSAP
  gsap.fromTo("#heart-shape", 
    { scale: 1, transformOrigin: "50% 60%" }, 
    { scale: 1.18, yoyo: true, repeat: 3, duration: 0.5, ease: "power1.inOut" }
  );
  // Espera la animación y luego transiciona
  setTimeout(() => {
    // Zoom in y fade out del corazón y fondo radial
    gsap.to("#heart-shape", {
      scale: 8,
      opacity: 0,
      duration: 1.3,
      ease: "power4.in"
    });
    gsap.to(".heart-bg", {
      opacity: 0,
      duration: 1.2,
      ease: "power2.in"
    });
    gsap.to(intro, { 
      opacity: 0, 
      duration: 1.2, 
      delay: 0.8, // espera a que el corazón haga zoom antes de ocultar todo el contenedor
      ease: "power2.inOut" 
    });
    gsap.to(main, { 
      opacity: 1, 
      filter: "blur(0px)", 
      duration: 1.2, 
      delay: 0.8,
      ease: "power2.inOut", 
      onStart: () => {
        main.style.pointerEvents = "auto";
      }
    });
    setTimeout(() => {
      intro.style.display = "none";
      showStarLetterSequence(() => {
        iniciarAnimaciones();
      });
    }, 1800);
  }, 2200); // tiempo total de intro
});

// --- Fuegos artificiales y animación de letras ---
function iniciarAnimaciones() {
  animateFireworks();

  // Animación automática de colores en cada letra
  const colores = [
    "#ff0043", "#14fc56", "#1e90ff", "#fff200", "#ff7f00", "#ff00ff", "#00fff7", "#fff"
  ];
  let colorIndex = 0;

  function animarLetras() {
    spans.forEach((span, i) => {
      const idx = (colorIndex - i + colores.length) % colores.length;
      span.style.color = colores[idx];
      span.style.background = "none";
      span.style.webkitBackgroundClip = "initial";
      span.style.webkitTextFillColor = "initial";
      span.style.textShadow =
        `0 2px 24px ${colores[idx]}, 0 0 16px #fff, 0 0 8px ${colores[idx]}, 0 0 2px #fff`;
    });
    colorIndex = (colorIndex + 1) % colores.length;
    setTimeout(animarLetras, 200);
  }
  animarLetras();
}

// --- Lanzar animaciones cuando main-content es visible ---
const observer = new MutationObserver(() => {
  if (main.style.opacity === "1") {
    iniciarAnimaciones();
    observer.disconnect();
  }
});
observer.observe(main, { attributes: true, attributeFilter: ['style'] });
