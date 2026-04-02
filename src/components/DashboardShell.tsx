'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'
import { getRoleLabel, getRoleColor, cn } from '@/lib/utils'
import { getBadgeColor, BadgeDefinition } from '@/lib/badgeUtils'
import NotificationBell from '@/components/NotificationBell'
import {
    Network, LayoutDashboard, Users, DollarSign, LogOut,
    Menu, X, Briefcase, Settings, ChevronDown, Bell,
    UserCircle, Database, FileText, Image, Video, Palette,
    Package, ClipboardList, Share2, Lock, Megaphone, Store, Heart, ShoppingCart, BellDot, Award, BookOpen
} from 'lucide-react'

interface SidebarProps {
    profile: UserProfile
}

const memberNav = [
    { href: '/dashboard/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/notices/', label: 'Notice Panel', icon: BellDot },
    { href: '/dashboard/meetings/', label: 'Live Meeting', icon: Video },
    { href: '/dashboard/profile/', label: 'My Profile', icon: UserCircle },
    { href: '/dashboard/referrals/', label: 'My Fields', icon: Users },
    { href: '/dashboard/withdraw/', label: 'Withdraw', icon: DollarSign },
    {
        label: 'Task Categories', icon: Briefcase, children: [
            { href: '/dashboard/tasks/data-entry/', label: 'Data Entry', icon: Database },
            { href: '/dashboard/tasks/form-fillup/', label: 'Form Fillup', icon: FileText },
            { href: '/dashboard/tasks/photo-editing/', label: 'Photo Editing', icon: Image },
            { href: '/dashboard/tasks/video-editing/', label: 'Video Editing', icon: Video },
            { href: '/dashboard/tasks/graphic-design/', label: 'Graphic Design', icon: Palette },
            { href: '/dashboard/tasks/pen-packaging/', label: 'Pen Packaging', icon: Package },
            { href: '/dashboard/tasks/soap-packaging/', label: 'Soap Packaging', icon: Package },
            { href: '/dashboard/tasks/social-media/', label: 'Social Media', icon: Share2 },
            { href: '/dashboard/tasks/copy-paste/', label: 'Copy Paste', icon: ClipboardList },
        ]
    },
    { href: '/dashboard/shop/', label: 'Reseller Shop', icon: Store },
    { href: '/dashboard/orders/', label: 'My Orders', icon: ShoppingCart },
    { href: '/dashboard/favorites/', label: 'Favorites', icon: Heart },
    { href: '/dashboard/security/', label: 'Security', icon: Lock },
]

const trainerNav = [
    { href: '/trainer/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/trainer/notices/', label: 'Notice Panel', icon: BellDot },
    { href: '/trainer/meetings/', label: 'Meetings', icon: Video },
    { href: '/trainer/profile/', label: 'My Profile', icon: UserCircle },
    { href: '/trainer/members/', label: 'My Members', icon: Users },
    { href: '/trainer/member-book/', label: 'Member Book', icon: BookOpen },
    { href: '/trainer/forms/', label: 'Member Forms', icon: FileText },
    { href: '/trainer/commissions/', label: 'My Fields', icon: DollarSign },
    { href: '/trainer/withdraw/', label: 'Withdraw', icon: DollarSign },
    { href: '/trainer/shop/', label: 'Reseller Shop', icon: Store },
    { href: '/trainer/orders/', label: 'My Orders', icon: ShoppingCart },
    { href: '/trainer/favorites/', label: 'Favorites', icon: Heart },
    { href: '/trainer/security/', label: 'Security', icon: Lock },
]

const leaderNav = [
    { href: '/leader/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leader/notices/', label: 'Notice Panel', icon: BellDot },
    { href: '/leader/meetings/', label: 'Meetings', icon: Video },
    { href: '/leader/profile/', label: 'My Profile', icon: UserCircle },
    { href: '/leader/trainers/', label: 'My Trainers', icon: Users },
    { href: '/leader/members/', label: 'All Members', icon: Users },
    { href: '/leader/member-book/', label: 'Member Book', icon: BookOpen },
    { href: '/leader/forms/', label: 'Member Forms', icon: FileText },
    { href: '/leader/commissions/', label: 'My Fields', icon: DollarSign },
    { href: '/leader/withdraw/', label: 'Withdraw', icon: DollarSign },
    { href: '/leader/shop/', label: 'Reseller Shop', icon: Store },
    { href: '/leader/orders/', label: 'My Orders', icon: ShoppingCart },
    { href: '/leader/favorites/', label: 'Favorites', icon: Heart },
    { href: '/leader/security/', label: 'Security', icon: Lock },
]

