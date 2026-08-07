/**
 * GreenSeva Rewards & Challenge Workflow Integration
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadUserPointsBalance();
  await loadChallenges();
  await loadRewardsCatalog();
});

// Helper for colored status badges
function getStatusBadgeHtml(status) {
  switch (status) {
    case 'Accepted':
      return `<span class="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full font-label-sm font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">flag</span> Accepted</span>`;
    case 'Pending Verification':
      return `<span class="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full font-label-sm font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">hourglass_top</span> Pending Verification</span>`;
    case 'AI Verified':
      return `<span class="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full font-label-sm font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">smart_toy</span> AI Verified</span>`;
    case 'Approved':
      return `<span class="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-label-sm font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">verified</span> Approved</span>`;
    case 'Rewarded':
      return `<span class="bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-full font-label-sm font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">stars</span> Rewarded</span>`;
    case 'Rejected':
      return `<span class="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full font-label-sm font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">cancel</span> Rejected</span>`;
    default:
      return `<span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-label-sm font-bold">Not Started</span>`;
  }
}

// ── Load user's live Eco Tokens balance ───────────────────────────────────
async function loadUserPointsBalance() {
  const res = await fetchAPI('/auth/me');
  if (!res.err && res.user) {
    const balEl = document.getElementById('rewards-balance');
    if (balEl) balEl.textContent = res.user.greenPoints?.toLocaleString() ?? 0;

    const navPts = document.getElementById('nav-green-points');
    if (navPts) navPts.textContent = res.user.greenPoints?.toLocaleString() ?? 0;
  }
}

// ── Load 5 Challenges ──────────────────────────────────────────────────────
async function loadChallenges() {
  const grid = document.getElementById('challenges-grid');
  if (!grid) return;

  const res = await fetchAPI('/rewards/challenges');
  if (res.err || !res.challenges) {
    grid.innerHTML = `<p class="col-span-full text-center text-outline">Failed to load challenges.</p>`;
    return;
  }

  grid.innerHTML = res.challenges.map(c => {
    const isStarted = !!c.userStatus;
    const badge = isStarted ? getStatusBadgeHtml(c.userStatus) : '';

    return `
      <div class="bg-surface-bright rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300">
        <div class="h-36 rounded-xl mb-4 overflow-hidden relative bg-gradient-to-br ${c.bgGradient || 'from-primary-container to-surface-container-high'} p-4 flex items-center justify-center">
          <span class="material-symbols-outlined text-[70px] text-primary" style="font-variation-settings: 'FILL' 1;">${c.icon || 'eco'}</span>
          <div class="absolute top-3 right-3">
            ${badge}
          </div>
        </div>
        <div class="flex flex-col flex-grow">
          <span class="text-secondary font-label-sm uppercase tracking-wide mb-1">${c.category} &bull; ${c.verificationType.replace('_', ' ')}</span>
          <h3 class="font-headline-md text-headline-md text-on-surface mb-2 font-bold">${c.title}</h3>
          <p class="font-body-md text-on-surface-variant mb-6 flex-grow">${c.description}</p>
          
          <div class="flex items-center justify-between gap-3 pt-2 border-t border-surface-variant">
            <span class="font-label-md font-bold text-primary flex items-center gap-1">
              <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">psychiatry</span>
              ${c.rewardPoints} Eco Tokens
            </span>

            ${!isStarted ? `
              <button onclick="handleStartChallenge('${c.key}')" class="bg-secondary text-on-secondary px-5 py-2.5 rounded-full font-label-md font-bold hover:bg-secondary/90 transition-all flex items-center gap-1.5 shadow-sm">
                <span>Start Challenge</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            ` : `
              <button onclick="openProgressModal('${c.key}')" class="bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-md font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm">
                <span>View Progress</span>
                <span class="material-symbols-outlined text-sm">visibility</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Start Challenge ────────────────────────────────────────────────────────
async function handleStartChallenge(challengeKey) {
  const res = await fetchAPI('/rewards/start-challenge', {
    method: 'POST',
    body: JSON.stringify({ challengeKey })
  });

  if (!res.err) {
    showToast(res.message || 'Challenge started!');
    await loadChallenges();
    openProgressModal(challengeKey);
  } else {
    showToast(res.message || 'Could not start challenge', 'error');
  }
}

// ── Open Challenge Progress & Proof Upload Modal ─────────────────────────────
async function openProgressModal(challengeKey) {
  const res = await fetchAPI(`/rewards/submission/${challengeKey}`);
  if (res.err || !res.challenge) {
    showToast('Failed to load challenge details', 'error');
    return;
  }

  const { challenge, submission } = res;
  const status = submission?.status || 'Accepted';

  let modal = document.getElementById('gs-progress-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'gs-progress-modal';
  modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto';

  // Build verification input field UI according to verificationType
  let uploadSectionHtml = '';
  if (status === 'Rewarded') {
    uploadSectionHtml = `
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center my-4">
        <span class="material-symbols-outlined text-4xl text-emerald-600 mb-1">stars</span>
        <h4 class="font-headline-md text-emerald-900 font-bold">Challenge Completed &amp; Rewarded!</h4>
        <p class="font-body-md text-emerald-700 mt-1">+${challenge.rewardPoints} Eco Tokens credited to your account balance.</p>
      </div>
    `;
  } else if (challenge.verificationType === 'before_after') {
    uploadSectionHtml = `
      <div class="space-y-4 my-4">
        <h4 class="font-label-md font-bold text-on-surface">Upload Before &amp; After Photos</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div id="before-box" onclick="document.getElementById('before-file').click()" class="border-2 border-dashed border-primary/40 rounded-xl p-4 text-center cursor-pointer hover:bg-primary/5 transition-all">
            <input type="file" id="before-file" accept="image/*" class="hidden" onchange="handleModalFileSelect(this, 'before-preview', 'before-box')"/>
            <span class="material-symbols-outlined text-3xl text-primary">add_a_photo</span>
            <p class="font-label-md text-on-surface font-semibold mt-1">Before Photo</p>
            <img id="before-preview" class="hidden w-full h-24 object-cover rounded-lg mt-2 shadow-sm"/>
          </div>
          <div id="after-box" onclick="document.getElementById('after-file').click()" class="border-2 border-dashed border-primary/40 rounded-xl p-4 text-center cursor-pointer hover:bg-primary/5 transition-all">
            <input type="file" id="after-file" accept="image/*" class="hidden" onchange="handleModalFileSelect(this, 'after-preview', 'after-box')"/>
            <span class="material-symbols-outlined text-3xl text-primary">add_a_photo</span>
            <p class="font-label-md text-on-surface font-semibold mt-1">After Photo</p>
            <img id="after-preview" class="hidden w-full h-24 object-cover rounded-lg mt-2 shadow-sm"/>
          </div>
        </div>
        <button id="btn-submit-proof" onclick="handleSubmitProof('${challengeKey}', 'before_after')" class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md">
          <span class="material-symbols-outlined">analytics</span> Submit Photos for AI Verification
        </button>
      </div>
    `;
  } else if (challenge.verificationType === 'qr') {
    uploadSectionHtml = `
      <div class="space-y-4 my-4 text-center">
        <h4 class="font-label-md font-bold text-on-surface">Scan Event QR Code</h4>
        <div class="bg-surface-container p-6 rounded-xl border border-surface-variant flex flex-col items-center justify-center space-y-3">
          <span class="material-symbols-outlined text-6xl text-primary animate-pulse">qr_code_scanner</span>
          <input type="text" id="qr-input" value="GREENSEVA-ECO-EVENT-2026" placeholder="Enter or scan QR code" class="w-full text-center font-mono py-2.5 px-4 border border-outline-variant rounded-lg bg-surface"/>
        </div>
        <button id="btn-submit-proof" onclick="handleSubmitProof('${challengeKey}', 'qr')" class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md">
          <span class="material-symbols-outlined">qr_code_scanner</span> Verify QR Code &amp; Claim Tokens
        </button>
      </div>
    `;
  } else {
    // Single Photo or Receipt
    uploadSectionHtml = `
      <div class="space-y-4 my-4">
        <h4 class="font-label-md font-bold text-on-surface">Upload Proof (${challenge.verificationType === 'receipt' ? 'Receipt / Kiosk Photo' : 'Sapling Photo'})</h4>
        <div id="single-box" onclick="document.getElementById('single-file').click()" class="border-2 border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:bg-primary/5 transition-all">
          <input type="file" id="single-file" accept="image/*" class="hidden" onchange="handleModalFileSelect(this, 'single-preview', 'single-box')"/>
          <span class="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
          <p class="font-label-md text-on-surface font-semibold mt-1">Upload Photo / Document</p>
          <p class="font-label-sm text-outline">Supports PNG, JPG, WEBP</p>
          <img id="single-preview" class="hidden w-full h-36 object-cover rounded-xl mt-2 shadow-sm"/>
        </div>
        <button id="btn-submit-proof" onclick="handleSubmitProof('${challengeKey}', '${challenge.verificationType}')" class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md">
          <span class="material-symbols-outlined">verified</span> Submit Proof for Verification
        </button>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="glass-panel bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-primary/30 my-8">
      <button onclick="document.getElementById('gs-progress-modal').remove()" class="absolute top-4 right-4 text-on-surface-variant p-1 hover:text-primary">
        <span class="material-symbols-outlined">close</span>
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
          <span class="material-symbols-outlined text-2xl">${challenge.icon || 'eco'}</span>
        </div>
        <div>
          <h3 class="font-headline-md text-primary font-bold">${challenge.title}</h3>
          <p class="font-label-sm text-outline">${challenge.rewardPoints} Eco Tokens &bull; ${challenge.category}</p>
        </div>
      </div>

      <!-- Status Timeline -->
      <div class="bg-surface-container-low p-4 rounded-xl border border-surface-variant mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-label-sm font-bold text-on-surface uppercase">Current Status</span>
          ${getStatusBadgeHtml(status)}
        </div>

        <div class="relative flex items-center justify-between text-center pt-4">
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full ${['Accepted','Pending Verification','AI Verified','Approved','Rewarded'].includes(status) ? 'bg-primary text-on-primary' : 'bg-surface-variant text-outline'} flex items-center justify-center font-bold text-xs">1</div>
            <span class="font-label-sm text-[10px] mt-1">Accepted</span>
          </div>
          <div class="flex-1 h-1 bg-surface-variant mx-1">
            <div class="h-1 bg-primary ${['Pending Verification','AI Verified','Approved','Rewarded'].includes(status) ? 'w-full' : 'w-0'} transition-all"></div>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full ${['Pending Verification','AI Verified','Approved','Rewarded'].includes(status) ? 'bg-primary text-on-primary' : 'bg-surface-variant text-outline'} flex items-center justify-center font-bold text-xs">2</div>
            <span class="font-label-sm text-[10px] mt-1">Submitted</span>
          </div>
          <div class="flex-1 h-1 bg-surface-variant mx-1">
            <div class="h-1 bg-primary ${['AI Verified','Approved','Rewarded'].includes(status) ? 'w-full' : 'w-0'} transition-all"></div>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full ${['Approved','Rewarded'].includes(status) ? 'bg-primary text-on-primary' : 'bg-surface-variant text-outline'} flex items-center justify-center font-bold text-xs">3</div>
            <span class="font-label-sm text-[10px] mt-1">Approved</span>
          </div>
          <div class="flex-1 h-1 bg-surface-variant mx-1">
            <div class="h-1 bg-primary ${status === 'Rewarded' ? 'w-full' : 'w-0'} transition-all"></div>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full ${status === 'Rewarded' ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-outline'} flex items-center justify-center font-bold text-xs">4</div>
            <span class="font-label-sm text-[10px] mt-1">Rewarded</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <p class="font-body-md text-on-surface-variant mb-4">${challenge.description}</p>

      <!-- Proof Upload Section -->
      ${uploadSectionHtml}
    </div>
  `;
  document.body.appendChild(modal);
}

// Helper for file previews in modal
function handleModalFileSelect(input, previewId, boxId) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const prev = document.getElementById(previewId);
      if (prev) {
        prev.src = e.target.result;
        prev.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }
}

// ── Submit Challenge Proof ─────────────────────────────────────────────────
async function handleSubmitProof(challengeKey, verificationType) {
  const btn = document.getElementById('btn-submit-proof');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Sending to Mistral AI...`;
  }

  let proofUrls = [];
  let qrCode = '';

  if (verificationType === 'qr') {
    qrCode = document.getElementById('qr-input')?.value || 'GREENSEVA-ECO-EVENT-2026';
  } else if (verificationType === 'before_after') {
    const beforeSrc = document.getElementById('before-preview')?.src || '';
    const afterSrc = document.getElementById('after-preview')?.src || '';
    proofUrls = [beforeSrc, afterSrc].filter(s => s && s.startsWith('data:'));
    if (proofUrls.length === 0) {
      showToast('Please upload both Before and After photos', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-symbols-outlined">analytics</span> Submit Photos for AI Verification`; }
      return;
    }
  } else {
    const singleSrc = document.getElementById('single-preview')?.src || '';
    proofUrls = [singleSrc].filter(s => s && s.startsWith('data:'));
    if (proofUrls.length === 0) {
      showToast('Please upload a proof photo first', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-symbols-outlined">verified</span> Submit Proof for Verification`; }
      return;
    }
  }

  const res = await fetchAPI('/rewards/submit-proof', {
    method: 'POST',
    body: JSON.stringify({ challengeKey, proofUrls, qrCode })
  });

  const modal = document.getElementById('gs-progress-modal');

  if (!res.err) {
    // Show Mistral AI result card in modal before it closes
    const scoreHtml = res.aiScore
      ? `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4 text-left">
           <div class="flex items-center gap-2 mb-1">
             <span class="material-symbols-outlined text-emerald-600">smart_toy</span>
             <span class="font-label-md font-bold text-emerald-800">Mistral AI Verified</span>
             <span class="ml-auto bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">${res.aiScore}/100</span>
           </div>
           <p class="font-body-md text-emerald-700">${res.aiNotes || 'Image verified successfully.'}</p>
         </div>`
      : '';

    if (modal) {
      const uploadSection = modal.querySelector('.space-y-4');
      if (uploadSection) uploadSection.insertAdjacentHTML('beforeend', scoreHtml);
    }

    showToast(res.message || 'Proof verified! 🎉');

    // Close modal and refresh page data after showing result
    setTimeout(async () => {
      if (modal) modal.remove();
      await loadUserPointsBalance();
      await loadChallenges();
      await loadRewardsCatalog();
    }, 2000);

  } else {
    // Show Mistral AI rejection inside the modal
    const rejectionHtml = `
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="material-symbols-outlined text-red-600">smart_toy</span>
          <span class="font-label-md font-bold text-red-800">Mistral AI – Verification Failed</span>
          <span class="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">${res.aiScore || 0}/100</span>
        </div>
        <p class="font-body-md text-red-700">${res.aiNotes || res.message || 'Could not confirm the proof image.'}</p>
        <p class="font-label-sm text-red-500 mt-1">Upload a clearer, more relevant photo and try again.</p>
      </div>`;

    if (modal) {
      const uploadSection = modal.querySelector('.space-y-4');
      if (uploadSection) {
        const old = uploadSection.querySelector('.bg-red-50');
        if (old) old.remove();
        uploadSection.insertAdjacentHTML('beforeend', rejectionHtml);
      }
    }

    showToast(res.message || 'AI verification failed', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">refresh</span> Retry Verification`;
    }
  }
}


// ── Load Rewards Catalog (5 Rewards) ───────────────────────────────────────
async function loadRewardsCatalog() {
  const userRes = await fetchAPI('/auth/me');
  const currentPts = !userRes.err && userRes.user ? (userRes.user.greenPoints || 0) : 0;

  const rewardsGrid = document.getElementById('rewards-catalog-grid');
  if (!rewardsGrid) return;

  const res = await fetchAPI('/rewards/catalog');

  if (!res.err && res.rewards && res.rewards.length > 0) {
    rewardsGrid.innerHTML = res.rewards.map(reward => {
      const canRedeem = currentPts >= reward.pointsRequired;
      return `
        <div class="bg-surface-bright rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${!canRedeem ? 'opacity-80' : ''}">
          <div class="h-40 rounded-xl mb-4 overflow-hidden relative bg-surface-container">
            <img class="w-full h-full object-cover" src="${reward.imageUrl}" alt="${reward.title}" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'"/>
            <div class="absolute top-3 right-3 z-20 bg-surface/90 backdrop-blur-sm px-3 py-1 rounded-full text-primary font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
              <span class="material-symbols-outlined text-[14px]">${canRedeem ? 'lock_open' : 'lock'}</span>
              ${canRedeem ? 'Unlocked' : `${reward.pointsRequired} Tokens`}
            </div>
          </div>
          <div class="flex flex-col flex-grow">
            <div class="flex justify-between items-center mb-1">
              <span class="text-secondary font-label-sm uppercase tracking-wide">${reward.partner}</span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container text-outline">${reward.availability || 'Available'}</span>
            </div>
            <h3 class="font-headline-md text-headline-md text-on-surface mb-2 font-bold">${reward.title}</h3>
            <p class="font-body-md text-on-surface-variant mb-6 flex-grow">${reward.description}</p>
            <button
              onclick="handleRedeemReward('${reward._id}')"
              ${!canRedeem ? 'disabled' : ''}
              class="w-full ${canRedeem
                ? 'bg-primary hover:bg-primary/90 text-on-primary'
                : 'bg-surface-variant text-outline cursor-not-allowed'
              } h-12 rounded-lg font-label-md transition-colors flex items-center justify-center gap-2 font-bold shadow-sm">
              ${canRedeem ? `Redeem &bull; ${reward.pointsRequired} Tokens` : `Need ${reward.pointsRequired - currentPts} more tokens`}
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">toll</span>
            </button>
          </div>
        </div>`;
    }).join('');
  } else {
    rewardsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <span class="material-symbols-outlined text-5xl text-outline mb-2">card_giftcard</span>
        <h3 class="font-headline-md text-on-surface">No rewards available right now.</h3>
      </div>`;
  }
}

// ── Redeem reward with simulated Admin Approval ────────────────────────────
async function handleRedeemReward(rewardId) {
  const res = await fetchAPI('/rewards/claim', {
    method: 'POST',
    body: JSON.stringify({ rewardId })
  });

  if (!res.err) {
    showToast(res.message || 'Redemption request approved! 🎉');
    openVoucherModal(res.discountCode, res.newPointsBalance);
    await loadUserPointsBalance();
    await loadRewardsCatalog();
  } else {
    showToast(res.message || 'Redemption failed', 'error');
  }
}

// ── Voucher modal ──────────────────────────────────────────────────────────
function openVoucherModal(code, newPts) {
  let modal = document.getElementById('gs-voucher-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'gs-voucher-modal';
  modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="glass-panel bg-surface rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative border border-primary/30">
      <button onclick="document.getElementById('gs-voucher-modal').remove()" class="absolute top-4 right-4 text-on-surface-variant p-1">
        <span class="material-symbols-outlined">close</span>
      </button>

      <div class="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-3xl">verified</span>
      </div>

      <h2 class="font-headline-lg text-primary font-bold mb-1">Admin Approved! 🌿</h2>
      <p class="font-label-sm text-secondary uppercase font-bold tracking-wider mb-2">Status: Redeemed</p>
      <p class="font-body-md text-on-surface-variant mb-6">Present your redemption voucher code to claim your eco reward.</p>

      <div class="bg-surface-container-high p-4 rounded-xl border border-dashed border-primary mb-4">
        <span class="font-label-sm text-outline uppercase block mb-1">Your Redemption Code</span>
        <span id="voucher-code" class="font-display-lg text-headline-lg text-primary font-mono tracking-widest font-extrabold select-all">${code || 'GREEN-SAVER-2026'}</span>
      </div>
      ${newPts !== undefined ? `<p class="font-label-sm text-on-surface-variant mb-4">New Token Balance: <strong class="text-primary">${newPts} Eco Tokens</strong></p>` : ''}

      <button onclick="navigator.clipboard.writeText('${code}'); showToast('Code copied to clipboard!')"
        class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
        <span class="material-symbols-outlined">content_copy</span> Copy Redemption Code
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}
