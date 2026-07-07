/**
 * Journal/Recipe Service — ALHA
 * All posts are recipes. No categories.
 * Queries: journal_posts only.
 */

class JournalService {
    constructor() {
        this.postsPerPage = 6;
    }

    async getPosts(options = {}) {
        await supabaseReady;
        let query = supabaseClient
            .from('journal_posts')
            .select(`id, title, slug, excerpt, content, featured_image_url,
                     author_name, is_featured, read_time_minutes, published_at, created_at`)
            .eq('is_published', true)
            .order('published_at', { ascending: false });

        if (options.featured) query = query.eq('is_featured', true);
        if (options.limit)    query = query.limit(options.limit);
        if (options.offset)   query = query.range(options.offset, options.offset + (options.limit || this.postsPerPage) - 1);

        const { data, error } = await query;
        if (error) { console.error('getPosts error:', error); return { data: [], error }; }
        return { data: data || [], error: null };
    }

    async getPostBySlug(slug) {
        await supabaseReady;
        const { data, error } = await supabaseClient
            .from('journal_posts')
            .select(`id, title, slug, excerpt, content, featured_image_url,
                     author_name, is_featured, read_time_minutes, published_at, created_at, updated_at`)
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (error) { console.error('getPostBySlug error:', error); return { data: null, error }; }
        return { data, error: null };
    }

    async searchPosts(searchTerm) {
        await supabaseReady;
        const { data, error } = await supabaseClient
            .from('journal_posts')
            .select(`id, title, slug, excerpt, featured_image_url, author_name, read_time_minutes, published_at`)
            .eq('is_published', true)
            .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`)
            .order('published_at', { ascending: false })
            .limit(20);

        if (error) { console.error('searchPosts error:', error); return { data: [], error }; }
        return { data: data || [], error: null };
    }

    // ── Admin ──────────────────────────────────────────────

    async createPost(postData) {
        await supabaseReady;
        if (!postData.slug) postData.slug = this.generateSlug(postData.title);
        if (postData.is_published && !postData.published_at) postData.published_at = new Date().toISOString();
        const { data, error } = await supabaseClient.from('journal_posts').insert([postData]).select().single();
        if (error) { console.error('createPost error:', error); return { data: null, error }; }
        return { data, error: null };
    }

    async updatePost(postId, updates) {
        await supabaseReady;
        if (updates.is_published && !updates.published_at) updates.published_at = new Date().toISOString();
        const { data, error } = await supabaseClient.from('journal_posts').update(updates).eq('id', postId).select().single();
        if (error) { console.error('updatePost error:', error); return { data: null, error }; }
        return { data, error: null };
    }

    async deletePost(postId) {
        await supabaseReady;
        const { error } = await supabaseClient.from('journal_posts').delete().eq('id', postId);
        if (error) { console.error('deletePost error:', error); return { data: null, error }; }
        return { data: { success: true }, error: null };
    }

    // ── Utilities ──────────────────────────────────────────

    generateSlug(title) {
        return title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

const journalService = new JournalService();
if (typeof module !== 'undefined' && module.exports) module.exports = { JournalService, journalService };
