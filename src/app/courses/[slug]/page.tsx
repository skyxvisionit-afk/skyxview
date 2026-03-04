'use client'

import { courses, Course } from '@/data/courses'
import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Clock, Users, BookOpen,
    CheckCircle, ArrowRight, Star, Shield,
    Target, Award
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CourseDetailsPage() {
    const params = useParams()
    const slug = params.slug as string
    const course = courses.find((c) => c.slug === slug)

    if (!course) {
        notFound()
    }

    return (
        <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
            {/* NAV (Consistent with home) */}
            <nav style={{ background: 'rgba(10,15,30,0.95)', borderBottom: '1px solid #1e3a5f' }}
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/logo.png" alt="SkyX Vision It Logo" className="w-10 h-10 object-contain" />
                            <span className="font-bold text-lg" style={{ color: '#e2e8f0' }}>
                                SkyX <span style={{ color: '#0ea5e9' }}>Vision It</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login" className="btn-outline hidden md:inline-flex" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
                                Login
                            </Link>
                            <Link href="/auth/register" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
                                Register <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-10 blur-3xl pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${course.slug.includes('blue') ? '#0ea5e9' : '#10b981'}, transparent)` }} />

                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#0ea5e9] transition-colors mb-8 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Courses
                    </Link>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
                                style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
                                <Star size={12} className="fill-current" /> Professional Course
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight" style={{ color: '#e2e8f0' }}>
                                {course.title} <span className="gradient-text">Mastery</span>
                            </h1>
                            <p className="text-lg text-[#94a3b8] mb-8 max-w-xl leading-relaxed">
                                {course.detailedDesc}
                            </p>

                            <div className="flex flex-wrap gap-6 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0ea5e9]/10 text-[#0ea5e9]">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#94a3b8]">Duration</div>
                                        <div className="text-sm font-bold text-[#e2e8f0]">{course.duration}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#10b981]/10 text-[#10b981]">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#94a3b8]">Trainers</div>
                                        <div className="text-sm font-bold text-[#e2e8f0]">{course.teachers.length} Professionals</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-500/10 text-yellow-500">
                                        <Award size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#94a3b8]">Certification</div>
                                        <div className="text-sm font-bold text-[#e2e8f0]">Verified by SkyX</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/auth/register" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem', justifyContent: 'center' }}>
                                    Enroll in Course <ArrowRight size={20} />
                                </Link>
                                <div className="flex items-center gap-2 px-6 py-2 rounded-xl border border-[#1e3a5f] bg-[#0d1530]/50 text-[#94a3b8] text-sm">
                                    <Shield size={16} className="text-[#10b981]" /> Secure Activation
                                </div>
                            </div>
                        </div>

                        <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#0ea5e9] to-[#10b981] rounded-3xl blur opacity-20" />
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-auto aspect-video object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0a0f1e] to-transparent">
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-3">
                                            {course.teachers.map((t, i) => (
                                                <img key={i} src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full border-2 border-[#0d1530]" />
                                            ))}
                                        </div>
                                        <div className="text-xs text-[#e2e8f0]">
                                            <span className="font-bold">Expert Instructors</span>
                                            <br />
                                            <span className="text-[#94a3b8]">Verified by Platform</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Info */}
            <section className="py-20 px-4 sm:px-6 bg-[#0d1530]/30 border-t border-[#1e3a5f]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Syllabus */}
                        <div className="md:col-span-2 space-y-10">
                            <div>
                                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-[#e2e8f0]">
                                    <BookOpen size={28} className="text-[#0ea5e9]" /> Course <span className="gradient-text">Syllabus</span>
                                </h2>
                                <div className="grid gap-6">
                                    {course.syllabus.map((s, idx) => (
                                        <div key={idx} className="glass-card p-6 border-l-4 border-[#0ea5e9]">
                                            <h3 className="text-xl font-bold text-[#e2e8f0] mb-4 flex items-center justify-between">
                                                {s.title}
                                                <span className="text-xs font-mono text-[#475569]">Module {String(idx + 1).padStart(2, '0')}</span>
                                            </h3>
                                            <ul className="grid sm:grid-cols-2 gap-3">
                                                {s.topics.map((topic, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-[#94a3b8] text-sm">
                                                        <CheckCircle size={14} className="text-[#10b981] flex-shrink-0" /> {topic}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl border border-[#1e3a5f] bg-gradient-to-br from-[#0d1530] to-[#0a0f1e] overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                    <Target size={120} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#e2e8f0]">Ready to start earning?</h3>
                                <p className="text-[#94a3b8] mb-6 max-w-lg">
                                    Join {course.title} today and access real-world tasks that help you build a sustainable online income source from Bangladesh.
                                </p>
                                <Link href="/auth/register" className="btn-primary">
                                    Begin Registration <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>

                        {/* Sidebar: Instructors & Stats */}
                        <div className="space-y-8">
                            <div className="glass-card p-8">
                                <h3 className="font-bold text-lg mb-6 text-[#e2e8f0] flex items-center gap-2">
                                    <Users size={18} className="text-[#0ea5e9]" /> Your Instructors
                                </h3>
                                <div className="space-y-6">
                                    {course.teachers.map((t, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                                            <div>
                                                <div className="font-bold text-[#e2e8f0]">{t.name}</div>
                                                <div className="text-xs text-[#0ea5e9] font-medium uppercase tracking-wider">{t.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card p-8 border border-yellow-500/20">
                                <h3 className="font-bold text-lg mb-4 text-[#e2e8f0]">Why choose this?</h3>
                                <div className="space-y-4">
                                    {[
                                        'Lifetime Access to Tasks',
                                        'Direct WhatsApp Support',
                                        'Weekly Performance Reviews',
                                        'Fast Payout System'
                                    ].map(item => (
                                        <div key={item} className="flex items-center gap-3 text-sm text-[#94a3b8]">
                                            <CheckCircle size={16} className="text-yellow-500" /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer (Simplified) */}
            <footer className="py-12 border-t border-[#1e3a5f] text-center px-4">
                <Link href="/" className="inline-flex items-center gap-3 mb-6">
                    <img src="/logo.png" alt="SkyX Vision It Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-[#e2e8f0]">SkyX Vision It</span>
                </Link>
                <div className="text-xs text-[#475569]">
                    © {new Date().getFullYear()} SkyX Vision It. All rights reserved. Empowerment through sustainable work.
                </div>
            </footer>
        </div>
    )
}
