/**
 * dashboard.js — GreenSeva Dashboard (fully dynamic, API-driven)
 */
(async function () {
  // Wait for app.js to initialize & run auth check
  if (typeof initApp === 'function') await initApp();

  // If user is not authenticated, app.js enforceRouteProtection handles opening the login modal & lock overlay
  if (!currentUser) return;


  // ── Helper: safe element update ────────────────────────────────────────────
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // ── Fetch dashboard stats ──────────────────────────────────────────────────
  async function loadDashboard() {
    try {
      const data = await fetchAPI('/user/dashboard-stats');
      if (data.err) throw new Error(data.message);
      populateDashboard(data.stats);
    } catch (err) {
      console.error('Dashboard load error:', err);
      showToast('Could not load dashboard data. Please refresh.', 'error');
    }
  }

  // ── Populate all UI elements ───────────────────────────────────────────────
  function populateDashboard(s) {
    // Welcome & points
    set('dash-welcome', `Welcome back, ${s.name || 'Eco Hero'}! 🌿`);
    set('dash-green-points', s.greenPoints?.toLocaleString() ?? 0);

    // Navbar green points (from app.js global)
    const navPts = document.getElementById('nav-green-points');
    if (navPts) navPts.textContent = s.greenPoints?.toLocaleString() ?? 0;

    // Carbon ring
    const ring = document.getElementById('dash-co2-ring');
    if (ring) ring.setAttribute('stroke-dashoffset', s.co2Dashoffset ?? 283);
    set('dash-co2-pct', `${s.co2Percent ?? 0}%`);
    set('dash-co2-saved', `${(s.co2SavedKg ?? 0).toFixed(1)} kg`);

    // Stats grid
    set('dash-scan-count', s.scanCount ?? 0);
    set('dash-items-rescued', s.itemsRescued ?? 0);
    set('dash-streak', `${s.streakDays ?? 0}d`);
    set('dash-co2-stat', `${(s.co2SavedKg ?? 0).toFixed(1)}`);

    // Level & next level
    set('dash-level', s.level ?? 'Eco Seedling');
    set(
      'dash-pts-to-next',
      s.ptsToNext ? `${s.ptsToNext} pts to next level` : 'Max level reached! 🏆'
    );

    // Badges (unlock based on user activity)
    updateBadge('badge-scanner', s.scanCount >= 1);
    updateBadge('badge-rescuer', s.itemsRescued >= 1);
    updateBadge('badge-planter', s.greenPoints >= 500);
    updateBadge('badge-streak', s.streakDays >= 3);

    // Activity feed
    renderActivityFeed(s.activityFeed || []);
  }

  // ── Badge unlock visual ────────────────────────────────────────────────────
  function updateBadge(id, unlocked) {
    const el = document.getElementById(id);
    if (!el) return;
    if (unlocked) {
      el.classList.remove('opacity-50', 'grayscale');
      el.classList.add('opacity-100');
      el.querySelector('.w-12')?.classList.remove('bg-surface-container');
      el.querySelector('.w-12')?.classList.add('bg-primary-container');
      el.querySelector('.material-symbols-outlined')?.classList.remove('text-on-surface-variant');
      el.querySelector('.material-symbols-outlined')?.classList.add('text-primary');
    } else {
      el.classList.add('opacity-50', 'grayscale');
    }
  }

  // ── Activity feed renderer ─────────────────────────────────────────────────
  function renderActivityFeed(feed) {
    const list = document.getElementById('dash-activity-feed');
    if (!list) return;

    if (!feed.length) {
      list.innerHTML = `
        <li class="text-center py-8 text-on-surface-variant">
          <span class="material-symbols-outlined text-5xl block mb-3 text-primary/40">eco</span>
          <p class="font-body-md">No activity yet. Start by scanning a product!</p>
          <a href="cosmetic.html" class="mt-3 inline-block text-primary font-label-md hover:underline">
            Scan Now →
          </a>
        </li>`;
      return;
    }

    list.innerHTML = feed.map(item => `
      <li class="flex items-center gap-4 py-2 border-b border-surface-container-highest last:border-0 animate-[fadeIn_0.3s_ease]">
        <div class="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary flex-shrink-0">
          <span class="material-symbols-outlined text-xl">${item.icon || 'eco'}</span>
        </div>
        <div class="flex-grow min-w-0">
          <p class="font-body-md text-body-md text-on-surface font-medium truncate">${item.title}</p>
          <p class="font-label-sm text-label-sm text-on-surface-variant truncate">${item.subtitle}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="font-label-md text-label-md text-secondary font-bold">${item.points}</span>
          <p class="font-label-sm text-label-sm text-on-surface-variant">${item.time}</p>
        </div>
      </li>`).join('');
  }

  // ── Quick access card navigation ───────────────────────────────────────────
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = btn.dataset.nav;
    });
  });

  // Wire up quick action buttons if they exist
  const scanBtn = document.querySelector('button[data-target="cosmetic.html"]') ||
    document.querySelectorAll('button')[0];

  // Load on boot
  await loadDashboard();

  // Auto-refresh every 60 seconds
  setInterval(loadDashboard, 60_000);
})();