const adminNav = [
    { href: '/admin/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/profile/', label: 'My Profile', icon: UserCircle },
    { href: '/admin/meetings/', label: 'Meetings', icon: Video },
    { href: '/admin/teams/', label: 'Team Mapping', icon: Network },
    { href: '/admin/users/', label: 'Manage Users', icon: Users },
    { href: '/admin/forms/', label: 'Form Fillups', icon: FileText },
    { href: '/admin/blogs/', label: 'Manage Blogs', icon: FileText },
    { href: '/admin/badges/', label: 'Manage Badges', icon: Award },
    { href: '/admin/notices/', label: 'Notice Panel', icon: BellDot },
    { href: '/admin/notifications/', label: 'Notifications', icon: Megaphone },
    { href: '/admin/activations/', label: 'Activations', icon: UserCircle },
    { href: '/admin/withdrawals/', label: 'Withdrawals', icon: DollarSign },
    { href: '/admin/commissions/', label: 'Commissions', icon: DollarSign },
    { href: '/admin/ecommerce/products/', label: 'Manage Products', icon: Package },
    { href: '/admin/ecommerce/orders/', label: 'Manage Orders', icon: ClipboardList },
    { href: '/admin/settings/', label: 'Settings', icon: Settings },
    { href: '/admin/security/', label: 'Security', icon: Lock },
]

function getNavItems(role: string) {
    if (role === 'ADMIN') return adminNav
    if (role === 'TEAM_LEADER') return leaderNav
    if (role === 'TEAM_TRAINER') return trainerNav
    return memberNav
}

interface NavItemData {
    href?: string
    label: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    children?: NavItemData[]
}

