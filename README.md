# Rental Inventory and Booking Management System

A full-stack web application for managing rental inventory and bookings, built with Next.js 15, Supabase, and shadcn/ui.

## 🚀 Features

### Customer Features
- **Home Page**: Professional landing page with featured items
- **Inventory Catalog**: Browse all rental items with search and filtering
- **Booking System**: Multi-step booking process with date selection and item selection
- **Real-time Availability**: Date-aware inventory checking
- **Booking Confirmation**: Detailed confirmation page with booking summary

### Admin Features
- **Dashboard**: Overview with key statistics and recent bookings
- **Booking Management**: View, filter, and manage all bookings
- **Inventory Management**: Add, edit, and manage rental items
- **Authentication**: Secure admin login with role-based access control
- **Status Management**: Update booking statuses (pending, confirmed, completed, cancelled)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- Git (for version control)

## 🔧 Setup Instructions

### 1. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (takes ~2 minutes)
3. Note down your project URL and anon key from Project Settings > API

### 2. Run Database Migrations

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the migration
5. Verify that all tables were created in the Table Editor

### 3. Configure Environment Variables

1. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Replace `your-project-url-here` and `your-anon-key-here` with your actual Supabase credentials.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create Admin User

Since Supabase Auth is enabled, you need to create an admin user:

1. The database migration includes sample inventory data
2. To create an admin account:
   - Go to your Supabase Dashboard
   - Navigate to Authentication > Users
   - Click "Add user" > "Create new user"
   - Enter an email and password
   
3. Make the user an admin:
   - Go to SQL Editor in Supabase
   - Run this query (replace with your email):
     ```sql
     UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
     ```

4. Now you can log in at `/login` with your admin credentials

## 📁 Project Structure

```
parent_rental_website/
├── app/
│   ├── admin/                  # Admin dashboard pages
│   │   ├── bookings/          # Booking management
│   │   ├── inventory/         # Inventory management
│   │   ├── layout.tsx         # Admin layout with nav
│   │   └── page.tsx           # Dashboard home
│   ├── api/
│   │   ├── auth/signout/      # Sign out endpoint
│   │   └── bookings/          # Booking API routes
│   ├── booking/
│   │   ├── confirmation/      # Booking confirmation page
│   │   └── page.tsx           # Multi-step booking form
│   ├── catalog/               # Inventory catalog page
│   ├── login/                 # Admin login page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── services/
│   │   └── availability.ts    # Inventory availability logic
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Auth middleware
│   ├── types/
│   │   └── database.types.ts  # TypeScript types
│   └── utils.ts               # Utility functions
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
├── .env.local                 # Environment variables (configured)
└── middleware.ts              # Next.js middleware
```

## 🗄️ Database Schema

### Tables

- **profiles**: User profiles (extends auth.users)
- **items**: Rental inventory items
- **bookings**: Customer booking requests
- **booking_items**: Junction table linking bookings to items

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic timestamp updates
- Automatic booking total calculation
- Profile creation on user signup
- Date range validation

## 🎯 Core Functionality

### Inventory Availability System

The system calculates real-time availability by:
1. Taking the total quantity of each item
2. Subtracting quantities from overlapping bookings
3. Considering booking status (pending/confirmed count as booked)
4. Preventing overbooking through validation

See `lib/services/availability.ts` for implementation details.

### Booking Workflow

1. **Customer selects dates** → System checks availability
2. **Customer selects items** → Validates against date range
3. **Customer enters info** → Creates pending booking
4. **Admin reviews** → Updates status to confirmed/cancelled
5. **Event completion** → Updates status to completed

## 🚀 Deployment to Vercel

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (will be your Vercel deployment URL)
6. Click "Deploy"

### Post-Deployment

1. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables with your deployment URL
2. Update Supabase Auth settings:
   - Go to Authentication > URL Configuration
   - Add your Vercel deployment URL to Site URL
   - Add `https://your-app.vercel.app/**` to Redirect URLs

## 📝 Usage Guide

### For Customers

1. Visit the home page to browse featured items
2. Go to Catalog to see all available items
3. Click "Create Booking" to start a reservation
4. Select event and return dates
5. Choose items and quantities
6. Enter contact information
7. Review and submit booking request
8. Receive confirmation with booking details

### For Admins

1. Log in at `/login` with admin credentials
2. View dashboard for overview
3. Manage bookings:
   - Review pending requests
   - Update booking status
   - View booking details
4. Manage inventory:
   - Add new items
   - Edit existing items
   - Set items active/inactive

## 🛠️ Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📊 Sample Data

The database migration includes sample inventory items:
- Folding Chairs (200 available, $2.50 each)
- Banquet Tables 8ft (30 available, $15.00 each)
- Round Tables 60" (20 available, $20.00 each)
- Table Cloths White (100 available, $5.00 each)
- Tents 20x20 (5 available, $150.00 each)
- Portable Speaker System (3 available, $75.00 each)
- Podiums (2 available, $25.00 each)
- Dance Floors 12x12 (2 available, $200.00 each)

## 🎨 Customization

### Branding

Update these files to customize branding:
- `app/page.tsx` - Business name and contact info
- `app/layout.tsx` - Page title and description
- `app/globals.css` - Color scheme and styling

### Contact Information

Update contact details in `app/page.tsx`:
- Phone number
- Email address
- Business name

## 🔐 Security Features

- All API routes protected with Supabase RLS
- Admin routes require authentication and admin role
- Passwords handled securely by Supabase Auth
- Environment variables keep sensitive data secure
- HTTPS enforced in production
- Row-level security on all database tables

## 🐛 Troubleshooting

### Database Issues
- Ensure migration ran successfully in Supabase SQL Editor
- Check Supabase logs for errors
- Verify RLS policies are enabled

### Authentication Issues
- Verify admin role is set in profiles table
- Check Supabase Auth configuration
- Ensure redirect URLs are configured correctly

### Deployment Issues
- Verify all environment variables are set in Vercel
- Check build logs for errors
- Ensure Node.js version is 18+

## 📄 License

This project is built for educational and business purposes. Modify as needed for your use case.

---

**Built with ❤️ using Next.js 15, Supabase, and modern web technologies.**
