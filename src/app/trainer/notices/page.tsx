import NoticePanelComponent from '@/components/NoticePanelComponent'

export default function TrainerNoticePanelPage() {
    return (
        <div className="space-y-6">
            <div className="page-header">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Trainer Space</p>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                    <span className="gradient-text">Notice</span> Panel
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    Keep track of student announcements and class schedules.
                </p>
            </div>
            <NoticePanelComponent />
        </div>
    )
}
