export type Role = 'admin' | 'customer'

export interface Profile {
    id: string
    email: string
    role: Role
    full_name?: string
    company_name?: string
    avatar_url?: string
    created_at: string
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

