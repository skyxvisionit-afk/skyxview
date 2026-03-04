export interface Course {
    slug: string;
    icon: string;
    title: string;
    desc: string;
    detailedDesc: string;
    duration: string;
    teachers: { name: string; avatar: string; role: string }[];
    syllabus: { title: string; topics: string[] }[];
    color: string;
    thumbnail: string;
    status: 'Active' | 'Upcoming';
    price?: string;
}

export const courses: Course[] = [
    {
        slug: 'data-entry',
        icon: '📊',
        title: 'Data Entry',
        desc: '700 BDT per project + bonus opportunities',
        detailedDesc: 'Master the art of professional data entry. This course covers everything from basic spreadsheet management to advanced database entry and quality assurance. Learn to handle high-volume data with precision and speed.',
        duration: '6 Weeks',
        teachers: [
            { name: 'Ariful Islam', avatar: 'https://i.pravatar.cc/150?u=1', role: 'Head Trainer' },
            { name: 'Sumi Akter', avatar: 'https://i.pravatar.cc/150?u=4', role: 'Data Specialist' }
        ],
        syllabus: [
            { title: 'Foundations', topics: ['Introduction to Data Systems', 'Touch Typing Mastery', 'Excel Basics'] },
            { title: 'Advanced Methods', topics: ['Database Management', 'Data Extraction Techniques', 'Error Scanning'] },
            { title: 'Project Management', topics: ['Handling Bulk Tasks', 'Client Communication', 'Report Generation'] }
        ],
        color: 'from-blue-500/20 to-blue-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'form-fillup',
        icon: '📝',
        title: 'Form Fillup',
        desc: '150 BDT per project, flexible timing',
        detailedDesc: 'A comprehensive guide to digital form processing. Learn how to accurately fill out surveys, applications, and business forms for global clients. Ideal for beginners wanting a steady income flow.',
        duration: '4 Weeks',
        teachers: [
            { name: 'Mitu Islam', avatar: 'https://i.pravatar.cc/150?u=6', role: 'Form Expert' }
        ],
        syllabus: [
            { title: 'Survey Basics', topics: ['Understanding Form Types', 'Captcha Handling', 'VPN Usage basics'] },
            { title: 'Efficiency', topics: ['Browser Extensions', 'Auto-fill configurations', 'Time Management'] }
        ],
        color: 'from-green-500/20 to-green-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'photo-editing',
        icon: '🎨',
        title: 'Photo Editing',
        desc: 'Client-rate based, creative work',
        detailedDesc: 'Become a professional photo editor using industry-standard tools like Adobe Photoshop and Lightroom. Focus on e-commerce product editing, background removal, and high-end retouching.',
        duration: '8 Weeks',
        teachers: [
            { name: 'Nusrat Jahan', avatar: 'https://i.pravatar.cc/150?u=2', role: 'Senior Designer' }
        ],
        syllabus: [
            { title: 'Software Mastery', topics: ['Photoshop Interface', 'Selection Tools', 'Layers & Masks'] },
            { title: 'Professional Retouching', topics: ['Skin Retouching', 'Color Grading', 'Lighting correction'] },
            { title: 'E-commerce Workflow', topics: ['Batch Processing', 'Shadow Creation', 'Path Clipping'] }
        ],
        color: 'from-purple-500/20 to-purple-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'video-editing',
        icon: '🎬',
        title: 'Video Editing',
        desc: 'Premium client rates for skilled editors',
        detailedDesc: 'Learn modern video storytelling. From short-form reels/TikToks to professional YouTube content and corporate videos. Master Premiere Pro and CapCut for desktop.',
        duration: '10 Weeks',
        teachers: [
            { name: 'Tanvir Hasan', avatar: 'https://i.pravatar.cc/150?u=5', role: 'Video Production Lead' }
        ],
        syllabus: [
            { title: 'The Edit', topics: ['Selection & Cutting', 'Transitions', 'Music Syncing'] },
            { title: 'Visual Effects', topics: ['Color Correction', 'Motion Graphics', 'Green Screen'] },
            { title: 'Encoding', topics: ['Export Settings', 'Aspect Ratios', 'Short-form Optimization'] }
        ],
        color: 'from-red-500/20 to-red-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'graphic-design',
        icon: '✏️',
        title: 'Graphic Design',
        desc: '100 BDT per design, unlimited projects',
        detailedDesc: 'Master the fundamentals of visual communication. Learn to create compelling logos, social media banners, and marketing materials that sell. Covers Canva, Illustrator, and Design Theory.',
        duration: '8 Weeks',
        teachers: [
            { name: 'Nusrat Jahan', avatar: 'https://i.pravatar.cc/150?u=2', role: 'Lead Instructor' }
        ],
        syllabus: [
            { title: 'Design Theory', topics: ['Color Psychology', 'Typography', 'Hierarchy'] },
            { title: 'Tools', topics: ['Adobe Illustrator', 'Canva for Business', 'Brand Guidelines'] },
            { title: 'Portfolio', topics: ['Logo Design', 'Social Media Kit', 'Client Presentation'] }
        ],
        color: 'from-yellow-500/20 to-yellow-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'pen-packaging',
        icon: '🖊️',
        title: 'Pen Packaging',
        desc: '1 BDT per piece, high volume available',
        detailedDesc: 'Practical training for offline packaging jobs. Learn SkyX standards for assembly, quality check, and bulk packaging of high-quality writing instruments.',
        duration: '1 Week',
        teachers: [
            { name: 'Rahat Ahmed', avatar: 'https://i.pravatar.cc/150?u=3', role: 'Operations Manager' }
        ],
        syllabus: [
            { title: 'Assembly', topics: ['Component Checking', 'Manual Assembly', 'Safety Standards'] },
            { title: 'Logistics', topics: ['Stock Management', 'Packaging Labels', 'Reporting'] }
        ],
        color: 'from-cyan-500/20 to-cyan-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'soap-packaging',
        icon: '🧴',
        title: 'Soap Packaging',
        desc: '3 BDT per piece, consistent supply',
        detailedDesc: 'Step-by-step training for premium soap packaging. Understand branding requirements, safe handling, and high-efficiency packing layouts.',
        duration: '1 Week',
        teachers: [
            { name: 'Rahat Ahmed', avatar: 'https://i.pravatar.cc/150?u=3', role: 'Operations Manager' }
        ],
        syllabus: [
            { title: 'Preparation', topics: ['Hygiene Standards', 'Wrapper Application', 'Seal Integrity'] },
            { title: 'Quality Control', topics: ['Visual Inspection', 'Weight Verification', 'Batch Marking'] }
        ],
        color: 'from-pink-500/20 to-pink-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'social-media',
        icon: '📱',
        title: 'Social Media Management',
        desc: 'Manage accounts & grow brand presence',
        detailedDesc: 'Learn how to manage and grow digital brands. This course covers content scheduling, community engagement, and basic analytics across Facebook, Instagram, and LinkedIn.',
        duration: '6 Weeks',
        teachers: [
            { name: 'Sumi Akter', avatar: 'https://i.pravatar.cc/150?u=4', role: 'Growth Strategist' }
        ],
        syllabus: [
            { title: 'Social Strategy', topics: ['Content Pillars', 'Scheduling Tools', 'Audience Personas'] },
            { title: 'Growth Hacks', topics: ['Hashtag Optimization', 'Engagement Boosters', 'Ad Basics'] },
            { title: 'Reporting', topics: ['Insight Analysis', 'Client Reporting', 'KPI Tracking'] }
        ],
        color: 'from-indigo-500/20 to-indigo-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
    {
        slug: 'copy-paste',
        icon: '📋',
        title: 'Copy Paste Mastery',
        desc: 'Simple tasks, beginner-friendly work',
        detailedDesc: 'The simplest way to start your online journey. Learn efficient ways to handle data migration, web research, and high-speed copy-paste tasks with high accuracy.',
        duration: '2 Weeks',
        teachers: [
            { name: 'Mitu Islam', avatar: 'https://i.pravatar.cc/150?u=6', role: 'Support Trainer' }
        ],
        syllabus: [
            { title: 'Digital Literacy', topics: ['Shortcut Keys', 'Browser Multi-tasking', 'Data Accuracy'] },
            { title: 'Workflow', topics: ['Researching Sources', 'Cleansing Text', 'Final Submission'] }
        ],
        color: 'from-orange-500/20 to-orange-600/10',
        thumbnail: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=800&q=80',
        status: 'Active'
    },
];
