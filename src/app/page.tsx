'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Network, Target, Users, TrendingUp, Shield, Award,
  ChevronRight, Mail, Phone, MapPin, MessageCircle,
  CheckCircle, Star, Briefcase, ArrowRight, Menu, X
} from 'lucide-react'
import { courses } from '@/data/courses'


// Services now imported from @/data/courses


const stats = [
  { value: '10,000+', label: 'Active Members' },
  { value: '৳5M+', label: 'Paid Out' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
]

const features = [
  { icon: Shield, title: 'Secure Platform', desc: 'Bank-level security with Supabase Row Level Security and encrypted data.' },
  { icon: TrendingUp, title: 'Referral Commissions', desc: 'Earn on every referral activation. Trainers and leaders get additional commissions.' },
  { icon: Users, title: 'Team Hierarchy', desc: 'Structured team system with Leaders, Trainers, and Members working together.' },
  { icon: Award, title: 'Multiple Income Sources', desc: 'Choose from 9 different task categories and earn through referrals simultaneously.' },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)

  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [showCoffeeNumber, setShowCoffeeNumber] = useState(false)



  const faqs = [
    { q: 'How do I start earning?', a: 'Register with your WhatsApp number, activate your account with a one-time fee, and start picking tasks from 9 categories.' },
    { q: 'Is the activation fee refundable?', a: 'The activation fee is a one-time platform maintenance cost and is non-refundable, as it grants you lifetime access to all tasks.' },
    { q: 'How long does withdrawal take?', a: 'Withdrawals are typically processed within 2-24 hours through Bkash, Nagad, or Bank.' },
    { q: 'Can I refer others and earn?', a: 'Yes! You earn direct commissions for every person who joins using your referral code, plus team bonuses.' },
  ]

  const testimonials = [
    { name: 'Ariful Islam', role: 'Student (Trainer)', text: 'SkyX Vision changed my life. I started as a member and now I am a trainer earning 40k+ monthly.', avatar: 'https://i.pravatar.cc/150?u=1' },
    { name: 'Nusrat Jahan', role: 'Graphic Designer', text: 'The platform is super easy to use. I take design tasks whenever I have free time. Payments are always on time.', avatar: 'https://i.pravatar.cc/150?u=2' },
    { name: 'Rahat Ahmed', role: 'Full-time Earner', text: 'Highly recommended for anyone looking for legitimate online work in Bangladesh. Support is 24/7.', avatar: 'https://i.pravatar.cc/150?u=3' },
    { name: 'Sumi Akter', role: 'Leader', text: 'I am proud to be a leader at SkyX. Managing a team of 50+ members and earning consistently.', avatar: 'https://i.pravatar.cc/150?u=4' },
    { name: 'Tanvir Hasan', role: 'Content Creator', text: 'The referral system is very rewarding. It is one of the best platforms for passive income.', avatar: 'https://i.pravatar.cc/150?u=5' },
    { name: 'Mitu Islam', role: 'Member', text: 'I found legitimate data entry work here. Payouts are fast through Nagad.', avatar: 'https://i.pravatar.cc/150?u=6' },
  ]

  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
        }
      })
    }, observerOptions)

    const revealElements = document.querySelectorAll('.reveal')
    revealElements.forEach(el => observer.observe(el))

    return () => {
      revealElements.forEach(el => observer.unobserve(el))
    }
  }, [])




  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
    setContactForm({ name: '', email: '', message: '' })
    setTimeout(() => setContactSent(false), 4000)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(10,15,30,0.95)', borderBottom: '1px solid #1e3a5f' }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="SkyX Vision It Logo" className="w-10 h-10 object-contain" />
                <span className="font-bold text-lg" style={{ color: '#e2e8f0' }}>
                  SkyX <span style={{ color: '#0ea5e9' }}>Vision It</span>
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {['About', 'Services', 'How It Works', 'Contact'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="btn-outline hidden md:inline-flex" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                Login
              </Link>
              <Link href="/auth/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                Get Started <ArrowRight size={14} />
              </Link>
              <button className="md:hidden text-gray-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={cn(
          "fixed inset-x-0 top-16 z-40 md:hidden transition-all duration-300 overflow-hidden",
          mobileMenuOpen ? "max-h-[400px] border-b opacity-100" : "max-h-0 opacity-0"
        )} style={{ background: '#0d1530', borderColor: '#1e3a5f' }}>
          <div className="px-5 py-6 space-y-4">
            {['About', 'Services', 'How It Works', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                className="flex items-center justify-between text-base font-bold py-2"
                style={{ color: '#e2e8f0' }}
                onClick={() => setMobileMenuOpen(false)}>
                {item}
                <ChevronRight size={18} className="text-sky-500" />
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/auth/login" className="btn-outline w-full" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link href="/auth/register" className="btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>Register</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 hero-gradient mesh-bg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-8 w-full animate-fade-in-up">
          {/* Hero Banner with Content Overlay */}
          <div className="relative group/hero rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d1530]">
            {/* Content background is handled by the parent container's bg-[#0d1530] */}


            {/* Content Overlay */}
            <div className="relative z-10 py-16 px-6 sm:py-24 sm:px-12 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
                style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)', color: '#0ea5e9', backdropFilter: 'blur(8px)' }}>
                <Star size={12} className="fill-current" />
                Bangladesh&apos;s #1 Task-Based Referral Platform
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6 max-w-4xl animate-fade-in-up"
                style={{ color: '#e2e8f0', animationDelay: '0.2s' }}>
                <span className="block mb-2 opacity-0 animate-slide-in-left" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                  Earn More With
                </span>
                <span className="gradient-text drop-shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-pulse-slow">SkyX</span> Vision It
              </h1>

              <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed opacity-0 animate-fade-in-up"
                style={{ color: '#94a3b8', animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                Join thousands of members earning through task-based work and referral commissions.
                Data entry, design, packaging jobs — all in one professional platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center mb-0 opacity-0 animate-fade-in-up"
                style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                <Link href="/auth/register" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
                  Join Now — It&apos;s Free <ArrowRight size={20} />
                </Link>
                <Link href="/auth/login" className="btn-outline border-white/20 text-white hover:bg-white/10" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
                  Member Login
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Overlaying Bottom Part */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-20">
            {stats.map((s) => (
              <div key={s.label} className="glass-card p-4 text-center">
                <div className="text-2xl font-extrabold gradient-text">{s.value}</div>
                <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative py-24 px-4 sm:px-6 overflow-hidden reveal">
        {/* Background Overlay (Image Removed) */}
        <div className="absolute inset-0 z-0 bg-[#0a0f1e]" />


        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                <Briefcase size={12} />
                About SkyX Vision It
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#e2e8f0' }}>
                A Platform Built for <span className="gradient-text">Real Earners</span>
              </h2>
              <p className="mb-4" style={{ color: '#94a3b8' }}>
                SkyX Vision It is a legitimate, task-based referral business platform operating in Bangladesh.
                We connect skilled individuals with real work opportunities while rewarding them for growing our community.
              </p>
              <p className="mb-6" style={{ color: '#94a3b8' }}>
                Our structured hierarchy — Members, Trainers, and Leaders — ensures everyone gets proper support,
                training, and commission at every level. All payouts are transparent and processed through Bkash, Nagad, Rocket, or Bank.
              </p>
              <div className="space-y-3">
                {['100% legitimate income opportunities', 'Transparent commission structure', 'Dedicated support from trainers', 'Fast withdrawal processing'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: '#cbd5e1' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="glass-card-hover p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: 'rgba(14,165,233,0.1)' }}>
                    <f.icon size={20} style={{ color: '#0ea5e9' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-2" style={{ color: '#e2e8f0' }}>{f.title}</h3>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 px-4 sm:px-6 bg-[#0a0f1e]/50 reveal" style={{ background: 'rgba(13,21,48,0.5)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
              <Target size={12} />
              Work Categories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#e2e8f0' }}>
              9 Ways to <span className="gradient-text">Earn Money</span>
            </h2>
            <p className="mt-3 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
              Choose from a wide variety of tasks that match your skills and availability.
            </p>
          </div>
          <div className="overflow-hidden relative group">
            <div className="animate-marquee-slow flex gap-6 py-4">
              {[...courses, ...courses].map((s, i) => (
                <Link
                  key={`${s.slug}-${i}`}
                  href={`/courses/${s.slug}`}
                  className="flex-shrink-0 w-[240px] sm:w-[300px] cursor-pointer group/card"
                >
                  <div className="glass-card-hover h-full flex flex-col overflow-hidden transition-all duration-300 transform group-hover/card:-translate-y-2">
                    {/* Thumbnail */}
                    <div className="h-32 overflow-hidden relative">
                      <img
                        src={s.thumbnail}
                        alt={s.title}
                        className="w-full h-full object-cover grayscale-[0.2] group-hover/card:grayscale-0 group-hover/card:scale-110 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1530] to-transparent opacity-60" />
                      <div className="absolute bottom-3 left-3 text-2xl">{s.icon}</div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col"
                      style={{ background: `linear-gradient(135deg, ${s.color.split(' ')[1].replace('to-', '')}, transparent)` }}>
                      <h3 className="font-bold text-lg mb-1" style={{ color: '#e2e8f0' }}>{s.title}</h3>
                      <p className="text-xs line-clamp-2" style={{ color: '#94a3b8' }}>{s.desc}</p>

                      <div className="mt-auto pt-3 flex items-center text-[10px] font-bold text-[#0ea5e9]">
                        VIEW COURSE <ArrowRight size={12} className="ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Gradient Fades for the marquee */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0f1e] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0f1e] to-transparent z-10 pointer-events-none" />
          </div>

        </div>
      </section>


      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 relative overflow-hidden reveal">
        {/* Background glow for the section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0ea5e9]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              <TrendingUp size={12} />
              Simple Process
            </div>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: '#e2e8f0' }}>
              How to Start <span className="gradient-text">Earning</span>
            </h2>
            <p className="mt-4 max-w-2xmx-auto text-lg" style={{ color: '#94a3b8' }}>
              Your journey from registration to withdrawal in four easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Quick Register',
                desc: 'Join our community in seconds with your WhatsApp ID.',
                icon: <Users size={24} />,
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                title: 'Easy Activation',
                desc: 'One-time fee covers everything for life. No hidden costs.',
                icon: <Award size={24} />,
                color: 'from-emerald-500 to-teal-500'
              },
              {
                step: '03',
                title: 'Perform Tasks',
                desc: 'Choose from 9+ categories and work on your own schedule.',
                icon: <Briefcase size={24} />,
                color: 'from-amber-500 to-orange-500'
              },
              {
                step: '04',
                title: 'Instant Payout',
                desc: 'Withdraw your hard-earned money to Bkash, Nagad or Bank.',
                icon: <TrendingUp size={24} />,
                color: 'from-rose-500 to-pink-500'
              },
            ].map((item, i) => (
              <div key={item.step} className="group/step relative">
                {/* Connector line for large screens */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[100%] w-[calc(100%-80px)] h-0.5 z-0"
                    style={{ background: 'linear-gradient(90deg, #1e3a5f, transparent)' }} />
                )}

                <div className="relative z-10 glass-card-hover p-8 h-full flex flex-col items-center text-center group-hover/step:border-[#0ea5e9]/50 transition-all duration-500">
                  {/* Step Number Badge */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white bg-gradient-to-br ${item.color} shadow-lg shadow-black/20 transform group-hover/step:rotate-12 transition-transform duration-500`}>
                    {item.icon}
                  </div>

                  <div className="absolute top-4 right-4 text-4xl font-black opacity-5 group-hover/step:opacity-10 transition-opacity" style={{ color: '#e2e8f0' }}>
                    {item.step}
                  </div>

                  <h3 className="text-xl font-bold mb-4" style={{ color: '#e2e8f0' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{item.desc}</p>

                  {/* Dot indicator at bottom */}
                  <div className="mt-8 w-2 h-2 rounded-full bg-[#1e3a5f] group-hover/step:bg-[#0ea5e9] group-hover/step:scale-150 transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>

          {/* Call to action below steps */}
          <div className="mt-20 text-center">
            <Link href="/auth/register" className="btn-primary" style={{ padding: '1rem 3rem' }}>
              Start My Journey Now <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 relative overflow-hidden reveal" style={{ background: 'rgba(10,15,30,0.4)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: '#e2e8f0' }}>
              What Our <span className="gradient-text">Earners</span> Say
            </h2>
          </div>
          <div className="overflow-hidden py-10">
            <div className="animate-marquee-slow flex gap-8 items-stretch">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="glass-card-hover p-8 relative flex-shrink-0 w-[350px] flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border-2 border-[#0ea5e9]" />
                    <div>
                      <h4 className="font-bold shrink-0" style={{ color: '#e2e8f0' }}>{t.name}</h4>
                      <div className="text-xs text-[#0ea5e9] font-semibold">{t.role}</div>
                    </div>
                  </div>
                  <p className="italic text-sm leading-relaxed mb-4 grow" style={{ color: '#94a3b8' }}>&quot;{t.text}&quot;</p>
                  <div className="flex text-yellow-500 gap-1 text-xs">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill="currentColor" />)}
                  </div>
                  <div className="absolute top-8 right-8 text-2xl opacity-10 pointer-events-none">✨</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-4 sm:px-6 reveal">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side: Images/Graphics */}
            <div className="order-2 md:order-1 relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#0ea5e9] to-[#10b981] rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80"
                  alt="Customer Support Excellence"
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-60" />

                {/* Overlay Card */}
                <div className="absolute bottom-6 left-6 right-6 glass-card p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                      <Shield size={20} style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: '#e2e8f0' }}>24/7 Verified Support</div>
                      <div className="text-xs text-[#94a3b8]">We are here to help you grow.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: FAQ Accordions */}
            <div className="order-1 md:order-2">
              <div className="mb-10 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
                  <Star size={12} />
                  Your Questions Answered
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: '#e2e8f0' }}>
                  Frequently Asked <span className="gradient-text">Questions</span>
                </h2>
                <p style={{ color: '#94a3b8' }} className="max-w-xl text-lg">
                  Everything you need to know about SkyX platform and how to start your earning journey today.
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="glass-card overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
                    <button
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <span className="font-semibold text-lg" style={{ color: '#e2e8f0' }}>{faq.q}</span>
                      <ChevronRight size={20} className={`transition-transform duration-300 ${activeFaq === i ? 'rotate-90' : ''}`} style={{ color: '#0ea5e9' }} />
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === i ? 'max-h-40 p-6 pt-0' : 'max-h-0'}`}>
                      <p className="text-base leading-relaxed" style={{ color: '#94a3b8' }}>{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-4 sm:px-6 reveal" style={{ background: 'rgba(13,21,48,0.5)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#e2e8f0' }}>
              Get In <span className="gradient-text">Touch</span>
            </h2>
            <p className="mt-3" style={{ color: '#94a3b8' }}>We&apos;re here to help. Reach out anytime.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-6" style={{ color: '#e2e8f0' }}>Contact Information</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(14,165,233,0.1)' }}>
                      <MessageCircle size={18} style={{ color: '#0ea5e9' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>WhatsApp Support</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>01313961899</div>
                      <a href="https://wa.me/8801313961899" target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: '#10b981' }}>
                        Chat on WhatsApp <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(14,165,233,0.1)' }}>
                      <Mail size={18} style={{ color: '#0ea5e9' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>Email</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>skyxvisionit@gmail.com</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(14,165,233,0.1)' }}>
                      <Phone size={18} style={{ color: '#0ea5e9' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>Phone</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>+880 1313-961899</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(14,165,233,0.1)' }}>
                      <MapPin size={18} style={{ color: '#0ea5e9' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>Address</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Dhaka, Bangladesh</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-6" style={{ color: '#e2e8f0' }}>Send a Message</h3>
              {contactSent ? (
                <div className="alert-success">
                  <CheckCircle size={16} />
                  Message sent! We&apos;ll get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input id="contact-name" type="text" className="input-field" placeholder="Your full name"
                      value={contactForm.name} required
                      onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input id="contact-email" type="email" className="input-field" placeholder="your@email.com"
                      value={contactForm.email} required
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Message</label>
                    <textarea id="contact-message" className="input-field" rows={4} placeholder="How can we help you?"
                      value={contactForm.message} required
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      style={{ resize: 'vertical' }} />
                  </div>
                  <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }}>
                    <Mail size={16} /> Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS MARQUEE */}
      <section className="py-1 border-t border-b border-[#1e3a5f]" style={{ background: 'rgba(13,21,48,0.3)' }}>
        <div className="max-w-7xl mx-auto overflow-hidden relative">
          {/* Subtle Fades */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0f1e] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0f1e] to-transparent z-10" />

          <div className="animate-marquee flex gap-12 items-center whitespace-nowrap py-2">
            {[
              'Fiverr', 'Upwork', 'Freelancer', 'Guru', 'PeoplePerHour',
              'Toptal', 'LinkedIn', 'SkyX Vision IT', 'SimplyHired', 'Indeed',
              'Fiverr', 'Upwork', 'Freelancer', 'Guru', 'PeoplePerHour',
              'Toptal', 'LinkedIn', 'SkyX Vision IT', 'SimplyHired', 'Indeed'
            ].map((name, i) => (
              <span key={i} className="text-sm md:text-base font-bold tracking-widest uppercase transition-all duration-300 cursor-default"
                style={{
                  color: i % 2 === 0 ? '#0ea5e9' : '#10b981',
                  textShadow: i % 2 === 0 ? '0 0 15px rgba(14,165,233,0.4)' : '0 0 15px rgba(16,185,129,0.4)',
                  opacity: '0.9'
                }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1e3a5f', background: 'rgba(10,15,30,0.95)' }} className="pt-20 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Column 1: Brand */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="SkyX Vision It Logo" className="w-10 h-10 object-contain" />
                <span className="font-bold text-xl" style={{ color: '#e2e8f0' }}>SkyX Vision It</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                Bangladesh&apos;s most trusted task-based earning platform. We empower individuals through sustainable work and real income opportunities.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                  <MessageCircle size={18} />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <TrendingUp size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest" style={{ color: '#e2e8f0' }}>Company</h4>
              <ul className="space-y-4">
                {['About Us', 'Our Information', 'Careers', 'Success Stories'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:translate-x-1 transition-all inline-block" style={{ color: '#94a3b8' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest" style={{ color: '#e2e8f0' }}>Legal</h4>
              <ul className="space-y-4">
                {['Privacy Policy', 'Terms & Conditions', 'Withdrawal Policy', 'Member Agreement'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:translate-x-1 transition-all inline-block" style={{ color: '#94a3b8' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Support */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest" style={{ color: '#e2e8f0' }}>Support</h4>
              <ul className="space-y-4">
                {['Help Center', 'Safety Center', 'Contact Support', 'Community Guideline'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:translate-x-1 transition-all inline-block" style={{ color: '#94a3b8' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1e3a5f] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: '#64748b' }}>
              © 2026 SkyX Vision It. All rights reserved. Developed by Arafath. {' '}
              <button
                onClick={() => setShowCoffeeNumber(!showCoffeeNumber)}
                className="hover:text-[#0ea5e9] transition-colors cursor-pointer border-none bg-transparent p-0 font-inherit inline"
              >
                {showCoffeeNumber ? '01313961899 (Bkash)' : 'Give him a coffee ☕'}
              </button>
            </p>
            <div className="flex gap-6">
              <Link href="/auth/login" className="text-xs font-semibold hover:text-[#0ea5e9] transition-colors" style={{ color: '#94a3b8' }}>ADMIN LOGIN</Link>
              <Link href="/auth/register" className="text-xs font-semibold hover:text-[#10b981] transition-colors" style={{ color: '#94a3b8' }}>REGISTER PARTNER</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/8801313961899"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[90] w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageCircle size={30} color="white" className="fill-white" />
        <span className="absolute right-full mr-4 bg-[#0d1530] text-white text-xs py-2 px-4 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-x-4 group-hover:translate-x-0 font-bold">
          Quick Support
        </span>
      </a>
    </div>
  )
}
