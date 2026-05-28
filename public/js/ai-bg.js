// AI Neural Network Background
(function() {
  const container = document.createElement('div');
  container.id = 'ai-bg';
  document.body.prepend(container);

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, particles = [], mouse = { x: -1000, y: -1000 };
  const PARTICLE_COUNT = 80;
  const CONNECTION_DIST = 180;
  const MOUSE_DIST = 220;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const light = isLight();
    const dotColor = light ? 'rgba(24,95,165,' : 'rgba(29,158,117,';
    const lineColor = light ? 'rgba(24,95,165,' : 'rgba(55,138,221,';
    const mouseLineColor = light ? 'rgba(29,158,117,' : 'rgba(29,158,117,';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dotColor + (light ? '0.5)' : '0.7)');
      ctx.fill();

      // Connect to nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const opacity = (1 - dist / CONNECTION_DIST) * (light ? 0.15 : 0.25);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = lineColor + opacity + ')';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // Connect to mouse
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < MOUSE_DIST) {
        const opacity = (1 - mDist / MOUSE_DIST) * (light ? 0.25 : 0.45);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = mouseLineColor + opacity + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseout', () => { mouse.x = -1000; mouse.y = -1000; });

  resize();
  createParticles();
  draw();
})();
