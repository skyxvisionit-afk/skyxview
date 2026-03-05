'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, ChevronRight, Menu, X, ArrowRight } from 'lucide-react'

type Blog = {
    id: string
    title: string
    content: string
    author_name: string
    image_url: string | null
    created_at: string
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error
                if (data) setBlogs(data)
            } catch (error) {
                console.error('Error fetching blogs:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBlogs()
    }, [])

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

                        <div className="flex items-center gap-3">
                            <Link href="/" className="text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                style={{ color: '#94a3b8' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                                <ArrowLeft size={16} /> Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 sm:px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0ea5e9]/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ color: '#e2e8f0' }}>
                        Our <span className="gradient-text">Blog & Updates</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg" style={{ color: '#94a3b8' }}>
                        Stay up to date with the latest news, promotions, and updates from SkyX Vision It.
                    </p>
                </div>
            </section>

            {/* Blog Posts */}
            <section className="pb-32 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass-card animate-pulse h-96"></div>
                            ))}
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-20 glass-card">
                            <h3 className="text-xl font-bold mb-2" style={{ color: '#e2e8f0' }}>No posts yet</h3>
                            <p style={{ color: '#94a3b8' }}>Check back later for updates and news.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map(blog => (
                                <article key={blog.id} className="glass-card-hover overflow-hidden flex flex-col h-full">
                                    {blog.image_url ? (
                                        <div className="h-48 overflow-hidden w-full relative">
                                            <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                                        </div>
                                    ) : (
                                        <div className="h-48 overflow-hidden w-full relative bg-gradient-to-br from-[#0d1530] to-[#1e3a5f] flex items-center justify-center">
                                            <span className="text-[#0ea5e9] opacity-50 font-bold text-2xl">SkyX</span>
                                        </div>
                                    )}

                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 text-xs font-medium mb-4" style={{ color: '#94a3b8' }}>
                                            <div className="flex items-center gap-1">
                                                <User size={14} style={{ color: '#0ea5e9' }} />
                                                {blog.author_name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} style={{ color: '#10b981' }} />
                                                {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                                            </div>
                                        </div>

                                        <h2 className="text-xl font-bold mb-3 line-clamp-2" style={{ color: '#e2e8f0' }}>
                                            {blog.title}
                                        </h2>

                                        <p className="text-sm line-clamp-3 mb-6" style={{ color: '#94a3b8' }}>
                                            {blog.content}
                                        </p>

                                        <div className="mt-auto">
                                            <Link href={`/blog/${blog.id}`} className="text-sm font-bold inline-flex items-center gap-1 transition-colors hover:text-white" style={{ color: '#0ea5e9' }}>
                                                Read More <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
