/**
 * GreenSeva Contact Form Interactivity Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Message...';
      }

      const res = await fetchAPI('/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, message })
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }

      if (!res.err) {
        showToast(res.message || 'Message sent successfully!');
        form.reset();
      } else {
        showToast(res.message || 'Failed to send message', 'error');
      }
    });
  }
});
