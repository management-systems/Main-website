export function initContactForm() {
  const form = document.getElementById('contactForm');
  const msg = document.getElementById('formMessage');

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
        msg.textContent = result.message;
        msg.className = 'form-message success';
        form.reset();
      } else {
        msg.textContent = result.error;
        msg.className = 'form-message error';
      }
    } catch {
      msg.textContent = 'Something went wrong. Please WhatsApp us directly.';
      msg.className = 'form-message error';
    }
  });
}
