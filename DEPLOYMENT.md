# Deployment Guide

Complete guide for deploying your Rental Inventory & Booking Management System to production.

## 🚀 Quick Start Checklist

- [ ] Supabase project created and configured
- [ ] Database migration executed
- [ ] Admin user created and role assigned
- [ ] Environment variables configured
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] Production environment variables set
- [ ] Deployment successful
- [ ] Post-deployment configuration complete

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name**: `rental-booking-system` (or your choice)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

### 1.2 Run Database Migration

1. In your Supabase project dashboard, navigate to **SQL Editor**
2. Click **New Query**
3. Open `supabase/migrations/001_initial_schema.sql` from your local project
4. Copy the ENTIRE file contents
5. Paste into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify success message appears
8. Navigate to **Table Editor** to confirm tables were created:
   - profiles
   - items
   - bookings
   - booking_items

### 1.3 Get API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** tab
3. Copy these values (you'll need them later):
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - keep this secret!)

### 1.4 Create Admin User

**Option A: Through Supabase Dashboard (Recommended)**

1. Navigate to **Authentication** > **Users** in Supabase dashboard
2. Click **Add user** button
3. Select **Create new user**
4. Enter:
   - **Email**: Your admin email
   - **Password**: A secure password (remember this!)
   - Leave "Auto Confirm User" checked
5. Click **Create user**
6. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```
   Replace `your-admin@email.com` with the email you just used.

**Option B: Through Application (After Deployment)**

1. Deploy the application first (continue with deployment steps)
2. Use Supabase dashboard to create user as above
3. Manually update the role in SQL Editor

## Part 2: Local Development

### 2.1 Configure Environment Variables

Your `.env.local` file is already created. Update it with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Test Locally

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

Open http://localhost:3000 and verify:
- [ ] Home page loads with sample items
- [ ] Catalog page shows all items
- [ ] Login page loads at /login
- [ ] Can log in with admin credentials
- [ ] Admin dashboard loads after login

## Part 3: Production Deployment (Vercel)

### 3.1 Prepare Code for Deployment

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Rental booking system"
   ```

2. **Create GitHub Repository**:
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it `rental-booking-system` (or your choice)
   - **Do NOT** initialize with README (you already have one)
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git branch -M main
   git push -u origin main
   ```

### 3.2 Deploy to Vercel

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in (or create account) with GitHub

2. **Import Project**:
   - Click "Add New..." > "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Add Environment Variables**:
   Click "Environment Variables" and add these:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   NEXT_PUBLIC_APP_URL = (leave blank for now, will update after deployment)
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build and deployment
   - Note your deployment URL (e.g., `https://your-app.vercel.app`)

### 3.3 Post-Deployment Configuration

#### Update Vercel Environment Variables

1. In Vercel project dashboard, go to **Settings** > **Environment Variables**
2. Find `NEXT_PUBLIC_APP_URL`
3. Update value to your deployment URL: `https://your-app.vercel.app`
4. Click "Save"
5. Go to **Deployments** tab
6. Click "..." on latest deployment > "Redeploy"

#### Update Supabase Auth Settings

1. Go to Supabase dashboard
2. Navigate to **Authentication** > **URL Configuration**
3. Set **Site URL** to: `https://your-app.vercel.app`
4. Under **Redirect URLs**, add:
   ```
   https://your-app.vercel.app/**
   http://localhost:3000/**
   ```
5. Click "Save"

## Part 4: Verification

### 4.1 Test Production Deployment

Visit your deployment URL and verify:

**Customer-Facing Features:**
- [ ] Home page loads correctly
- [ ] Catalog shows all inventory items
- [ ] Search and filtering work
- [ ] Booking form is accessible
- [ ] Date selection works
- [ ] Item selection with availability works
- [ ] Booking submission successful
- [ ] Confirmation page displays correctly

**Admin Features:**
- [ ] Can access login page at `/login`
- [ ] Can log in with admin credentials
- [ ] Dashboard loads with statistics
- [ ] Can view all bookings
- [ ] Can filter and search bookings
- [ ] Can view booking details
- [ ] Can view and filter inventory
- [ ] Sign out works correctly

### 4.2 Check Database

In Supabase dashboard:
1. Go to **Table Editor** > **bookings**
2. Verify test bookings appear
3. Check booking_items junction table
4. Verify RLS policies are active

## Part 5: Custom Domain (Optional)

### 5.1 Add Custom Domain in Vercel

1. In Vercel project dashboard, go to **Settings** > **Domains**
2. Click "Add"
3. Enter your domain (e.g., `rentals.yourbusiness.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

### 5.2 Update Configuration

After domain is active:

1. **Update Vercel Environment Variables**:
   - Change `NEXT_PUBLIC_APP_URL` to your custom domain
   - Redeploy

2. **Update Supabase**:
   - Add custom domain to Redirect URLs
   - Update Site URL if it's your primary domain

## 🔒 Security Checklist

Before going live:

- [ ] All environment variables use production values
- [ ] No sensitive data in git repository
- [ ] `.env.local` is in `.gitignore`
- [ ] Supabase RLS policies are enabled
- [ ] Admin role verification is working
- [ ] HTTPS is enforced
- [ ] Authentication redirects work correctly
- [ ] Service role key is kept secret (not in frontend code)

## 📊 Monitoring

### Vercel

- View deployment logs in Vercel dashboard
- Check **Analytics** for visitor metrics
- Monitor **Speed Insights** for performance

### Supabase

- Check **Database** > **Logs** for SQL errors
- Monitor **Auth** > **Logs** for authentication issues
- Use **API** > **Logs** for API errors

## 🐛 Common Issues

### Build Fails

**Error: Missing environment variables**
- Solution: Ensure all required env vars are set in Vercel

**Error: Module not found**
- Solution: Run `npm install` locally and commit `package-lock.json`

### Authentication Issues

**Can't log in as admin**
- Verify admin role in Supabase: `SELECT * FROM profiles;`
- Check redirect URLs in Supabase Auth settings

**Infinite redirect loop**
- Ensure middleware is correctly configured
- Check `NEXT_PUBLIC_APP_URL` matches deployment URL

### Database Errors

**RLS policy errors**
- Verify policies were created during migration
- Check Supabase logs for specific errors

**Items not showing**
- Verify sample data was inserted
- Check items table in Supabase Table Editor

## 🔄 Updating Your Deployment

### For Code Changes

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel will automatically rebuild and deploy.

### For Database Changes

1. Create new migration file: `002_your_changes.sql`
2. Run in Supabase SQL Editor
3. Update TypeScript types if needed
4. Test locally
5. Commit and push

### For Environment Variables

1. Update in Vercel dashboard
2. Redeploy from Deployments tab

## 📈 Next Steps

After successful deployment:

1. **Test thoroughly** with real booking scenarios
2. **Train staff** on admin interface
3. **Add custom branding** (logo, colors, content)
4. **Configure email notifications** (optional)
5. **Set up analytics** (Google Analytics, etc.)
6. **Add payment processing** if needed (Stripe, etc.)
7. **Create backup strategy** for database
8. **Document operational procedures** for staff

## 📞 Support Resources

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)

## ✅ Deployment Complete!

Your rental booking system is now live and ready to accept bookings! 🎉

---

**Questions or Issues?**
Review the troubleshooting section or check the logs in Vercel and Supabase dashboards.
