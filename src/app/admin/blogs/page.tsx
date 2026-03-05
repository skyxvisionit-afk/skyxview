'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Save, AlertCircle, RefreshCw } from 'lucide-react'

type Blog = {
    id: string
    title: string
    content: string
    author_name: string
    image_url: string | null
    created_at: string
}

export default function AdminBlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const [formData, setFormData] = useState({
        id: '',
        title: '',
        content: '',
        author_name: '',
        image_url: ''
    })

    const supabase = createClient()

    useEffect(() => {
        fetchBlogs()
    }, [])

    const fetchBlogs = async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) setBlogs(data)
        } catch (err: any) {
            console.error('Error fetching blogs:', err)
            setError('Failed to load blogs')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenModal = (blog?: Blog) => {
        setError('')
        if (blog) {
            setFormData({
                id: blog.id,
                title: blog.title,
                content: blog.content,
                author_name: blog.author_name,
                image_url: blog.image_url || ''
            })
        } else {
            setFormData({
                id: '',
                title: '',
                content: '',
                author_name: '',
                image_url: ''
            })
        }
        setIsModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError('')
        setMessage('')

        try {
            if (formData.id) {
                // Update
                const { error } = await supabase
                    .from('blogs')
                    .update({
                        title: formData.title,
                        content: formData.content,
                        author_name: formData.author_name,
                        image_url: formData.image_url || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', formData.id)

                if (error) throw error
                setMessage('Blog post updated successfully')
            } else {
                // Create
                const { data: userData } = await supabase.auth.getUser()
                if (!userData.user) throw new Error("Not authenticated")

                const { error } = await supabase
                    .from('blogs')
                    .insert({
                        title: formData.title,
                        content: formData.content,
                        author_name: formData.author_name,
                        image_url: formData.image_url || null,
                        author_id: userData.user.id
                    })

                if (error) throw error
                setMessage('Blog post created successfully')
            }

            setIsModalOpen(false)
            fetchBlogs()
            setTimeout(() => setMessage(''), 3000)
        } catch (err: any) {
            console.error('Error saving blog:', err)
            setError(err.message || 'Failed to save blog post')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return

        setIsDeleting(id)
        try {
            const { error } = await supabase
                .from('blogs')
                .delete()
                .eq('id', id)

            if (error) throw error
            setBlogs(blogs.filter(b => b.id !== id))
            setMessage('Blog post deleted')
            setTimeout(() => setMessage(''), 3000)
        } catch (err: any) {
            console.error('Error deleting blog:', err)
            setError(err.message || 'Failed to delete blog post')
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Manage Blogs</h1>
                    <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Create and edit blog posts, news, and updates.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={16} /> New Post
                </button>
            </div>

            {message && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} /> {message}
                </div>
            )}

            {error && !isModalOpen && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center items-center">
                        <RefreshCw className="animate-spin text-sky-500" size={32} />
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: '#94a3b8' }}>
                        No blog posts found. Click "New Post" to create one.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase bg-[#0d1530] border-b border-[#1e3a5f]" style={{ color: '#64748b' }}>
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Post</th>
                                    <th className="px-6 py-4 font-semibold">Author</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e3a5f]">
                                {blogs.map(blog => (
                                    <tr key={blog.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {blog.image_url ? (
                                                    <div className="w-12 h-12 rounded object-cover flex-shrink-0 bg-slate-800 flex items-center justify-center overflow-hidden">
                                                        <img src={blog.image_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                        <ImageIcon size={20} className="text-slate-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold line-clamp-1" style={{ color: '#e2e8f0' }}>{blog.title}</p>
                                                    <p className="text-xs line-clamp-1 mt-1" style={{ color: '#94a3b8' }}>{blog.content.substring(0, 50)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4" style={{ color: '#cbd5e1' }}>
                                            {blog.author_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: '#94a3b8' }}>
                                            {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(blog)}
                                                    className="p-2 bg-sky-500/10 text-sky-500 rounded-lg hover:bg-sky-500/20 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(blog.id)}
                                                    disabled={isDeleting === blog.id}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {isDeleting === blog.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <div className="glass-card w-full max-w-2xl relative z-10 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#1e3a5f' }}>
                            <h2 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>
                                {formData.id ? 'Edit Blog Post' : 'Create Blog Post'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {error && (
                                <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <form id="blog-form" onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="form-label">Title *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        required
                                        placeholder="Enter post title"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">Author Name *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            required
                                            placeholder="e.g. Admin Team"
                                            value={formData.author_name}
                                            onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Image URL (Optional)</label>
                                        <input
                                            type="url"
                                            className="input-field"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Content *</label>
                                    <textarea
                                        className="input-field min-h-[200px]"
                                        required
                                        placeholder="Write your post content here..."
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: '#1e3a5f' }}>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                                className="btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="blog-form"
                                disabled={isSaving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? 'Saving...' : 'Save Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
