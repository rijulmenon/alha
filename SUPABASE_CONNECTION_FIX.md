# Supabase Connection Fix Guide

## ✅ What I Fixed

1. **Hardcoded Supabase credentials** in `js/supabase-client.js`
   - Your credentials are now directly in the code (safe for client-side use with the anon key)
   - No need to fetch .env file anymore

2. **No merge conflicts found** - Your code is clean!

## 🔧 Setup Steps You Need to Complete

### Step 1: Verify Supabase Project Setup

1. Go to your Supabase dashboard: https://app.supabase.com/project/qmsybuomyrxlhhakiqor

2. Check if your database tables exist:
   - Click on "Table Editor" in the left sidebar
   - You should see these tables:
     - `journal_posts`
     - `journal_categories`
     - `journal_tags`
     - `journal_post_tags`
     - `products`
     - `orders`
     - `order_items`

### Step 2: Run Database Migrations (If Tables Don't Exist)

If the tables don't exist, you need to run the migrations:

#### Option A: Using Supabase SQL Editor (Easiest)

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the content from each migration file in order:
   - First: `supabase/migrations/001_initial_schema.sql`
   - Second: `supabase/migrations/002_row_level_security.sql`
   - Third: `supabase/migrations/003_seed_data.sql`
5. Click "Run" for each query

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref qmsybuomyrxlhhakiqor

# Run migrations
supabase db push
```

### Step 3: Verify Data is Seeded

1. Go to "Table Editor" in Supabase dashboard
2. Click on `journal_posts` table
3. You should see 7 sample blog posts
4. Click on `journal_categories` table
5. You should see 4 categories (Events, Recipes, Stories, Behind the Scenes)

### Step 4: Test Locally

1. Make sure your local server is running:
   ```bash
   python -m http.server 8000
   ```

2. Open http://localhost:8000 in your browser

3. Open browser console (F12) and look for:
   - ✅ "Supabase client initialized successfully"
   - ✅ "Supabase connection test successful"

4. Scroll down to the Journal section - you should see blog posts loading

### Step 5: Check for Errors

If you see errors in the console:

#### Error: "PGRST116" or "relation does not exist"
**Solution:** Tables don't exist. Run the migrations (Step 2)

#### Error: "Invalid API key"
**Solution:** Double-check your credentials in `js/supabase-client.js`

#### Error: "Failed to fetch"
**Solution:** Check your internet connection and Supabase project status

#### Error: "Row Level Security policy violation"
**Solution:** Run migration 002 (RLS policies)

## 🚀 For Vercel Deployment

When deploying to Vercel, add these environment variables:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `SUPABASE_URL` = `https://qmsybuomyrxlhhakiqor.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtc3lidW9teXJ4bGhoYWtpcW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzA2ODEsImV4cCI6MjA5NjUwNjY4MX0.97O9mBIK_ylMHVB0AaT0_dGeUYp97ZtiZBF9_glF0bk`

**Note:** Since we hardcoded the values in `js/supabase-client.js`, Vercel deployment will work without environment variables. However, it's still good practice to set them.

## 🧪 Quick Test Checklist

- [ ] Supabase dashboard accessible
- [ ] Tables exist in database
- [ ] Sample data is seeded
- [ ] Local server running (http://localhost:8000)
- [ ] Browser console shows "Supabase client initialized successfully"
- [ ] Journal section loads blog posts
- [ ] No errors in browser console
- [ ] Category filters work
- [ ] Cards display with images, titles, and excerpts

## 📝 Current Configuration

Your Supabase credentials (already configured):
- **Project URL:** https://qmsybuomyrxlhhakiqor.supabase.co
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (configured in code)
- **Project Ref:** qmsybuomyrxlhhakiqor

## 🆘 Still Having Issues?

1. **Check Supabase project status:**
   - Go to https://status.supabase.com/
   - Make sure all services are operational

2. **Verify your project is active:**
   - Go to https://app.supabase.com/
   - Make sure your project isn't paused

3. **Check browser console:**
   - Press F12 to open developer tools
   - Look at the Console tab for error messages
   - Look at the Network tab to see if API calls are failing

4. **Test Supabase connection directly:**
   - Open browser console on your site
   - Type: `supabaseClient.from('journal_posts').select('*').limit(1)`
   - Press Enter
   - You should see a Promise that resolves with data

## 📞 Need Help?

If you're still having issues, please provide:
1. Screenshot of browser console errors
2. Screenshot of Supabase Table Editor showing your tables
3. Any error messages you're seeing

---
*Last updated: June 15, 2026*