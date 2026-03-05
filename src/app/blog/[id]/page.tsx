'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { useParams } from 'next/navigation'

type Blog = {
    id: string
    title: string
    content: string
    author_name: string
    image_url: string | null
    created_at: string
}

export default function BlogPostPage() {
    const { id } = useParams()
    const [blog, setBlog] = useState<Blog | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                if (!id) return
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .eq('id', id as string)
                    .single()

                if (error) throw error
                if (data) setBlog(data)
            } catch (error) {
                console.error('Error fetching blog:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBlog()
    }, [id])

    if (isLoading) {
        return (
            <div className="min-h-screen pt-32 pb-16 px-4 md:px-8 bg-[#0a0f1e]">
                <div className="max-w-3xl mx-auto animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/4 mb-12"></div>
                    <div className="h-64 bg-white/10 rounded w-full mb-8"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!blog) {
        return (
            <div className="min-h-screen pt-32 pb-16 px-4 md:px-8 bg-[#0a0f1e] text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4 text-white">Post not found</h1>
                    <Link href="/blog" className="text-[#0ea5e9] hover:underline inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Blog
                    </Link>
                </div>
            </div>
        )
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

                        <div className="flex items-center gap-3">
                            <Link href="/blog" className="text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                style={{ color: '#94a3b8' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                                <ArrowLeft size={16} /> Back to Blog
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <article className="pt-32 pb-24 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight" style={{ color: '#e2e8f0' }}>
                            {blog.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium py-4 border-t border-b border-white/10" style={{ color: '#94a3b8' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                                    <User size={16} style={{ color: '#0ea5e9' }} />
                                </div>
                                <span>By <span className="text-white">{blog.author_name}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} style={{ color: '#10b981' }} />
                                <span>{format(new Date(blog.created_at), 'MMMM dd, yyyy')}</span>
                            </div>
                        </div>
                    </div>

                    {blog.image_url && (
                        <div className="mb-12 rounded-2xl overflow-hidden border border-white/10">
                            <img src={blog.image_url} alt={blog.title} className="w-full h-auto max-h-[500px] object-cover" />
                        </div>
                    )}

                    <div className="prose prose-invert prose-lg max-w-none" style={{ color: '#cbd5e1' }}>
                        {blog.content.split('\n').map((paragraph, i) => (
                            paragraph ? <p key={i} className="mb-6 leading-relaxed">{paragraph}</p> : <br key={i} />
                        ))}
                    </div>
                </div>
            </article>
        </div>
    )
}
