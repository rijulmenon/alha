/**
 * ALHA Admin Portal — Main JS
 * Sections: Menu (all products), Recipes (journal)
 */

const MENU_TAGS = [
    'Event Specials',
    'Chocolate Desserts',
    'Cookies',
    'Cakes & Cheesecakes',
    'Puddings & Trifles',
    'Indian Desserts',
    'Dubai Desserts',
    'Italian Courses'
];

let currentSection = 'menu';
let currentEditingItem = null;
let currentUser = null;

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await supabaseReady;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && isAdminUser(session.user)) {
        currentUser = session.user;
        showDashboard();
        loadCurrentSection();
    } else {
        showLogin();
    }

    setupLoginForm();
    setupNavigation();
    setupLogout();
    setupModal();
    setupSectionButtons();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            if (isAdminUser(session.user)) {
                currentUser = session.user;
                showDashboard();
                loadCurrentSection();
            } else {
                showNotification('Unauthorized: admin access required', 'error');
                await supabaseClient.auth.signOut();
                showLogin();
            }
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showLogin();
        }
    });
});

function isAdminUser(user) {
    if (!user) return false;
    const role = user.user_metadata?.role || user.user_metadata?.user_role;
    return role === 'admin';
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Signing in…';
        submitBtn.disabled = true;
        errorEl.style.display = 'none';

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw new Error('Invalid email or password');
            if (!isAdminUser(data.user)) {
                await supabaseClient.auth.signOut();
                throw new Error('Unauthorized: admin access required');
            }
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.style.display = 'block';
        } finally {
            submitBtn.textContent = 'Login';
            submitBtn.disabled = false;
        }
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (confirm('Logout?')) await supabaseClient.auth.signOut();
    });
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    if (currentUser) {
        const badge = document.getElementById('adminBadgeEmail');
        if (badge) badge.textContent = currentUser.email || 'Admin';
    }
}

// ─── Navigation ──────────────────────────────────────────────────────────────

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchSection(item.dataset.section));
    });
}

function switchSection(section) {
    currentSection = section;
    document.querySelectorAll('.nav-item').forEach(i =>
        i.classList.toggle('active', i.dataset.section === section)
    );
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const map = { menu: 'menuSection', journal: 'journalSection' };
    document.getElementById(map[section])?.classList.add('active');
    loadCurrentSection();
}

function loadCurrentSection() {
    if (currentSection === 'menu') loadMenu();
    else loadJournal();
}

// ─── Menu Products ────────────────────────────────────────────────────────────

async function loadMenu() {
    const grid = document.getElementById('menuGrid');
    grid.innerHTML = '<div class="loading-spinner">Loading…</div>';

    // Fetch all products from both categories
    const [evRes, smRes] = await Promise.all([
        adminService.getProductsByCategory('events'),
        adminService.getProductsByCategory('small')
    ]);

    const all = [...(evRes.data || []), ...(smRes.data || [])];
    if (evRes.error && smRes.error) {
        grid.innerHTML = `<div class="empty-state"><p>Error loading products.</p></div>`;
        return;
    }
    grid.innerHTML = all.length
        ? all.map(p => productCard(p)).join('')
        : emptyState('menu');
}

function formatSizePrices(p) {
    const sizes = [
        { label: 'S', price: p.price_small,  pieces: p.pieces_small  },
        { label: 'M', price: p.price_medium, pieces: p.pieces_medium },
        { label: 'L', price: p.price_large,  pieces: p.pieces_large  }
    ].filter(s => s.price !== null && s.price !== undefined);

    if (!sizes.length) return adminService.formatPrice(p.price);

    return sizes.map(s =>
        `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">
            <span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;opacity:.6;">${s.label}</span>
            <span>AED ${parseFloat(s.price).toFixed(2)}</span>
            ${s.pieces ? `<span style="font-size:10px;opacity:.55;">(${s.pieces} pcs)</span>` : ''}
        </span>`
    ).join('');
}

function productCard(p) {
    const img  = p.image_url || '';
    const tags = Array.isArray(p.menu_tags) && p.menu_tags.length
        ? p.menu_tags.map(t =>
            `<span class="item-tag">${t}</span>`
          ).join('')
        : '';

    return `
        <div class="item-card" data-id="${p.id}">
            ${img
                ? `<img src="${img}" alt="${p.name}" class="item-image" onerror="this.style.display='none'">`
                : '<div class="item-image-placeholder">No image</div>'}
            <div class="item-content">
                <h3 class="item-title">${p.name}</h3>
                <div class="item-price">${formatSizePrices(p)}</div>
                ${tags ? `<div class="item-meta">${tags}</div>` : ''}
                ${p.description ? `<p class="item-description">${p.description}</p>` : ''}
                <div class="item-meta">
                    <span class="item-tag">${p.is_available ? '✓ Available' : '✗ Unavailable'}</span>
                    <span class="item-tag">${p.category === 'events' ? 'Events' : 'Single'}</span>
                    <span class="item-tag">${adminService.formatDate(p.created_at)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary btn-small" onclick="editProduct('${p.id}','${p.category}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="deleteProduct('${p.id}','${p.category}')">Delete</button>
                </div>
            </div>
        </div>`;
}

