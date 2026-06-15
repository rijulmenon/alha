/**
 * ALHA Admin Portal - Main JavaScript (Production)
 * Uses Supabase Auth for secure login
 */

let currentSection = 'events';
let currentEditingItem = null;
let currentUser = null;

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await supabaseReady; // wait for supabase-client.js async init

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
        const email = document.getElementById('adminEmail').value.trim();
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
    // Show which user is logged in
    if (currentUser) {
        const badge = document.querySelector('.admin-badge');
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
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.section === section));
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const map = { events: 'eventsSection', 'small-quantity': 'smallQuantitySection', journal: 'journalSection' };
    document.getElementById(map[section]).classList.add('active');
    loadCurrentSection();
}

function loadCurrentSection() {
    if (currentSection === 'events') loadEvents();
    else if (currentSection === 'small-quantity') loadSmallQuantity();
    else loadJournal();
}

// ─── Products ────────────────────────────────────────────────────────────────

async function loadEvents() {
    const grid = document.getElementById('eventsGrid');
    grid.innerHTML = '<div class="loading-spinner">Loading events…</div>';
    const { data, error } = await adminService.getProductsByCategory('events');
    if (error) { grid.innerHTML = `<div class="empty-state"><p>Error: ${error}</p></div>`; return; }
    grid.innerHTML = data.length ? data.map(p => productCard(p, 'events')).join('') : emptyState('events');
}

async function loadSmallQuantity() {
    const grid = document.getElementById('smallQuantityGrid');
    grid.innerHTML = '<div class="loading-spinner">Loading products…</div>';
    const { data, error } = await adminService.getProductsByCategory('small');
    if (error) { grid.innerHTML = `<div class="empty-state"><p>Error: ${error}</p></div>`; return; }
    grid.innerHTML = data.length ? data.map(p => productCard(p, 'small')).join('') : emptyState('small');
}

function productCard(p, cat) {
    const img = p.image_url || '';
    return `
        <div class="item-card" data-id="${p.id}">
            ${img ? `<img src="${img}" alt="${p.name}" class="item-image" onerror="this.style.display='none'">` : '<div class="item-image-placeholder">No image</div>'}
            <div class="item-content">
                <h3 class="item-title">${p.name}</h3>
                <div class="item-price">${adminService.formatPrice(p.price)}</div>
                ${p.description ? `<p class="item-description">${p.description}</p>` : ''}
                <div class="item-meta">
                    <span class="item-tag">${p.is_available ? '✓ Available' : '✗ Unavailable'}</span>
                    <span class="item-tag">${adminService.formatDate(p.created_at)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary btn-small" onclick="editProduct('${p.id}','${cat}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="deleteProduct('${p.id}','${cat}')">Delete</button>
                </div>
            </div>
        </div>`;
}

function emptyState(type) {
    const labels = { events: ['No Events Yet', 'Add Event'], small: ['No Products Yet', 'Add Product'], journal: ['No Entries Yet', 'Add Entry'] };
    const [title, action] = labels[type] || ['Nothing here', 'Add'];
    return `<div class="empty-state"><h3>${title}</h3><p>Click "${action}" to get started.</p></div>`;
}

// ─── Journal ─────────────────────────────────────────────────────────────────

async function loadJournal() {
    const grid = document.getElementById('journalGrid');
    grid.innerHTML = '<div class="loading-spinner">Loading journal entries…</div>';
    const { data, error } = await adminService.getAllJournalPosts();
    if (error) { grid.innerHTML = `<div class="empty-state"><p>Error: ${error}</p></div>`; return; }
    grid.innerHTML = data.length ? data.map(journalCard).join('') : emptyState('journal');
}

