/**
 * GreenSeva Global Application & Frontend Integration Script
 */

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (localStorage.getItem('useLocalBackend') === 'true' ? 'http://localhost:8000/api' : 'https://greensevaproject.onrender.com/api')
  : 'https://greensevaproject.onrender.com/api';
const TOKEN_KEY = 'gsToken';
const PROTECTED_PAGES = ['dashboard.html', 'cosmetic.html', 'foodreview.html', 'rewards.html'];



// Toast Notification System
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('gs-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'gs-toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-primary text-on-primary border-primary-container' : 'bg-error-container text-on-error-container border-error';
  const icon = type === 'success' ? 'check_circle' : 'error';

  toast.className = `pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl border ${bgColor} transition-all duration-300 transform translate-y-4 opacity-0`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-2xl">${icon}</span>
      <p class="font-label-md text-label-md">${message}</p>
    </div>
    <button class="opacity-70 hover:opacity-100 p-1" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// API Helper
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`API call error to ${endpoint}:`, err);
    return { err: true, message: 'Server communication error. Please ensure backend server is running.' };
  }
}

// Global Auth State Management
let currentUser = null;

async function checkAuth() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    const res = await fetchAPI('/auth/me');
    if (!res.err && res.user) {
      currentUser = res.user;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      currentUser = null;
    }

  }

  updateNavbarAuthUI();
  enforceRouteProtection();
}

function getCurrentPageName() {
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1);
  return page || 'index.html';
}

function enforceRouteProtection() {
  const currentPage = getCurrentPageName();
  if (PROTECTED_PAGES.includes(currentPage) && !currentUser) {
    sessionStorage.setItem('gs_redirect_target', currentPage);
    renderAuthModal();

    setTimeout(() => {
      openAuthModal('login');
      showToast('Please log in or sign up to access this page.', 'error');
    }, 100);

    // Add non-interactive blur overlay over main content if modal is closed without login
    let lockOverlay = document.getElementById('gs-lock-overlay');
    if (!lockOverlay) {
      lockOverlay = document.createElement('div');
      lockOverlay.id = 'gs-lock-overlay';
      lockOverlay.className = 'fixed inset-0 z-[9985] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6';
      lockOverlay.innerHTML = `
        <div class="bg-surface text-on-surface p-8 rounded-2xl max-w-md w-full shadow-2xl border border-primary/40 relative z-[9986] opacity-100">
          <span class="material-symbols-outlined text-6xl text-primary mb-3 font-bold">lock</span>
          <h2 class="font-headline-lg text-headline-lg text-primary font-bold mb-2">Login Required</h2>
          <p class="font-body-md text-on-surface-variant font-medium mb-6">You must be logged in to view your Dashboard and access GreenSeva features.</p>
          <div class="flex flex-col gap-3">
            <button onclick="openAuthModal('login')" class="w-full bg-primary text-on-primary py-3.5 rounded-full font-label-md font-bold shadow-lg hover:bg-primary-container transition-all">
              Log In Now
            </button>
            <button onclick="openAuthModal('register')" class="w-full border-2 border-primary text-primary py-3 rounded-full font-label-md font-bold hover:bg-primary/10 transition-all">
              Create New Account
            </button>
            <a href="index.html" class="font-label-md text-on-surface-variant hover:text-primary hover:underline mt-2 inline-block font-semibold">Return to Home</a>
          </div>
        </div>
      `;
      document.body.appendChild(lockOverlay);
    }
  } else {
    const lockOverlay = document.getElementById('gs-lock-overlay');
    if (lockOverlay) lockOverlay.remove();
  }
}

function updateNavbarAuthUI() {
  const navActionContainers = document.querySelectorAll('.md\\:flex.items-center.gap-4, .hidden.md\\:flex.items-center.gap-4');
  navActionContainers.forEach(container => {
    if (currentUser) {
      container.innerHTML = `
        <div class="flex items-center gap-2 bg-secondary-container/60 text-on-secondary-container px-3 py-1.5 rounded-full border border-secondary/20 font-label-md text-label-md">
          <span class="material-symbols-outlined text-sm text-secondary">nest_eco_leaf</span>
          <span id="nav-green-points">${currentUser.greenPoints || 250}</span> Points
        </div>
        <a href="dashboard.html" class="font-label-md text-label-md text-primary hover:underline font-semibold">
          Hi, ${currentUser.name.split(' ')[0]}
        </a>
        <button onclick="handleLogout()" class="font-label-md text-label-md border border-outline px-4 py-1.5 rounded-full hover:bg-error/10 hover:border-error hover:text-error transition-colors">
          Logout
        </button>
      `;
    } else {
      container.innerHTML = `
        <button onclick="openAuthModal('login')" class="font-label-md text-label-md text-primary border border-primary px-4 py-2 rounded-full hover:bg-primary/5 transition-colors">Start Scanning</button>
        <button onclick="openAuthModal('register')" class="font-label-md text-label-md bg-primary text-on-primary px-6 py-2 rounded-full hover:bg-primary-container transition-colors shadow-sm">Join Now</button>
        <button onclick="openAuthModal('login')" class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors">Login</button>
      `;
    }
  });
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('gs_redirect_target');
  currentUser = null;
  showToast('Logged out successfully');
  updateNavbarAuthUI();
  const currentPage = getCurrentPageName();
  if (PROTECTED_PAGES.includes(currentPage)) {
    window.location.href = 'index.html';
  }
}


