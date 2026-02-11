// Enhanced types for the Mini ATS system

export type Role = 'admin' | 'customer'

export interface Profile {
    id: string
    email: string
    role: Role
    full_name?: string
    company_name?: string
    avatar_url?: string
    created_at: string
    updated_at?: string
}

export interface Job {
    id: string
    customer_id: string
    title: string
    description: string | null
    location?: string
    employment_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
    status: 'active' | 'closed' | 'draft'
    created_at: string
    updated_at?: string
}

export type CandidateStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export interface Candidate {
    id: string
    job_id: string
    customer_id: string
    full_name: string
    email: string
    phone?: string
    linkedin_url?: string | null
    portfolio_url?: string | null
    resume_url?: string | null
    stage: CandidateStage
    location?: string
    current_company?: string
    current_title?: string
    years_of_experience?: number
    skills?: string[]
    notes?: string | null
    rating?: number
    created_at: string
    updated_at?: string
    job?: Job // Joined data
}

export interface CandidateHistory {
    id: string
    candidate_id: string
    changed_by: string
    from_stage: CandidateStage | null
    to_stage: CandidateStage | null
    notes?: string
    created_at: string
}

// New types for enhanced features

export type NotificationType =
    | 'candidate_applied'
    | 'stage_changed'
    | 'interview_scheduled'
    | 'interview_reminder'
    | 'offer_sent'
    | 'candidate_hired'
    | 'candidate_rejected'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    message: string
    read: boolean
    data?: Record<string, any>
    created_at: string
    read_at?: string
}

export interface Interview {
    id: string
    candidate_id: string
    job_id: string
    customer_id: string
    scheduled_at: string
    duration_minutes: number
    type: 'phone' | 'video' | 'onsite' | 'technical'
    location?: string
    meeting_link?: string
    interviewers: string[] // Array of user IDs
    notes?: string
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
    feedback?: string
    created_at: string
    updated_at?: string
    candidate?: Candidate
    job?: Job
}

// Interview slot for availability
export interface InterviewSlot {
    time: string
    available: boolean
}

// Stage configuration for customizable colors
export interface StageConfig {
    stage: CandidateStage
    label: string
    color: string
    bgColor: string
    textColor: string
}

// Environment configuration for stage colors
export interface StageColorConfig {
    applied: { bg: string; text: string }
    screening: { bg: string; text: string }
    interview: { bg: string; text: string }
    offer: { bg: string; text: string }
    hired: { bg: string; text: string }
    rejected: { bg: string; text: string }
}

// Search and filter types
export interface SearchFilters {
    searchTerm?: string
    jobFilter?: string
    stageFilter?: CandidateStage[]
    ratingMin?: number
    ratingMax?: number
    dateFrom?: string
    dateTo?: string
}

// API Response types
export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// Email template types
export interface EmailTemplate {
    id: string
    name: string
    subject: string
    body: string
    type: NotificationType
    variables: string[]
}
