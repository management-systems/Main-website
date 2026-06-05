function showPopup(message, isSuccess) {
  const existing = document.querySelector('.form-popup-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'form-popup-overlay';
  overlay.innerHTML = `
    <div class="form-popup ${isSuccess ? 'success' : 'error'}">
      <p>${message}</p>
      <button class="form-popup-close">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.form-popup-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

export function initContactForm() {
  const form = document.getElementById('contactForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok) {
        showPopup('Form sent successfully!', true);
        form.reset();
      } else {
        showPopup(result.error, false);
      }
    } catch {
      showPopup('Something went wrong. Please WhatsApp us directly.', false);
    }
  });
}
