# Quick Start Guide

Get your rental booking system up and running in under 15 minutes!

## ⚡ Prerequisites
- Node.js 18+ installed
- A Supabase account (sign up free at supabase.com)

## 🚀 5-Step Setup

### Step 1: Create Supabase Project (3 minutes)
1. Go to [supabase.com](https://supabase.com)
2. Sign in and click "New Project"
3. Fill in project details and create
4. Wait for project to be ready

### Step 2: Run Database Migration (2 minutes)
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**
5. Verify tables created in **Table Editor**

### Step 3: Configure Environment (2 minutes)
1. In Supabase, go to **Settings** > **API**
2. Copy your **Project URL** and **anon key**
3. Open `.env.local` in your project
4. Paste your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Step 4: Install & Run (5 minutes)
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5: Create Admin User (3 minutes)
1. In Supabase, go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter email and password
4. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```
5. Log in at [http://localhost:3000/login](http://localhost:3000/login)

## ✅ You're Done!

You now have a fully functional rental booking system running locally!

### Test It Out:
- **Browse catalog**: [localhost:3000/catalog](http://localhost:3000/catalog)
- **Create booking**: [localhost:3000/booking](http://localhost:3000/booking)
- **Admin login**: [localhost:3000/login](http://localhost:3000/login)
- **Admin dashboard**: [localhost:3000/admin](http://localhost:3000/admin)

## 📚 What's Included

Your system has 8 sample rental items already loaded:
- Folding Chairs (200 available)
- Banquet Tables (30 available)
- Round Tables (20 available)
- Table Cloths (100 available)
- Tents (5 available)
- Audio Equipment (3 available)
- Podiums (2 available)
- Dance Floors (2 available)

## 🎨 Customize Your Site

### Change Business Name & Contact
Edit `app/page.tsx` around line 30-50 to update:
- Business name
- Phone number
- Email address

### Change Colors
Edit `app/globals.css` to customize the color scheme.

## 🚀 Deploy to Production

When ready to go live, follow the detailed steps in [DEPLOYMENT.md](DEPLOYMENT.md).

Quick version:
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## 🆘 Common Issues

**Items not showing?**
- Make sure database migration ran successfully
- Check Supabase Table Editor for `items` table

**Can't log in?**
- Verify admin role was set in profiles table
- Check email and password are correct

**Environment variable errors?**
- Make sure `.env.local` has all three variables
- Restart dev server after changes

## 📖 Full Documentation

- [README.md](README.md) - Complete project documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - What was built

## 🎯 Next Steps

1. ✅ Get it running (you're here!)
2. Customize branding and content
3. Test booking flow end-to-end
4. Add your real inventory items
5. Deploy to production
6. Train your team
7. Start accepting bookings!

---

**Need Help?** Check the troubleshooting section in [README.md](README.md) or [DEPLOYMENT.md](DEPLOYMENT.md).

**Happy booking!** 🎉
