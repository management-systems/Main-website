// AI Neural Network Background - Optimized
(function() {
  const container = document.createElement('div');
  container.id = 'ai-bg';
  document.body.prepend(container);

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, particles = [], mouse = { x: -1000, y: -1000 };
  const COUNT = 45;
  const CONN = 160;
  const CONN_SQ = CONN * CONN;
  const MOUSE_SQ = 200 * 200;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const light = isLight();

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fillStyle = light ? 'rgba(20,80,200,0.5)' : 'rgba(0,220,160,0.7)';
      ctx.fill();

      // Lines between particles
      for (let j = i + 1; j < COUNT; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < CONN_SQ) {
          const opacity = (1 - dSq / CONN_SQ) * (light ? 0.15 : 0.25);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = light ? `rgba(20,80,200,${opacity})` : `rgba(0,180,255,${opacity})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // Mouse connection
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mSq = mdx * mdx + mdy * mdy;
      if (mSq < MOUSE_SQ) {
        const opacity = (1 - mSq / MOUSE_SQ) * (light ? 0.25 : 0.45);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = light ? `rgba(0,160,120,${opacity})` : `rgba(0,255,180,${opacity})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseout', () => { mouse.x = -1000; mouse.y = -1000; });

  resize();
  init();
  draw();
})();
