// AI Neural Network Background - Deferred & Optimized
window.addEventListener('load', function() {
  setTimeout(function() {
    const container = document.createElement('div');
    container.id = 'ai-bg';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;overflow:hidden;';
    document.body.appendChild(container);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let mouse = { x: -1000, y: -1000 };
    const COUNT = 35;
    const CONN_SQ = 140 * 140;
    const MOUSE_SQ = 180 * 180;
    const particles = [];

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 1
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const light = document.documentElement.getAttribute('data-theme') === 'light';

      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = light ? 'rgba(20,80,200,0.5)' : 'rgba(0,220,160,0.7)';
        ctx.fill();

        for (let j = i + 1; j < COUNT; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x, dy = p.y - p2.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < CONN_SQ) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = light ? `rgba(20,80,200,${(1 - dSq / CONN_SQ) * 0.15})` : `rgba(0,180,255,${(1 - dSq / CONN_SQ) * 0.25})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const mSq = mdx * mdx + mdy * mdy;
        if (mSq < MOUSE_SQ) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = light ? `rgba(0,160,120,${(1 - mSq / MOUSE_SQ) * 0.25})` : `rgba(0,255,180,${(1 - mSq / MOUSE_SQ) * 0.45})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', function() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
    window.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', function() { mouse.x = -1000; mouse.y = -1000; });

    draw();
  }, 100);
});
