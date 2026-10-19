/**
 * app.js — bootstraps the SPA, handles routing between pages.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }

  const loginPage = document.getElementById('login-page');
  const appShell  = document.getElementById('app');

  // ── Auth gate ────────────────────────────────────────────────
  if (!Auth.isLoggedIn()) {
    loginPage.style.display = 'flex';
    appShell.style.display  = 'none';
    initLoginForm();
    return;
  }

  showApp();
});

function initLoginForm() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = form.querySelector('button[type=submit]');
    const user = form.username.value.trim();
    const pass = form.password.value;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    try {
      await Auth.login(user, pass);
      window.location.reload();
    } catch (err) {
      Toast.show(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

function showApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display        = 'flex';

  const u = Auth.currentUser();
  document.getElementById('user-label').textContent = u?.fullName || u?.username || '';

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

  // Nav routing
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Boot default page
  navigate('dashboard');

  // Load page data on first open
  Dashboard.load();
}

function navigate(pageId) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.page === pageId));
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === `page-${pageId}`));

  // Lazy-load page data
  if (pageId === 'dashboard') Dashboard.load();
  if (pageId === 'ojt')       OjtPage.load();
  if (pageId === 'repairs')   RepairsPage.load();
  if (pageId === 'barcode')   BarcodePage.init();
}

// ── Toast helper ──────────────────────────────────────────────
const Toast = (() => {
  const el = document.getElementById('toast');
  let timer;
  function show(msg, type = 'info', duration = 3000) {
    el.textContent = msg;
    el.className   = `show ${type}`;
    clearTimeout(timer);
    timer = setTimeout(() => { el.className = ''; }, duration);
  }
  return { show };
})();
