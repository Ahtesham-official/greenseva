/**
 * GreenSeva Food Rescue Marketplace Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  setupFoodMarketplace();
  await loadFoodListings();
});

function setupFoodMarketplace() {
  const filterBar = document.querySelector('.glass-card.rounded-xl.p-4');
  if (filterBar && !document.getElementById('btn-post-food')) {
    const postBtn = document.createElement('button');
    postBtn.id = 'btn-post-food';
    postBtn.className = 'bg-secondary text-on-secondary font-label-md px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-secondary/90 transition-all shadow-md';
    postBtn.innerHTML = `<span class="material-symbols-outlined text-sm">add_circle</span> Post Surplus Food`;
    postBtn.onclick = openPostFoodModal;
    filterBar.prepend(postBtn);
  }

  // Wire up category filter buttons
  const filterBtns = document.querySelectorAll('.glass-card.rounded-xl.p-4 button:not(#btn-post-food)');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Visual: deactivate all, activate clicked
      filterBtns.forEach(b => {
        b.className = 'border border-outline-variant text-on-surface hover:bg-surface-variant font-label-md text-label-md px-4 py-2 rounded-full flex items-center gap-2 transition-colors';
      });
      btn.className = 'bg-primary-container text-on-primary-container font-label-md text-label-md px-4 py-2 rounded-full flex items-center gap-2 transition-transform hover:scale-[1.02]';
      const cat = btn.textContent.trim();
      loadFoodListings(cat === 'Cooked Meals' ? 'Meals' : cat === 'Snacks' ? 'All' : cat);
    });
  });
}

async function loadFoodListings(category = 'All') {
  const grid = document.getElementById('food-listings-grid') ||
    document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-full text-center py-12">
      <span class="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p class="font-body-md text-on-surface-variant mt-2">Loading active food rescue listings...</p>
    </div>
  `;

  const res = await fetchAPI(`/food/listings?category=${category}`);

  if (!res.err && res.listings && res.listings.length > 0) {
    grid.innerHTML = res.listings.map(item => `
      <div class="glass-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg border border-surface-variant">
        <div class="relative h-48 bg-surface-container">
          <img class="w-full h-full object-cover" src="${item.imageUrl || 'foodthali.jpg'}" alt="${item.title}"/>
          <div class="absolute top-3 left-3 bg-secondary-container/90 backdrop-blur-sm text-on-secondary-container font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <span class="material-symbols-outlined text-[14px]">inventory_2</span> ${item.quantityAvailable} left
          </div>
          <div class="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm text-error font-label-md text-label-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm font-bold">
            <span class="material-symbols-outlined text-[16px]">timer</span> ${item.expiresInHours || 3}h remaining
          </div>
        </div>
        <div class="p-5 flex flex-col flex-1">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-headline-md text-headline-md text-on-surface leading-tight font-bold">${item.title}</h3>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mb-3">${item.providerName || 'Local Partner'}</p>
          <p class="font-label-sm text-label-sm text-outline mb-4 line-clamp-2">${item.description || ''}</p>

          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span class="material-symbols-outlined text-lg">location_on</span> ${item.location || 'Bengaluru'}
            </div>
            <div class="flex items-center gap-1 text-tertiary-container font-label-sm text-label-sm font-bold">
              <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">eco</span> +30 Points
            </div>
          </div>

          <div class="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
            <div>
              <span class="text-xs line-through text-outline">₹${item.originalPrice || 180}</span>
              <span class="text-lg font-bold text-primary ml-1">₹${item.discountedPrice || 50}</span>
            </div>
            <button onclick="claimFoodItem('${item._id}')" ${item.quantityAvailable <= 0 ? 'disabled' : ''} class="${item.quantityAvailable <= 0 ? 'bg-surface-variant text-outline cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-on-primary shadow-sm'} font-label-md text-label-md px-6 py-2 rounded-lg transition-colors flex items-center gap-2">
              ${item.quantityAvailable <= 0 ? 'Claimed' : 'Claim Item'}
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 bg-surface-container-low rounded-xl">
        <span class="material-symbols-outlined text-5xl text-outline mb-2">compost</span>
        <h3 class="font-headline-md text-on-surface">No surplus items in this category right now.</h3>
        <p class="font-body-md text-on-surface-variant">Check back soon or post leftover food from your kitchen/restaurant.</p>
      </div>
    `;
  }
}

async function claimFoodItem(listingId) {
  const res = await fetchAPI(`/food/claim/${listingId}`, { method: 'POST' });
  if (!res.err) {
    showToast(res.message || 'Food item claimed! +30 Green Points added.');
    await loadFoodListings();
  } else {
    showToast(res.message || 'Failed to claim item', 'error');
  }
}

function openPostFoodModal() {
  let modal = document.getElementById('gs-post-food-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'gs-post-food-modal';
    modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="glass-panel bg-surface rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-white/40">
        <button onclick="document.getElementById('gs-post-food-modal').remove()" class="absolute top-4 right-4 text-on-surface-variant p-1">
          <span class="material-symbols-outlined">close</span>
        </button>
        <h2 class="font-headline-lg text-headline-lg text-primary font-bold mb-2">Post Surplus Food Listing</h2>
        <p class="font-body-md text-on-surface-variant mb-6">List leftover meals or extra produce to help your community and stop food waste (+50 Points).</p>

        <form onsubmit="submitNewFoodListing(event)" class="space-y-4">
          <div>
            <label class="block font-label-md mb-1">Item Title</label>
            <input type="text" id="food-title" required placeholder="e.g. 5 Boxes Fresh Chole Bhature" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant"/>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-label-md mb-1">Provider / Venue Name</label>
              <input type="text" id="food-provider" required placeholder="e.g. Royal Caterers" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant"/>
            </div>
            <div>
              <label class="block font-label-md mb-1">Category</label>
              <select id="food-category" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant">
                <option value="Meals">Meals</option>
                <option value="Produce">Produce</option>
                <option value="Bakery">Bakery</option>
                <option value="Dairy">Dairy</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-label-md mb-1">Rescued Price (₹)</label>
              <input type="number" id="food-price" required value="40" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant"/>
            </div>
            <div>
              <label class="block font-label-md mb-1">Quantity Available</label>
              <input type="number" id="food-qty" required value="5" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant"/>
            </div>
          </div>
          <div>
            <label class="block font-label-md mb-1">Location Address</label>
            <input type="text" id="food-location" required placeholder="Indiranagar, Bengaluru" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant"/>
          </div>
          <button type="submit" class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md font-bold shadow-md hover:bg-primary-container transition-all">
            Publish Food Listing (+50 Points)
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

async function submitNewFoodListing(e) {
  e.preventDefault();
  const title = document.getElementById('food-title').value;
  const providerName = document.getElementById('food-provider').value;
  const category = document.getElementById('food-category').value;
  const discountedPrice = document.getElementById('food-price').value;
  const quantityAvailable = document.getElementById('food-qty').value;
  const location = document.getElementById('food-location').value;

  const res = await fetchAPI('/food/create', {
    method: 'POST',
    body: JSON.stringify({ title, providerName, category, discountedPrice, quantityAvailable, location })
  });

  if (!res.err) {
    showToast(res.message || 'Surplus food item listed! +50 Points earned.');
    document.getElementById('gs-post-food-modal')?.remove();
    await loadFoodListings();
  } else {
    showToast(res.message || 'Failed to list food item.', 'error');
  }
}
