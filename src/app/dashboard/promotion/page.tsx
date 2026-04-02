import { ArrowRight, Briefcase, Code, GraduationCap, Megaphone, ShieldCheck, Users, Star, MonitorPlay } from 'lucide-react'
import Link from 'next/link'

const JOB_ROLES = [
    {
        id: 'MODERATOR',
        title: 'Moderator',
        icon: ShieldCheck,
        color: '#f43f5e',
        description: 'Manage community groups, enforce rules, and assist members with daily issues.',
        requirements: ['Minimum 1 month active', 'Good communication skills', 'Neutral and fair judgment'],
    },
    {
        id: 'TEAM_TRAINER',
        title: 'Trainer',
        icon: GraduationCap,
        color: '#10b981',
        description: 'Provide live training, guide new members, and help them achieve their goals.',
        requirements: ['Excellent presentation skills', 'Deep knowledge of platform', 'Patience and leadership'],
    },
    {
        id: 'TEAM_LEADER',
        title: 'Team Leader',
        icon: Users,
        color: '#a855f7',
        description: 'Manage multiple trainers, oversee team growth, and earn leadership commissions.',
        requirements: ['Proven track record as Trainer', 'Strong team-building skills', 'High monthly engagement'],
    },
    {
        id: 'SENIOR_LEADER',
        title: 'Senior Team Leader',
        icon: Star,
        color: '#eab308',
        description: 'Directly work with the administration, set targets, and manage large-scale groups.',
        requirements: ['1+ year as Team Leader', 'Consistent top performer', 'Strategic planning ability'],
    },
    {
        id: 'TEACHER',
        title: 'Teacher',
        icon: MonitorPlay,
        color: '#3b82f6',
        description: 'Host premium educational classes, provide specialized skills training.',
        requirements: ['Professional real-world experience', 'Ability to create syllabuses', 'Expertise in chosen subject'],
    },
    {
        id: 'MANAGER',
        title: 'System Manager',
        icon: Briefcase,
        color: '#f97316',
        description: 'Handle administrative tasks, review forms, and process financial requests.',
        requirements: ['High trust factor', 'Strong analytical skills', 'Available 6+ hours daily'],
    },
    {
        id: 'JUNIOR_DEVELOPER',
        title: 'Junior Developer',
        icon: Code,
        color: '#06b6d4',
        description: 'Assist in platform maintenance, bug fixes, and basic feature updates.',
        requirements: ['Basic HTML/CSS/JS', 'Eagerness to learn', 'Problem-solving mindset'],
    },
    {
        id: 'DEVELOPER',
        title: 'Senior Developer',
        icon: Code,
        color: '#8b5cf6',
        description: 'Architect new systems, manage the database, and write core application logic.',
        requirements: ['Proficient in React & Node', 'Database management skills', '2+ years experience'],
    },
    {
        id: 'SPONSOR',
        title: 'Brand Sponsor',
        icon: Megaphone,
        color: '#14b8a6',
        description: 'Promote our platform on a massive scale through social media channels.',
        requirements: ['100k+ Followers on YouTube/TikTok', 'High engagement rate', 'Professional brand image'],
    },
]

export default function PromotionPage() {
    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden glass-card p-8 md:p-12 mb-8 border-indigo-500/30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                            Career Opportunities
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                            Elevate Your Journey. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                Apply for a Promotion!
                            </span>
                        </h1>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            Are you dedicated, hardworking, and ready to take on more responsibilities? Browse our open positions below and apply to become a core part of the management team.
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 inline-flex">
                            <ShieldCheck size={16} />
                            <strong>Note:</strong> You must strictly adhere to all platform rules to be considered.
                        </div>
                    </div>
                    
                    <div className="hidden md:flex w-32 h-32 rounded-full border-4 border-indigo-500/30 bg-slate-900 items-center justify-center relative shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                        <Briefcase size={48} className="text-indigo-400" />
                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                            Hiring
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Listings */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {JOB_ROLES.map((role) => (
                    <div key={role.id} className="glass-card flex flex-col h-full border border-slate-800 hover:border-slate-600 transition-colors group">
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: `${role.color}15`, border: `1px solid ${role.color}30` }}>
                                <role.icon size={24} style={{ color: role.color }} />
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                            <p className="text-slate-400 text-sm mb-5 leading-relaxed flex-1">
                                {role.description}
                            </p>
                            
                            <div className="space-y-2 mb-6">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">Requirements</p>
                                {role.requirements.map((req, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: role.color }}></div>
                                        <span>{req}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <Link 
                                href={`/dashboard/promotion/apply?role=${role.id}&title=${encodeURIComponent(role.title)}`}
                                className="w-full mt-auto block text-center font-bold text-sm py-3 rounded-xl transition-all"
                                style={{ background: `${role.color}15`, color: role.color, border: `1px solid ${role.color}30` }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = `${role.color}25` }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = `${role.color}15` }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Apply Now <ArrowRight size={16} />
                                </span>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
