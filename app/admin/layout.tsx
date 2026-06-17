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
  Settings
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
    redirect('/')
  }

  // Get business name
  let businessName = 'Admin Dashboard'
  if (profile.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', profile.business_id)
      .single()
    if (business) {
      businessName = business.name
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/bookings">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Bookings
              </Button>
            </Link>
            <Link href="/admin/inventory">
              <Button variant="ghost" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Inventory
              </Button>
            </Link>
            <Link href="/admin/calendar">
              <Button variant="ghost" className="w-full justify-start">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
