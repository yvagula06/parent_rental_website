import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Package, 
  Calendar as CalendarIcon, 
  FileText, 
  LogOut,
  Settings,
  Menu,
  X
} from 'lucide-react'

async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) redirect('/')

  let businessName = 'Admin Dashboard'
  if (profile.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', profile.business_id)
      .single()
    if (business) businessName = business.name
  }

  return { user, profile, businessName }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, businessName } = await getUserProfile()

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/bookings', label: 'Bookings', icon: FileText },
    { href: '/admin/inventory', label: 'Inventory', icon: Package },
    { href: '/admin/calendar', label: 'Calendar', icon: CalendarIcon },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 animate-fade-in-down">
        <div className="flex items-center justify-between px-4 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 animate-float">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight heading">{businessName}</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm shadow-green-300 animate-pulse-soft" />
              <span className="text-xs text-slate-600 font-medium">{user.email}</span>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                <LogOut className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/70 backdrop-blur-md border-r border-slate-200/60 min-h-[calc(100vh-61px)] hidden lg:block animate-fade-in">
          <nav className="p-4 space-y-1.5 pt-6 stagger-children">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-2.5 h-auto text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all duration-200 font-medium"
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-100/50 p-4">
              <p className="text-xs text-slate-500 font-medium">Premium Event Rentals</p>
              <p className="text-[10px] text-slate-400 mt-0.5">v1.0.0</p>
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/60 z-50">
          <div className="flex justify-around py-2 px-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                <item.icon className="h-4.5 w-4.5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