function emptyState(type) {
    const map = {
        menu:    ['No items yet',        'Add Item'],
        journal: ['No recipes yet',      'Add Recipe']
    };
    const [title, action] = map[type] || ['Nothing here', 'Add'];
    return `<div class="empty-state"><h3>${title}</h3><p>Click "${action}" to get started.</p></div>`;
}

// ─── Journal ─────────────────────────────────────────────────────────────────

async function loadJournal() {
    const grid = document.getElementById('journalGrid');
    grid.innerHTML = '<div class="loading-spinner">Loading…</div>';
    const { data, error } = await adminService.getAllJournalPosts();
    if (error) { grid.innerHTML = `<div class="empty-state"><p>Error: ${error}</p></div>`; return; }
    grid.innerHTML = data.length ? data.map(journalCard).join('') : emptyState('journal');
}

function journalCard(post) {
    const img = post.featured_image_url || '';
    return `
        <div class="item-card" data-id="${post.id}">
            ${img
                ? `<img src="${img}" alt="${post.title}" class="item-image" onerror="this.style.display='none'">`
                : '<div class="item-image-placeholder">No image</div>'}
            <div class="item-content">
                <h3 class="item-title">${post.title}</h3>
                <div class="item-meta">
                    <span class="item-tag">Recipe</span>
                    <span class="item-tag">${post.read_time_minutes} min read</span>
                    <span class="item-tag">${post.is_published ? '✓ Published' : '✗ Draft'}</span>
                </div>
                ${post.excerpt ? `<p class="item-description">${post.excerpt}</p>` : ''}
                <div class="item-meta">
                    <span class="item-tag">${adminService.formatDate(post.published_at || post.created_at)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary btn-small" onclick="editJournal('${post.id}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="deleteJournal('${post.id}')">Delete</button>
                </div>
            </div>
        </div>`;
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function setupModal() {
    const modal = document.getElementById('modal');
    document.getElementById('modalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
}

function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentEditingItem = null;
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

function setupSectionButtons() {
    document.getElementById('addMenuItemBtn').addEventListener('click', () => showProductForm('small'));
    document.getElementById('addJournalBtn').addEventListener('click', () => showJournalForm());
}

// ─── Product Form ─────────────────────────────────────────────────────────────

function buildTagCheckboxes(currentTags) {
    const active = Array.isArray(currentTags) ? currentTags : [];
    return MENU_TAGS.map(tag => {
        const checked  = active.includes(tag);
        const safeTag  = tag.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        return `
        <label class="tag-checkbox-item${checked ? ' checked' : ''}" onclick="toggleTagItem(this)">
            <input type="checkbox" name="menu_tags" value="${safeTag}" ${checked ? 'checked' : ''}>
            ${safeTag}
        </label>`;
    }).join('');
}

// Toggling the visual .checked class on the label
window.toggleTagItem = function(label) {
    // The click on the label naturally toggles the checkbox;
    // we just sync the visual class after a tick.
    setTimeout(() => {
        label.classList.toggle('checked', label.querySelector('input').checked);
    }, 0);
};

function showProductForm(category, product = null) {
    const isEdit = !!product;
    openModal(isEdit ? 'Edit Item' : 'Add Menu Item', `
        <form id="productForm" onsubmit="handleProductSubmit(event,'${category}',${isEdit})">
            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="productName" name="name" value="${product?.name || ''}" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select name="category" id="productCategory">
                    <option value="small"  ${(product?.category ?? category) === 'small'  ? 'selected' : ''}>Single Orders</option>
                    <option value="events" ${(product?.category ?? category) === 'events' ? 'selected' : ''}>Events (Bulk)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Pricing by Size <small>— leave blank if not offered at that size</small></label>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:6px;">
                    <div>
                        <label style="font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;display:block;">Small (AED)</label>
                        <input type="number" name="price_small"  step="0.01" min="0" placeholder="e.g. 35" value="${product?.price_small  ?? ''}">
                        <label style="font-size:9px;letter-spacing:1px;text-transform:uppercase;margin:6px 0 3px;display:block;opacity:.65;">Pieces</label>
                        <input type="number" name="pieces_small" step="1"    min="1" placeholder="e.g. 6"  value="${product?.pieces_small ?? ''}">
                    </div>
                    <div>
                        <label style="font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;display:block;">Medium (AED)</label>
                        <input type="number" name="price_medium"  step="0.01" min="0" placeholder="e.g. 55" value="${product?.price_medium  ?? ''}">
                        <label style="font-size:9px;letter-spacing:1px;text-transform:uppercase;margin:6px 0 3px;display:block;opacity:.65;">Pieces</label>
                        <input type="number" name="pieces_medium" step="1"    min="1" placeholder="e.g. 12" value="${product?.pieces_medium ?? ''}">
                    </div>
                    <div>
                        <label style="font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;display:block;">Large (AED)</label>
                        <input type="number" name="price_large"  step="0.01" min="0" placeholder="e.g. 80" value="${product?.price_large  ?? ''}">
                        <label style="font-size:9px;letter-spacing:1px;text-transform:uppercase;margin:6px 0 3px;display:block;opacity:.65;">Pieces</label>
                        <input type="number" name="pieces_large" step="1"    min="1" placeholder="e.g. 24" value="${product?.pieces_large ?? ''}">
                    </div>
                </div>
                <p style="font-size:11px;color:var(--text-lt);margin-top:6px;font-style:italic;">Leave all blank for "Price on request". Pieces optional.</p>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3">${product?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Image</label>
                <div class="file-input-wrapper">
                    <input type="file" name="image" accept="image/*" onchange="previewImage(event,'productImagePreview')">
                    <div class="file-input-label">⬆ Choose image</div>
                </div>
                <div id="productImagePreview" class="file-preview" style="display:${product?.image_url ? 'block' : 'none'}">
                    ${product?.image_url ? `<img src="${product.image_url}" alt="Current image">` : ''}
                </div>
            </div>
            <div class="form-group">
                <label>Menu Tags <small>— select all that apply; item appears in each chosen filter</small></label>
                <div class="tag-checkbox-grid">
                    ${buildTagCheckboxes(product?.menu_tags)}
                </div>
            </div>
            <div class="form-group">
                <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;">
                    <input type="checkbox" name="is_available" ${product?.is_available !== false ? 'checked' : ''}
                        style="width:14px;height:14px;accent-color:var(--primary);padding:0;border:none;background:none;flex-shrink:0;">
                    Available on menu
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>`);
}

async function handleProductSubmit(event, category, isEdit) {
    event.preventDefault();
    const fd = new FormData(event.target);

    // Read category from the select (may have changed in the form)
    const cat = fd.get('category') || category;

    // Collect all checked menu_tags
    const checkedTags = fd.getAll('menu_tags').filter(Boolean);

    const productData = {
        name:          fd.get('name'),
        description:   fd.get('description') || null,
        category:      cat,
        price_small:   fd.get('price_small')   ? parseFloat(fd.get('price_small'))   : null,
        price_medium:  fd.get('price_medium')  ? parseFloat(fd.get('price_medium'))  : null,
        price_large:   fd.get('price_large')   ? parseFloat(fd.get('price_large'))   : null,
        pieces_small:  fd.get('pieces_small')  ? parseInt(fd.get('pieces_small'))    : null,
        pieces_medium: fd.get('pieces_medium') ? parseInt(fd.get('pieces_medium'))   : null,
        pieces_large:  fd.get('pieces_large')  ? parseInt(fd.get('pieces_large'))    : null,
        menu_tags:     checkedTags.length ? checkedTags : null,
        // legacy price: smallest defined size for backward compat
        price: (fd.get('price_small') || fd.get('price_medium') || fd.get('price_large'))
            ? parseFloat(fd.get('price_small') || fd.get('price_medium') || fd.get('price_large'))
            : null,
        is_available: fd.get('is_available') === 'on'
    };

    const v = adminService.validateProductData(productData);
    if (!v.isValid) { showNotification(v.errors.join(', '), 'error'); return; }

    const imageFile = fd.get('image');
    if (imageFile && imageFile.size > 0) {
        const { data: imgData, error: imgErr } = await adminService.uploadImage(imageFile, 'products');
        if (imgErr) { showNotification(`Image upload failed: ${imgErr.message || imgErr}`, 'error'); return; }
        productData.image_url = imgData.url;
    } else if (currentEditingItem?.image_url) {
        productData.image_url = currentEditingItem.image_url;
    }

    const result = isEdit && currentEditingItem
        ? await adminService.updateProduct(currentEditingItem.id, productData)
        : await adminService.createProduct(productData);

    if (result.error) { showNotification(`Error: ${result.error.message || result.error}`, 'error'); return; }
    showNotification(`Item ${isEdit ? 'updated' : 'created'}!`, 'success');
    closeModal();
    loadCurrentSection();
}

async function editProduct(productId, category) {
    const { data, error } = await productsService.getProductById(productId);
    if (error || !data) { showNotification('Error loading item', 'error'); return; }
    currentEditingItem = data;
    showProductForm(category, data);
}

async function deleteProduct(productId) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    const { error } = await adminService.deleteProduct(productId);
    if (error) { showNotification(`Error: ${error.message || error}`, 'error'); return; }
    showNotification('Deleted!', 'success');
    loadCurrentSection();
}

// ─── Journal Form ─────────────────────────────────────────────────────────────

async function showJournalForm(post = null) {
    const isEdit = !!post;
    openModal(isEdit ? 'Edit Recipe' : 'Add Recipe', `
        <form id="journalForm" onsubmit="handleJournalSubmit(event,${isEdit})">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" name="title" value="${post?.title || ''}" required>
            </div>
            <div class="form-group">
                <label>Excerpt</label>
                <textarea name="excerpt" rows="2">${post?.excerpt || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Content *</label>
                <textarea name="content" rows="7" required>${post?.content || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Reading Time (minutes)</label>
                <input type="number" name="read_time_minutes" min="1" value="${post?.read_time_minutes || 5}" required>
            </div>
            <div class="form-group">
                <label>Published Date</label>
                <input type="date" name="published_at" value="${post?.published_at ? post.published_at.split('T')[0] : new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Featured Image</label>
                <div class="file-input-wrapper">
                    <input type="file" name="image" accept="image/*" onchange="previewImage(event,'journalImagePreview')">
                    <div class="file-input-label">⬆ Choose image</div>
                </div>
                <div id="journalImagePreview" class="file-preview" style="display:${post?.featured_image_url ? 'block' : 'none'}">
                    ${post?.featured_image_url ? `<img src="${post.featured_image_url}" alt="Current image">` : ''}
                </div>
            </div>
            <div class="form-group">
                <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;">
                    <input type="checkbox" name="is_published" ${post?.is_published !== false ? 'checked' : ''}
                        style="width:14px;height:14px;accent-color:var(--primary);padding:0;border:none;background:none;flex-shrink:0;">
                    Publish immediately
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>`);
}

async function handleJournalSubmit(event, isEdit) {
    event.preventDefault();
    const fd = new FormData(event.target);
    const postData = {
        title:              fd.get('title'),
        excerpt:            fd.get('excerpt') || null,
        content:            fd.get('content'),
        read_time_minutes:  parseInt(fd.get('read_time_minutes')),
        is_published:       fd.get('is_published') === 'on',
        published_at:       fd.get('published_at') ? new Date(fd.get('published_at')).toISOString() : null
    };

    const v = adminService.validateJournalData(postData);
    if (!v.isValid) { showNotification(v.errors.join(', '), 'error'); return; }

    const imageFile = fd.get('image');
    if (imageFile && imageFile.size > 0) {
        const { data: imgData, error: imgErr } = await adminService.uploadImage(imageFile, 'journal');
        if (imgErr) { showNotification(`Image upload failed: ${imgErr.message || imgErr}`, 'error'); return; }
        postData.featured_image_url = imgData.url;
    } else if (currentEditingItem?.featured_image_url) {
        postData.featured_image_url = currentEditingItem.featured_image_url;
    }

    const result = isEdit && currentEditingItem
        ? await adminService.updateJournalPost(currentEditingItem.id, postData)
        : await adminService.createJournalPost(postData);

    if (result.error) { showNotification(`Error: ${result.error.message || result.error}`, 'error'); return; }
    showNotification(`Recipe ${isEdit ? 'updated' : 'created'}!`, 'success');
    closeModal();
    loadCurrentSection();
}

async function editJournal(postId) {
    const { data: posts } = await adminService.getAllJournalPosts();
    const post = posts?.find(p => p.id === postId);
    if (!post) { showNotification('Error loading entry', 'error'); return; }
    currentEditingItem = post;
    await showJournalForm(post);
}

async function deleteJournal(postId) {
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    const { error } = await adminService.deleteJournalPost(postId);
    if (error) { showNotification(`Error: ${error.message || error}`, 'error'); return; }
    showNotification('Deleted!', 'success');
    loadCurrentSection();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function previewImage(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;
    const preview = document.getElementById(previewId);
    const reader  = new FileReader();
    reader.onload = e => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function showNotification(message, type = 'success') {
    const el = document.getElementById('notification');
    document.getElementById('notificationMessage').textContent = message;
    el.className = `notification ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}
