/**
 * Products Service — ALHA
 * Reads/writes the `products` table via Supabase.
 * Waits for supabaseReady before any query.
 */

class ProductsService {

    async _db() {
        await supabaseReady;
        return supabaseClient;
    }

    async getProducts(options = {}) {
        const db = await this._db();
        let query = db.from('products').select('*').order('name');
        if (options.category)          query = query.eq('category', options.category);
        if (options.availableOnly !== false) query = query.eq('is_available', true);
        const { data, error } = await query;
        if (error) { console.error('Error fetching products:', error); return { data: [], error }; }
        return { data: data || [], error: null };
    }

    async getProductById(productId) {
        const db = await this._db();
        const { data, error } = await db.from('products').select('*').eq('id', productId).single();
        if (error) { console.error('Error fetching product:', error); return { data: null, error }; }
        return { data, error: null };
    }

    async getProductsByCategory(category) {
        return this.getProducts({ category, availableOnly: true });
    }

    async searchProducts(searchTerm) {
        const db = await this._db();
        const { data, error } = await db
            .from('products').select('*').eq('is_available', true)
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .order('name').limit(20);
        if (error) { console.error('Error searching products:', error); return { data: [], error }; }
        return { data: data || [], error: null };
    }

    async createProduct(productData) {
        const db = await this._db();
        const { data, error } = await db.from('products').insert([productData]).select().single();
        if (error) { console.error('Error creating product:', error); return { data: null, error }; }
        return { data, error: null };
    }

    async updateProduct(productId, updates) {
        const db = await this._db();
        const { data, error } = await db.from('products').update(updates).eq('id', productId).select().single();
        if (error) { console.error('Error updating product:', error); return { data: null, error }; }
        return { data, error: null };
    }

    async deleteProduct(productId) {
        const db = await this._db();
        const { error } = await db.from('products').delete().eq('id', productId);
        if (error) { console.error('Error deleting product:', error); return { data: null, error }; }
        return { data: { success: true }, error: null };
    }

    async toggleAvailability(productId, isAvailable) {
        return this.updateProduct(productId, { is_available: isAvailable });
    }

    formatPrice(price) {
        if (price === null || price === undefined) return 'Price on request';
        return `AED ${parseFloat(price).toFixed(2)}`;
    }

    hasPrice(product) {
        return product.price !== null && product.price !== undefined;
    }
}

const productsService = new ProductsService();
if (typeof module !== 'undefined' && module.exports) module.exports = { ProductsService, productsService };
