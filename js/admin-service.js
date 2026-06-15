/**
 * ALHA Admin Service — Production
 * Uses supabaseReady promise so every method safely waits for the client.
 */

class AdminService {

    async _db() {
        await supabaseReady;
        return supabaseClient;
    }

    // ─── Auth ──────────────────────────────────────────────────────────────────

    async isAuthenticated() {
        try {
            const db = await this._db();
            const { data: { session } } = await db.auth.getSession();
            if (!session) return false;
            const role = session.user.user_metadata?.role || session.user.user_metadata?.user_role;
            return role === 'admin';
        } catch { return false; }
    }

    async logout() {
        const db = await this._db();
        await db.auth.signOut();
    }

    // ─── Products ──────────────────────────────────────────────────────────────

    async getProductsByCategory(category) {
        try {
            const db = await this._db();
            const { data, error } = await db
                .from('products')
                .select('*')
                .eq('category', category)
                .order('name');
            if (error) { console.error('Error fetching products:', error); return { data: [], error }; }
            return { data: data || [], error: null };
        } catch (e) { return { data: [], error: e.message }; }
    }

    async createProduct(productData) {
        try {
            const db = await this._db();
            const { data, error } = await db.from('products').insert([productData]).select().single();
            if (error) { console.error('Error creating product:', error); return { data: null, error }; }
            return { data, error: null };
        } catch (e) { return { data: null, error: e.message }; }
    }

    async updateProduct(productId, updates) {
        try {
            const db = await this._db();
            const { data, error } = await db.from('products').update(updates).eq('id', productId).select().single();
            if (error) { console.error('Error updating product:', error); return { data: null, error }; }
            return { data, error: null };
        } catch (e) { return { data: null, error: e.message }; }
    }

    async deleteProduct(productId) {
        try {
            const db = await this._db();
            const { error } = await db.from('products').delete().eq('id', productId);
            if (error) { console.error('Error deleting product:', error); return { error }; }
            return { error: null };
        } catch (e) { return { error: e.message }; }
    }

    // ─── Journal ───────────────────────────────────────────────────────────────

    async getAllJournalPosts() {
        try {
            const db = await this._db();
            const { data, error } = await db
                .from('journal_posts')
                .select(`id, title, slug, excerpt, content, featured_image_url,
                         author_name, is_featured, is_published, read_time_minutes,
                         published_at, created_at,
                         journal_categories ( id, name, slug )`)
                .order('created_at', { ascending: false });
            if (error) { console.error('Error fetching journal posts:', error); return { data: [], error }; }
            return { data: data.map(p => ({ ...p, category: p.journal_categories })), error: null };
        } catch (e) { return { data: [], error: e.message }; }
    }

    async createJournalPost(postData) {
        try {
            const db = await this._db();
            if (!postData.slug) {
                postData.slug = postData.title
                    .toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim()
                    + '-' + Date.now();
            }
            if (postData.is_published && !postData.published_at) {
                postData.published_at = new Date().toISOString();
            }
            const { data, error } = await db.from('journal_posts').insert([postData]).select().single();
            if (error) { console.error('Error creating journal post:', error); return { data: null, error }; }
            return { data, error: null };
        } catch (e) { return { data: null, error: e.message }; }
    }

    async updateJournalPost(postId, updates) {
        try {
            const db = await this._db();
            if (updates.is_published && !updates.published_at) {
                updates.published_at = new Date().toISOString();
            }
            const { data, error } = await db.from('journal_posts').update(updates).eq('id', postId).select().single();
            if (error) { console.error('Error updating journal post:', error); return { data: null, error }; }
            return { data, error: null };
        } catch (e) { return { data: null, error: e.message }; }
    }

    async deleteJournalPost(postId) {
        try {
            const db = await this._db();
            const { error } = await db.from('journal_posts').delete().eq('id', postId);
            if (error) { console.error('Error deleting journal post:', error); return { error }; }
            return { error: null };
        } catch (e) { return { error: e.message }; }
    }

    async getJournalCategories() {
        try {
            const db = await this._db();
            const { data, error } = await db.from('journal_categories').select('*').order('name');
            return { data: data || [], error };
        } catch (e) { return { data: [], error: e.message }; }
    }

    // ─── Image Upload (Supabase Storage) ──────────────────────────────────────

    async uploadImage(file, bucket = 'products') {
        try {
            if (!file || file.size === 0) return { data: null, error: 'No file provided' };
            if (!file.type.startsWith('image/')) return { data: null, error: 'File must be an image' };
            if (file.size > 5 * 1024 * 1024) return { data: null, error: 'Max file size is 5 MB' };

            const db = await this._db();
            const ext = file.name.split('.').pop().toLowerCase();
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

            const { error: uploadError } = await db.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                return { data: null, error: uploadError };
            }

            const { data: urlData } = db.storage.from(bucket).getPublicUrl(fileName);
            return { data: { url: urlData.publicUrl, path: fileName }, error: null };

        } catch (e) { return { data: null, error: e.message }; }
    }

    async deleteImage(path, bucket = 'products') {
        try {
            const db = await this._db();
            const { error } = await db.storage.from(bucket).remove([path]);
            return { error };
        } catch (e) { return { error: e.message }; }
    }

    // ─── Utilities ─────────────────────────────────────────────────────────────

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    formatPrice(price) {
        if (price === null || price === undefined) return 'Price on request';
        return `₹${parseFloat(price).toFixed(2)}`;
    }

    validateProductData(pd) {
        const errors = [];
        if (!pd.name?.trim()) errors.push('Name is required');
        if (!['events', 'small'].includes(pd.category)) errors.push('Invalid category');
        if (pd.price != null && (isNaN(pd.price) || pd.price < 0)) errors.push('Price must be a positive number');
        return { isValid: errors.length === 0, errors };
    }

    validateJournalData(pd) {
        const errors = [];
        if (!pd.title?.trim()) errors.push('Title is required');
        if (!pd.content?.trim()) errors.push('Content is required');
        if (pd.read_time_minutes < 1) errors.push('Read time must be at least 1 minute');
        return { isValid: errors.length === 0, errors };
    }
}

const adminService = new AdminService();
if (typeof module !== 'undefined' && module.exports) module.exports = { AdminService, adminService };
