/**
 * GreenSeva Cosmetic Impact Scanner Frontend Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  setupScanTabs();
  setupPhotoUpload();
  setupManualForm();
});

// ── Tab Switching: Photo Upload vs Manual Entry ─────────────────────────────
function setupScanTabs() {
  const uploadBox = document.getElementById('box-upload-photo');
  const manualBox = document.getElementById('box-manual-entry');
  const btnUploadTab = document.getElementById('tab-btn-upload');
  const btnManualTab = document.getElementById('tab-btn-manual');

  if (!btnUploadTab || !btnManualTab) return;

  btnUploadTab.addEventListener('click', () => {
    btnUploadTab.classList.add('bg-primary-container', 'text-on-primary-container');
    btnUploadTab.classList.remove('border', 'border-outline-variant', 'text-on-surface');
    btnManualTab.classList.remove('bg-primary-container', 'text-on-primary-container');
    btnManualTab.classList.add('border', 'border-outline-variant', 'text-on-surface');
    if (uploadBox) uploadBox.classList.remove('hidden');
    if (manualBox) manualBox.classList.add('hidden');
  });

  btnManualTab.addEventListener('click', () => {
    btnManualTab.classList.add('bg-primary-container', 'text-on-primary-container');
    btnManualTab.classList.remove('border', 'border-outline-variant', 'text-on-surface');
    btnUploadTab.classList.remove('bg-primary-container', 'text-on-primary-container');
    btnUploadTab.classList.add('border', 'border-outline-variant', 'text-on-surface');
    if (manualBox) manualBox.classList.remove('hidden');
    if (uploadBox) uploadBox.classList.add('hidden');
  });
}

// ── Photo Upload Handler ────────────────────────────────────────────────────
function setupPhotoUpload() {
  const fileInput = document.getElementById('cosmetic-photo-input');
  const dropArea = document.getElementById('photo-drop-area');
  const previewImg = document.getElementById('photo-preview');
  const analyzeBtn = document.getElementById('btn-analyze-photo');

  if (!fileInput || !dropArea) return;

  dropArea.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (previewImg) {
          previewImg.src = event.target.result;
          previewImg.classList.remove('hidden');
        }
        if (analyzeBtn) analyzeBtn.disabled = false;
        dropArea.setAttribute('data-base64', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const base64 = dropArea.getAttribute('data-base64');
      if (!base64) {
        showToast('Please select a photo first', 'error');
        return;
      }
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Analyzing with AI...`;

      const res = await fetchAPI('/cosmetic/scan', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: base64 })
      });

      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `<span class="material-symbols-outlined">analytics</span> Analyze Photo`;

      if (!res.err && res.data) {
        showToast(res.message || 'Photo analyzed successfully!');
        renderScanResults(res.data, res.pointsEarned || 0);
      } else {
        showToast(res.message || 'Photo analysis failed', 'error');
      }
    });
  }
}

// ── Manual Product Entry Handler ────────────────────────────────────────────
function setupManualForm() {
  const form = document.getElementById('form-cosmetic-manual');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prodName = document.getElementById('manual-prod-name').value;
    const ingredients = document.getElementById('manual-prod-ing').value;
    const btn = document.getElementById('btn-manual-submit');

    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Searching & Analyzing...`;

    const res = await fetchAPI('/cosmetic/scan', {
      method: 'POST',
      body: JSON.stringify({ productName: prodName, ingredients })
    });

    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined">qr_code_scanner</span> Analyze & Earn Points`;

    if (!res.err && res.data) {
      showToast(res.message || 'Product analyzed successfully!');
      renderScanResults(res.data, res.pointsEarned || 0);
    } else {
      showToast(res.message || 'Analysis failed', 'error');
    }
  });
}

// ── Render Dynamic Results to Right Column ──────────────────────────────────
function renderScanResults(data, pointsEarned = 0) {
  const rightCol = document.getElementById('cosmetic-results-col');
  if (!rightCol) return;

  // Eco grade letter + badge colour
  const ecoLetter = data.ecoScore >= 90 ? 'A'
    : data.ecoScore >= 75 ? 'B'
    : data.ecoScore >= 60 ? 'C'
    : data.ecoScore >= 45 ? 'D' : 'E';
  const letterBg = data.ecoScore >= 75 ? 'bg-secondary text-on-secondary'
    : data.ecoScore >= 50 ? 'bg-tertiary-fixed-dim text-on-tertiary-container'
    : 'bg-error text-on-error';

  // Points milestone badge
  const badgeText = pointsEarned > 0
    ? `🎉 +${pointsEarned} Points Earned!`
    : 'Scan 5 products → +5 pts';
  const badgeBg = pointsEarned > 0
    ? 'bg-secondary-container text-on-secondary-container'
    : 'bg-primary-container text-on-primary-container';

  // Harmful chemicals list
  let harmHtml = '';
  if (data.harmfulChemicals && data.harmfulChemicals.length > 0) {
    harmHtml = data.harmfulChemicals.map(c => {
      const riskColour = c.risk === 'High' ? 'bg-error text-on-error'
        : c.risk === 'Moderate' ? 'bg-tertiary-container text-on-tertiary-container'
        : 'bg-surface-variant text-on-surface-variant';
      return `
        <div class="py-3 border-b border-surface-variant flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-2.5 h-2.5 rounded-full bg-error mt-1.5 shrink-0"></div>
            <div>
              <p class="font-body-md font-semibold text-error">${c.name}</p>
              <p class="font-label-sm text-label-sm text-outline mt-0.5">${c.description}</p>
            </div>
          </div>
          <span class="${riskColour} px-2.5 py-1 rounded font-label-sm font-bold whitespace-nowrap">${c.risk} Risk</span>
        </div>
      `;
    }).join('');
  } else {
    harmHtml = `
      <div class="py-4 text-center text-primary font-label-md flex items-center justify-center gap-2">
        <span class="material-symbols-outlined">check_circle</span>
        No hazardous parabens, phthalates, or microplastics detected — safe for skin &amp; marine environments.
      </div>
    `;
  }

  // Green alternatives list
  let altHtml = '';
  if (data.greenAlternatives && data.greenAlternatives.length > 0) {
    altHtml = data.greenAlternatives.map(alt => {
      const prodUrl = alt.url || alt.link
        || `https://www.amazon.com/s?k=${encodeURIComponent(alt.name + ' ' + alt.brand)}`;
      return `
        <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-surface-variant">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-secondary text-2xl">eco</span>
            <div>
              <h4 class="font-label-md text-label-md font-bold text-on-surface">${alt.name}</h4>
              <p class="font-label-sm text-label-sm text-outline">${alt.brand} • Eco-Score: ${alt.ecoScore}/100</p>
            </div>
          </div>
          <a href="${prodUrl}" target="_blank" rel="noopener noreferrer"
             class="bg-primary text-on-primary text-label-sm px-4 py-2 rounded-full font-label-md hover:bg-primary-container transition-all flex items-center gap-1 shadow-sm">
            <span>View Item</span>
            <span class="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        </div>
      `;
    }).join('');
  }

  // Render full result panel
  rightCol.innerHTML = `
    <div class="glass-panel rounded-xl p-6 shadow-md border border-primary/20 space-y-6" style="animation: fadeIn 0.3s ease">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="font-headline-lg text-headline-lg text-primary font-bold">${data.productName}</h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            ${data.brand ? `<span class="font-semibold">${data.brand}</span> &bull; ` : ''}
            Safety: <strong class="${data.safetyRating === 'Safe' ? 'text-primary' : 'text-error'}">${data.safetyRating}</strong>
          </p>
        </div>
        <div class="${badgeBg} px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0">
          <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">stars</span>
          <span class="font-label-sm font-bold">${badgeText}</span>
        </div>
      </div>

      <!-- Scores Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-5 flex items-center gap-4">
          <div class="w-16 h-16 rounded-full ${letterBg} flex items-center justify-center font-display-lg text-display-lg shadow-sm shrink-0">
            ${ecoLetter}
          </div>
          <div>
            <p class="font-label-md text-label-md text-outline">Eco Score</p>
            <p class="font-headline-md text-headline-md text-on-background font-bold">${data.ecoScore} / 100</p>
          </div>
        </div>
        <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl">co2</span>
          </div>
          <div>
            <p class="font-label-md text-label-md text-outline">Est. Carbon Saved</p>
            <p class="font-headline-md text-headline-md text-on-background font-bold">0.5 kg CO₂</p>
          </div>
        </div>
      </div>

      <!-- Toxicity Analysis -->
      <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-6">
        <h3 class="font-headline-md text-headline-md text-on-surface mb-3 font-bold">Toxicity &amp; Chemical Analysis</h3>
        <div class="divide-y divide-surface-variant">
          ${harmHtml}
        </div>
      </div>

      <!-- Eco Alternatives -->
      <div class="space-y-3">
        <h3 class="font-headline-md text-headline-md text-on-surface font-bold">Recommended Eco Alternatives</h3>
        <div class="space-y-3">
          ${altHtml || '<p class="font-body-md text-on-surface-variant">No alternatives found.</p>'}
        </div>
      </div>
    </div>
  `;

  if (typeof gsap !== 'undefined') {
    gsap.from('#cosmetic-results-col > div', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    });
  }
}