// Global Auth Modal Handler
function renderAuthModal() {
  if (document.getElementById('gs-auth-modal')) return;

  const modalHtml = `
    <div id="gs-auth-modal" class="fixed inset-0 z-[9990] hidden flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-opacity">
      <div class="bg-surface text-on-surface rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl relative border border-primary/30 z-[9995] opacity-100 animate-in fade-in zoom-in duration-200">
        <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full">
          <span class="material-symbols-outlined">close</span>
        </button>
        
        <!-- Tabs -->
        <div class="flex border-b border-surface-variant mb-6">
          <button id="tab-login" onclick="switchAuthTab('login')" class="flex-1 py-3 text-center font-headline-md text-headline-md text-primary border-b-2 border-primary font-bold transition-all">Log In</button>
          <button id="tab-register" onclick="switchAuthTab('register')" class="flex-1 py-3 text-center font-headline-md text-headline-md text-on-surface-variant font-bold transition-all">Sign Up</button>
        </div>

        <!-- Login Form -->
        <form id="form-login" onsubmit="submitLogin(event)" class="space-y-4">
          <div>
            <label class="block font-label-md text-label-md mb-1 text-on-surface">Email Address</label>
            <input type="email" id="login-email" required class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" placeholder="name@example.com"/>
          </div>
          <div>
            <label class="block font-label-md text-label-md mb-1 text-on-surface">Password</label>
            <input type="password" id="login-password" autocomplete="current-password" required class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" placeholder="••••••••"/>
          </div>
          <button type="submit" class="w-full bg-primary text-on-primary py-3.5 rounded-full font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all mt-2">
            Log In to GreenSeva
          </button>
        </form>

        <!-- Register Form -->
        <form id="form-register" onsubmit="submitRegister(event)" class="space-y-4 hidden">
          <div>
            <label class="block font-label-md text-label-md mb-1 text-on-surface">Full Name</label>
            <input type="text" id="register-name" autocomplete="name" required class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Sofiya Sharma"/>
          </div>
          <div>
            <label class="block font-label-md text-label-md mb-1 text-on-surface">Email Address</label>
            <input type="email" id="register-email" autocomplete="email" required class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" placeholder="name@example.com"/>
          </div>
          <div>
            <label class="block font-label-md text-label-md mb-1 text-on-surface">Password</label>
            <input type="password" id="register-password" autocomplete="new-password" required class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" placeholder="••••••••"/>
          </div>
          <div>
            <label class="block font-label-md text-label-md mb-1 text-on-surface">Account Type</label>
            <select id="register-role" class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="user">Individual Eco Citizen</option>
              <option value="NGO">NGO / Food Rescue Partner</option>
            </select>
          </div>
          <button type="submit" class="w-full bg-primary text-on-primary py-3.5 rounded-full font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all mt-2">
            Create Account (+250 Bonus Points)
          </button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openAuthModal(mode = 'login') {
  renderAuthModal();
  switchAuthTab(mode);
  const modal = document.getElementById('gs-auth-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('gs-auth-modal');
  if (modal) modal.classList.add('hidden');
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');

  if (tab === 'login') {
    loginTab.className = 'flex-1 py-3 text-center font-headline-md text-headline-md text-primary border-b-2 border-primary font-bold transition-all';
    regTab.className = 'flex-1 py-3 text-center font-headline-md text-headline-md text-on-surface-variant font-bold transition-all';
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    regTab.className = 'flex-1 py-3 text-center font-headline-md text-headline-md text-primary border-b-2 border-primary font-bold transition-all';
    loginTab.className = 'flex-1 py-3 text-center font-headline-md text-headline-md text-on-surface-variant font-bold transition-all';
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

async function handlePostAuthRedirect() {
  const target = sessionStorage.getItem('gs_redirect_target');
  sessionStorage.removeItem('gs_redirect_target');

  const lockOverlay = document.getElementById('gs-lock-overlay');
  if (lockOverlay) lockOverlay.remove();

  if (target && target !== getCurrentPageName()) {
    window.location.href = target;
  } else if (getCurrentPageName() === 'index.html') {
    window.location.href = 'dashboard.html';
  } else {
    window.location.reload();
  }
}

async function submitLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (!res.err && res.token) {
    localStorage.setItem(TOKEN_KEY, res.token);
    currentUser = res.user;

    showToast(res.message || 'Login successful!');
    closeAuthModal();
    updateNavbarAuthUI();
    handlePostAuthRedirect();
  } else {
    showToast(res.message || 'Invalid email or password', 'error');
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;

  const res = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role })
  });

  if (!res.err && res.token) {
    localStorage.setItem(TOKEN_KEY, res.token);
    currentUser = res.user;

    showToast(res.message || 'Welcome to GreenSeva! Account created.');
    closeAuthModal();
    updateNavbarAuthUI();
    handlePostAuthRedirect();
  } else {
    showToast(res.message || 'Registration failed', 'error');
  }
}

// Mobile Menu Drawer Handler
function setupMobileMenu() {
  const menuButtons = document.querySelectorAll('button span.material-symbols-outlined:hover, button .material-symbols-outlined');
  menuButtons.forEach(btn => {
    if (btn.textContent.trim() === 'menu') {
      const parentBtn = btn.parentElement;
      parentBtn.onclick = () => {
        let mobileDrawer = document.getElementById('gs-mobile-drawer');
        if (!mobileDrawer) {
          mobileDrawer = document.createElement('div');
          mobileDrawer.id = 'gs-mobile-drawer';
          mobileDrawer.className = 'fixed inset-0 z-[9980] bg-surface p-6 flex flex-col justify-between shadow-2xl transition-all duration-300';
          mobileDrawer.innerHTML = `
            <div>
              <div class="flex justify-between items-center mb-8 border-b pb-4">
                <img src="GreenSevaLogo.png" class="logo h-10" alt="Logo"/>
                <button onclick="document.getElementById('gs-mobile-drawer').remove()" class="p-2 text-primary">
                  <span class="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <nav class="flex flex-col gap-4 font-label-md text-body-lg">
                <a href="index.html" class="p-2 hover:text-primary border-b border-surface-variant">Home</a>
                <a href="dashboard.html" class="p-2 hover:text-primary border-b border-surface-variant">Dashboard</a>
                <a href="cosmetic.html" class="p-2 hover:text-primary border-b border-surface-variant">Cosmetic Scanner</a>
                <a href="foodreview.html" class="p-2 hover:text-primary border-b border-surface-variant">Food Rescue</a>
                <a href="rewards.html" class="p-2 hover:text-primary border-b border-surface-variant">Rewards</a>
                <a href="about.html" class="p-2 hover:text-primary border-b border-surface-variant">About Us</a>
                <a href="contact.html" class="p-2 hover:text-primary border-b border-surface-variant">Contact</a>
              </nav>
            </div>
            <div class="pt-6 border-t flex flex-col gap-3">
              ${currentUser ? `
                <button onclick="handleLogout()" class="w-full py-3 bg-error text-on-error rounded-full font-label-md">Logout (${currentUser.name})</button>
              ` : `
                <button onclick="document.getElementById('gs-mobile-drawer').remove(); openAuthModal('login')" class="w-full py-3 border border-primary text-primary rounded-full font-label-md">Log In</button>
                <button onclick="document.getElementById('gs-mobile-drawer').remove(); openAuthModal('register')" class="w-full py-3 bg-primary text-on-primary rounded-full font-label-md">Join GreenSeva</button>
              `}
            </div>
          `;
          document.body.appendChild(mobileDrawer);
        } else {
          mobileDrawer.remove();
        }
      };
    }
  });
}

// Fix broken nav links across all HTML pages (e.g. foodrescue.html vs foodreview.html)
function normalizeHeaderLinks() {
  const links = document.querySelectorAll('a[href="foodrescue.html"]');
  links.forEach(l => l.setAttribute('href', 'foodreview.html'));
}

// GSAP Global Entrance Animations
function initGSAPAnimations() {
  if (typeof gsap === 'undefined') return;

  // Animate Navbar
  gsap.from('nav#topNav, nav', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  // Animate Header / Main Hero Titles & Subtitles
  if (document.querySelector('h1')) {
    gsap.from('h1', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.2,
      ease: 'power3.out'
    });
  }

  if (document.querySelector('main header p, main p.text-body-lg')) {
    gsap.from('main header p, main p.text-body-lg', {
      y: 20,
      opacity: 0,
      duration: 0.7,
      delay: 0.35,
      ease: 'power2.out'
    });
  }

  // Animate Glass Panels & Hero Cards
  if (document.querySelectorAll('.glass-panel, .bg-gradient-to-r').length > 0) {
    gsap.from('.glass-panel, .bg-gradient-to-r', {
      y: 25,
      opacity: 0,
      duration: 0.8,
      delay: 0.3,
      stagger: 0.1,
      ease: 'power2.out'
    });
  }

  // Animate General Card Containers (Grid items)
  const cards = document.querySelectorAll('.grid > div');
  if (cards.length > 0) {
    gsap.from(cards, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      delay: 0.4,
      stagger: 0.08,
      ease: 'power2.out'
    });
  }
}

// Execute on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  renderAuthModal();
  checkAuth();
  setupMobileMenu();
  normalizeHeaderLinks();
  initGSAPAnimations();
});

// initApp — awaitable version of checkAuth for page scripts
async function initApp() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        resolve();
      });
    } else {
      checkAuth().then(resolve);
    }
  });
}