function journalCard(post) {
    const img = post.featured_image_url || '';
    const cat = post.category?.name || 'Uncategorized';
    return `
        <div class="item-card" data-id="${post.id}">
            ${img ? `<img src="${img}" alt="${post.title}" class="item-image" onerror="this.style.display='none'">` : '<div class="item-image-placeholder">No image</div>'}
            <div class="item-content">
                <h3 class="item-title">${post.title}</h3>
                <div class="item-meta">
                    <span class="item-tag">${cat}</span>
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
    document.getElementById('addEventBtn').addEventListener('click', () => showProductForm('events'));
    document.getElementById('addSmallQuantityBtn').addEventListener('click', () => showProductForm('small'));
    document.getElementById('addJournalBtn').addEventListener('click', () => showJournalForm());
}

// ─── Product Form ─────────────────────────────────────────────────────────────

function showProductForm(category, product = null) {
    const isEdit = !!product;
    const label = category === 'events' ? 'Event' : 'Product';
    openModal(isEdit ? `Edit ${label}` : `Add ${label}`, `
        <form id="productForm" onsubmit="handleProductSubmit(event,'${category}',${isEdit})">
            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="productName" name="name" value="${product?.name || ''}" required>
            </div>
            <div class="form-group">
                <label>Price (₹) <small>— leave blank for "Price on request"</small></label>
                <input type="number" id="productPrice" name="price" step="0.01" min="0" value="${product?.price ?? ''}">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="productDescription" name="description" rows="3">${product?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Image</label>
                <div class="file-input-wrapper">
                    <input type="file" id="productImage" name="image" accept="image/*" onchange="previewImage(event,'productImagePreview')">
                    <div class="file-input-label">⬆ Choose image</div>
                </div>
                <div id="productImagePreview" class="file-preview" style="display:${product?.image_url ? 'block' : 'none'}">
                    ${product?.image_url ? `<img src="${product.image_url}" alt="Current image">` : ''}
                </div>
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="productAvailable" name="is_available" ${product?.is_available !== false ? 'checked' : ''}> Available</label>
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
    const productData = {
        name: fd.get('name'),
        description: fd.get('description') || null,
        category,
        price: fd.get('price') ? parseFloat(fd.get('price')) : null,
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
    showNotification(`${category === 'events' ? 'Event' : 'Product'} ${isEdit ? 'updated' : 'created'}!`, 'success');
    closeModal();
    loadCurrentSection();
}

async function editProduct(productId, category) {
    const { data, error } = await productsService.getProductById(productId);
    if (error || !data) { showNotification('Error loading item', 'error'); return; }
    currentEditingItem = data;
    showProductForm(category, data);
}

async function deleteProduct(productId, category) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    const { error } = await adminService.deleteProduct(productId);
    if (error) { showNotification(`Error: ${error.message || error}`, 'error'); return; }
    showNotification('Deleted!', 'success');
    loadCurrentSection();
}

// ─── Journal Form ─────────────────────────────────────────────────────────────

async function showJournalForm(post = null) {
    const isEdit = !!post;

    // Load categories for dropdown
    const { data: cats } = await adminService.getJournalCategories();
    const catOptions = (cats || []).map(c =>
        `<option value="${c.id}" ${post?.journal_categories?.id === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    openModal(isEdit ? 'Edit Journal Entry' : 'Add Journal Entry', `
        <form id="journalForm" onsubmit="handleJournalSubmit(event,${isEdit})">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="journalTitle" name="title" value="${post?.title || ''}" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="journalCategory" name="category_id">
                    <option value="">— No category —</option>
                    ${catOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Excerpt</label>
                <textarea id="journalExcerpt" name="excerpt" rows="2">${post?.excerpt || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Content *</label>
                <textarea id="journalContent" name="content" rows="7" required>${post?.content || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Reading Time (minutes)</label>
                <input type="number" id="journalReadTime" name="read_time_minutes" min="1" value="${post?.read_time_minutes || 5}" required>
            </div>
            <div class="form-group">
                <label>Published Date</label>
                <input type="date" id="journalDate" name="published_at" value="${post?.published_at ? post.published_at.split('T')[0] : new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Featured Image</label>
                <div class="file-input-wrapper">
                    <input type="file" id="journalImage" name="image" accept="image/*" onchange="previewImage(event,'journalImagePreview')">
                    <div class="file-input-label">⬆ Choose image</div>
                </div>
                <div id="journalImagePreview" class="file-preview" style="display:${post?.featured_image_url ? 'block' : 'none'}">
                    ${post?.featured_image_url ? `<img src="${post.featured_image_url}" alt="Current image">` : ''}
                </div>
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="journalPublished" name="is_published" ${post?.is_published !== false ? 'checked' : ''}> Publish immediately</label>
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
        title: fd.get('title'),
        excerpt: fd.get('excerpt') || null,
        content: fd.get('content'),
        read_time_minutes: parseInt(fd.get('read_time_minutes')),
        is_published: fd.get('is_published') === 'on',
        published_at: fd.get('published_at') ? new Date(fd.get('published_at')).toISOString() : null,
        category_id: fd.get('category_id') || null
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
    showNotification(`Entry ${isEdit ? 'updated' : 'created'}!`, 'success');
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
    if (!confirm('Delete this journal entry? This cannot be undone.')) return;
    const { error } = await adminService.deleteJournalPost(postId);
    if (error) { showNotification(`Error: ${error.message || error}`, 'error'); return; }
    showNotification('Entry deleted!', 'success');
    loadCurrentSection();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function previewImage(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;
    const preview = document.getElementById(previewId);
    const reader = new FileReader();
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
