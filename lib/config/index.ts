// Environment configuration for Mini ATS
// Copy this to .env.local and customize

export const config = {
    // App settings
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Mini ATS',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    // Supabase settings (for client)
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

    // Feature flags
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
    enableInterviews: process.env.NEXT_PUBLIC_ENABLE_INTERVIEWS !== 'false',
    enableSearch: process.env.NEXT_PUBLIC_ENABLE_SEARCH !== 'false',

    // Stage colors configuration
    // Format: NEXT_PUBLIC_STAGE_[STAGE]_BG and NEXT_PUBLIC_STAGE_[STAGE]_TEXT
    // Example: NEXT_PUBLIC_STAGE_APPLIED_BG='#3b82f6'
    stageColors: {
        applied: {
            bg: process.env.NEXT_PUBLIC_STAGE_APPLIED_BG || 'bg-blue-500',
            text: process.env.NEXT_PUBLIC_STAGE_APPLIED_TEXT || 'text-white',
        },
        screening: {
            bg: process.env.NEXT_PUBLIC_STAGE_SCREENING_BG || 'bg-purple-500',
            text: process.env.NEXT_PUBLIC_STAGE_SCREENING_TEXT || 'text-white',
        },
        interview: {
            bg: process.env.NEXT_PUBLIC_STAGE_INTERVIEW_BG || 'bg-amber-500',
            text: process.env.NEXT_PUBLIC_STAGE_INTERVIEW_TEXT || 'text-white',
        },
        offer: {
            bg: process.env.NEXT_PUBLIC_STAGE_OFFER_BG || 'bg-pink-500',
            text: process.env.NEXT_PUBLIC_STAGE_OFFER_TEXT || 'text-white',
        },
        hired: {
            bg: process.env.NEXT_PUBLIC_STAGE_HIRED_BG || 'bg-emerald-500',
            text: process.env.NEXT_PUBLIC_STAGE_HIRED_TEXT || 'text-white',
        },
        rejected: {
            bg: process.env.NEXT_PUBLIC_STAGE_REJECTED_BG || 'bg-rose-500',
            text: process.env.NEXT_PUBLIC_STAGE_REJECTED_TEXT || 'text-white',
        },
    },

    // File upload settings
    fileUpload: {
        maxSizeMB: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '5'),
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        allowedExtensions: ['pdf', 'doc', 'docx'],
    },

    // Interview settings
    interview: {
        defaultDuration: parseInt(process.env.NEXT_PUBLIC_DEFAULT_INTERVIEW_DURATION || '60'),
        minDuration: parseInt(process.env.NEXT_PUBLIC_MIN_INTERVIEW_DURATION || '15'),
        maxDuration: parseInt(process.env.NEXT_PUBLIC_MAX_INTERVIEW_DURATION || '480'),
        workingHours: {
            start: process.env.NEXT_PUBLIC_WORKING_HOURS_START || '09:00',
            end: process.env.NEXT_PUBLIC_WORKING_HOURS_END || '18:00',
        },
    },

    // Search settings
    search: {
        minQueryLength: parseInt(process.env.NEXT_PUBLIC_MIN_SEARCH_LENGTH || '2'),
        maxResults: parseInt(process.env.NEXT_PUBLIC_MAX_SEARCH_RESULTS || '20'),
        debounceMs: parseInt(process.env.NEXT_PUBLIC_SEARCH_DEBOUNCE_MS || '300'),
    },

    // Pagination defaults
    pagination: {
        defaultPageSize: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE || '20'),
        maxPageSize: parseInt(process.env.NEXT_PUBLIC_MAX_PAGE_SIZE || '100'),
    },
}

export default config