function NavItem({ item, pathname, onClose }: { item: NavItemData; pathname: string; onClose?: () => void }) {
    const [open, setOpen] = useState(pathname.includes('/tasks'))

    if (item.children) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className="sidebar-link w-full text-left"
                    style={{ justifyContent: 'space-between' }}>
                    <span className="flex items-center gap-3">
                        <item.icon size={16} />
                        {item.label}
                    </span>
                    <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>
                {open && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l pl-3" style={{ borderColor: '#1e3a5f' }}>
                        {item.children.map(child => (
                            <Link key={child.href} href={child.href!} onClick={onClose}
                                className={cn('sidebar-link text-xs', pathname === child.href && 'active')}>
                                <child.icon size={14} />
                                {child.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link href={item.href!} onClick={onClose}
            className={cn('sidebar-link', pathname === item.href && 'active')}>
            <item.icon size={16} />
            {item.label}
        </Link>
    )
}

export default function DashboardShell({ profile, children }: { profile: UserProfile; children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [badges, setBadges] = useState<BadgeDefinition[]>([])
    const navItems = getNavItems(profile.role)

    useEffect(() => {
        const fetchBadges = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('badges').select('*')
            if (data) setBadges(data as BadgeDefinition[])
        }
        fetchBadges()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/auth/login'
    }

    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-6 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                <Link href="/" className="flex items-center gap-3">
                    <img src="/logo.png" alt="SkyX Vision It Logo" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-base tracking-tight" style={{ color: '#e2e8f0' }}>
                        SkyX <span style={{ color: '#0ea5e9' }}>Vision It</span>
                    </span>
                </Link>
                {onClose && (
                    <button onClick={onClose} className="p-2 md:hidden" style={{ color: '#94a3b8' }}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* User Info */}
            <div className="px-5 py-5 border-b" style={{ borderColor: '#1e3a5f', background: 'rgba(14,165,233,0.03)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #10b981)', color: 'white' }}>
                        {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex flex-col items-start gap-1">
                        <div className="text-sm font-bold truncate" style={{ color: '#e2e8f0' }}>{profile.full_name}</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn('badge text-[0.6rem] py-0.5 px-1.5', getRoleColor(profile.role))}>{getRoleLabel(profile.role)}</span>
                            <span className={cn('badge text-[0.6rem] py-0.5 px-1.5 truncate border text-center', getBadgeColor(profile.badge, badges))}>
                                {badges.find(b => b.name === profile.badge)?.icon_emoji || '🏆'} {profile.badge || 'Newbie'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 scrollbar-hide">
                {navItems.map(item => (
                    <NavItem key={item.label} item={item} pathname={pathname} onClose={onClose} />
                ))}
            </nav>

            {/* Logout */}
            <div className="px-4 py-6 border-t" style={{ borderColor: '#1e3a5f' }}>
                <button onClick={handleLogout}
                    className="sidebar-link w-full text-left font-semibold group hover:bg-red-500/10"
                    style={{ color: '#ef4444' }}>
                    <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
                    Sign Out
                </button>
            </div>
        </div>
    )

    const getBottomNavItems = () => {
        if (profile.role === 'ADMIN') {
            return [
                { href: '/admin/', label: 'Admin', icon: LayoutDashboard },
                { href: '/admin/users/', label: 'Users', icon: Users },
                { href: '/admin/activations/', label: 'Acts', icon: UserCircle },
                { href: '/admin/withdrawals/', label: 'Cash', icon: DollarSign },
                { onClick: () => setMobileOpen(true), label: 'More', icon: Menu },
            ]
        }
        if (profile.role === 'TEAM_LEADER') {
            return [
                { href: '/leader/', label: 'Leader', icon: LayoutDashboard },
                { href: '/leader/trainers/', label: 'Trainers', icon: Users },
                { href: '/leader/members/', label: 'Members', icon: Users },
                { href: '/leader/withdraw/', label: 'Wallet', icon: DollarSign },
                { onClick: () => setMobileOpen(true), label: 'Menu', icon: Menu },
            ]
        }
        if (profile.role === 'TEAM_TRAINER') {
            return [
                { href: '/trainer/', label: 'Trainer', icon: LayoutDashboard },
                { href: '/trainer/members/', label: 'Members', icon: Users },
                { href: '/trainer/commissions/', label: 'Income', icon: DollarSign },
                { href: '/trainer/withdraw/', label: 'Wallet', icon: DollarSign },
                { onClick: () => setMobileOpen(true), label: 'Menu', icon: Menu },
            ]
        }
        return [
            { href: '/dashboard/', label: 'Home', icon: LayoutDashboard },
            { href: '/dashboard/tasks/', label: 'Tasks', icon: Briefcase },
            { href: '/dashboard/referrals/', label: 'Team', icon: Users },
            { href: '/dashboard/withdraw/', label: 'Wallet', icon: DollarSign },
            { onClick: () => setMobileOpen(true), label: 'Menu', icon: Menu },
        ]
    }

    const bottomNavItems = getBottomNavItems()

    return (
        <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#0a0f1e' }}>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r"
                style={{ background: '#0d1530', borderColor: '#1e3a5f' }}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
                    <aside className="relative w-[280px] h-full flex flex-col border-r shadow-2xl animate-fade-in-right"
                        style={{ background: '#0d1530', borderColor: '#1e3a5f' }}>
                        <SidebarContent onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Topbar */}
                <header className="flex items-center justify-between px-5 h-16 border-b flex-shrink-0 sticky top-0 z-30"
                    style={{ background: 'rgba(13, 21, 48, 0.8)', borderColor: '#1e3a5f', backdropFilter: 'blur(12px)' }}>
                    <div className="flex items-center gap-3">
                        <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5" style={{ color: '#0ea5e9' }}
                            onClick={() => setMobileOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Status</span>
                            <span className="font-bold text-sm" style={{ color: '#e2e8f0' }}>
                                {profile.status === 'ACTIVE' ? (
                                    <span className="flex items-center gap-1.5" style={{ color: '#10b981' }}>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Active Account
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        Checking...
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {profile.referral_code && (
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">ID Code</span>
                                <span className="text-xs font-mono font-bold text-emerald-400">{profile.referral_code}</span>
                            </div>
                        )}
                        <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
                        <NotificationBell />
                        <div className="w-9 h-9 rounded-full ring-2 ring-emerald-500/20 flex items-center justify-center text-xs font-bold shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #10b981)', color: 'white' }}>
                            {profile.full_name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-5 sm:p-8 pb-32 sm:pb-8">
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 rounded-2xl border bg-slate-900/90 backdrop-blur-xl z-40 px-6 flex items-center justify-between shadow-2xl"
                    style={{ borderColor: 'rgba(30, 58, 95, 0.8)', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)' }}>
                    {bottomNavItems.map((item, i) => (
                        item.onClick ? (
                            <button key={i} onClick={item.onClick} className="flex flex-col items-center gap-1 text-slate-400">
                                <item.icon size={22} />
                                <span className="text-[0.6rem] font-semibold">{item.label}</span>
                            </button>
                        ) : (
                            <Link key={i} href={item.href || '#'} className={cn(
                                "flex flex-col items-center gap-1 transition-colors",
                                pathname === item.href ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
                            )}>
                                <item.icon size={22} className={pathname === item.href ? "scale-110 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" : ""} />
                                <span className="text-[0.6rem] font-semibold">{item.label}</span>
                            </Link>
                        )
                    ))}
                </nav>
            </div>
        </div>
    )
}
