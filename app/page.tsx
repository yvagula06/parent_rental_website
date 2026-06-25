import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Package, Phone, Mail, Star, ArrowRight, Sparkles, Shield, Clock } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const { data: featuredItems } = await supabase
    .from('items')
    .select('*')
    .eq('active', true)
    .order('name')
    .limit(6)

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm animate-fade-in-down">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md animate-float">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 heading">EventRental</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/catalog" className="text-sm text-slate-600 hover:text-violet-600 transition-colors font-medium hidden sm:block">
              Browse Catalog
            </Link>
            <Link href="/booking">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 animate-gradient" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '0.8s'}} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px'}} />

        <div className="relative container mx-auto max-w-6xl px-4 py-24">
          <div className="text-center space-y-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              Premium Event Rentals in Your Area
            </div>

            {/* Headline */}
            <h1 className="heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              Make Your Event{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300">
                Unforgettable
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Everything you need for your perfect event — tables, chairs, linens, and more.
              Quality rentals with reliable, friendly service.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/booking">
                <Button size="lg" className="group bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white border-0 shadow-xl shadow-violet-500/30 px-8 text-base font-semibold">
                  Book Your Event
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/catalog">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 text-base font-medium backdrop-blur-sm">
                  Browse Catalog
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-white/40 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />)}</div>
                <span>500+ events served</span>
              </div>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Family-owned & trusted</span>
              </div>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span>Same-day confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80 C360 0 1080 80 1440 0 L1440 80 L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Why Choose Us ───────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-widest mb-3">Why choose us</p>
            <h2 className="heading text-4xl font-bold text-slate-900">Everything for your perfect event</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {[
              {
                icon: Calendar,
                color: 'from-violet-500 to-indigo-500',
                bg: 'bg-violet-50',
                title: 'Easy Booking',
                desc: 'Simple online booking with real-time availability. Reserve in minutes, not hours.',
              },
              {
                icon: Package,
                color: 'from-indigo-500 to-blue-500',
                bg: 'bg-indigo-50',
                title: 'Quality Equipment',
                desc: 'Well-maintained, clean inventory perfect for weddings, birthdays, and corporate events.',
              },
              {
                icon: Phone,
                color: 'from-blue-500 to-cyan-500',
                bg: 'bg-blue-50',
                title: 'Dedicated Support',
                desc: 'Family-owned business committed to your satisfaction every step of the way.',
              },
            ].map((feature) => (
              <div key={feature.title} className="group hover-lift rounded-2xl border border-slate-100 p-8 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="heading text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Items ──────────────────────────────────── */}
      {featuredItems && featuredItems.length > 0 && (
        <section className="py-24 px-4 bg-slate-50">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12">
              <div>
                <p className="text-violet-600 font-semibold text-sm uppercase tracking-widest mb-3">Our inventory</p>
                <h2 className="heading text-4xl font-bold text-slate-900">Popular Rentals</h2>
              </div>
              <Link href="/catalog" className="mt-4 sm:mt-0">
                <Button variant="outline" className="group border-slate-300 hover:border-violet-400 hover:text-violet-600">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {featuredItems.map((item) => (
                <div key={item.id} className="group hover-lift bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300">
                  {/* Color accent bar */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="heading font-bold text-slate-900 text-lg leading-tight">{item.name}</h3>
                        <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-violet-600">${item.price}</span>
                        <p className="text-xs text-slate-400">per day</p>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-400">{item.total_quantity} units available</span>
                      <Link href="/booking">
                        <Button size="sm" variant="ghost" className="group/btn text-violet-600 hover:bg-violet-50 font-medium -mr-2">
                          Book now
                          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-12 text-center animate-gradient shadow-2xl shadow-violet-500/20">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}} />
            <div className="relative">
              <h2 className="heading text-4xl font-bold text-white mb-4">Ready to plan your event?</h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Book online in minutes and get same-day confirmation. We'll take care of the rest.
              </p>
              <Link href="/booking">
                <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-xl px-10 text-base border-0">
                  Start Booking
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="heading text-3xl font-bold text-slate-900 mb-3">Have questions?</h2>
          <p className="text-slate-500 mb-8">We're here to help make your event perfect.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="flex items-center justify-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Phone className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-slate-700 font-medium">(555) 123-4567</span>
            </div>
            <div className="flex items-center justify-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Mail className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-slate-700 font-medium">rentals@example.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-white py-10 px-4 mt-auto">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold heading">EventRental</span>
          </div>
          <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} Premium Event Rentals. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/catalog" className="hover:text-white transition-colors">Catalog</Link>
            <Link href="/booking" className="hover:text-white transition-colors">Book Now</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}