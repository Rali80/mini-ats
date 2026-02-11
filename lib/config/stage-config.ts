import { CandidateStage, StageColorConfig } from '@/types/enhanced'

// Default stage colors - can be overridden via environment variables
const defaultStageColors: StageColorConfig = {
    applied: {
        bg: 'bg-blue-500',
        text: 'text-white'
    },
    screening: {
        bg: 'bg-purple-500',
        text: 'text-white'
    },
    interview: {
        bg: 'bg-amber-500',
        text: 'text-white'
    },
    offer: {
        bg: 'bg-pink-500',
        text: 'text-white'
    },
    hired: {
        bg: 'bg-emerald-500',
        text: 'text-white'
    },
    rejected: {
        bg: 'bg-rose-500',
        text: 'text-white'
    }
}

// Environment variable overrides
const envStageColors: Partial<StageColorConfig> = {
    applied: {
        bg: process.env.NEXT_PUBLIC_STAGE_APPLIED_BG || defaultStageColors.applied.bg,
        text: process.env.NEXT_PUBLIC_STAGE_APPLIED_TEXT || defaultStageColors.applied.text,
    },
    screening: {
        bg: process.env.NEXT_PUBLIC_STAGE_SCREENING_BG || defaultStageColors.screening.bg,
        text: process.env.NEXT_PUBLIC_STAGE_SCREENING_TEXT || defaultStageColors.screening.text,
    },
    interview: {
        bg: process.env.NEXT_PUBLIC_STAGE_INTERVIEW_BG || defaultStageColors.interview.bg,
        text: process.env.NEXT_PUBLIC_STAGE_INTERVIEW_TEXT || defaultStageColors.interview.text,
    },
    offer: {
        bg: process.env.NEXT_PUBLIC_STAGE_OFFER_BG || defaultStageColors.offer.bg,
        text: process.env.NEXT_PUBLIC_STAGE_OFFER_TEXT || defaultStageColors.offer.text,
    },
    hired: {
        bg: process.env.NEXT_PUBLIC_STAGE_HIRED_BG || defaultStageColors.hired.bg,
        text: process.env.NEXT_PUBLIC_STAGE_HIRED_TEXT || defaultStageColors.hired.text,
    },
    rejected: {
        bg: process.env.NEXT_PUBLIC_STAGE_REJECTED_BG || defaultStageColors.rejected.bg,
        text: process.env.NEXT_PUBLIC_STAGE_REJECTED_TEXT || defaultStageColors.rejected.text,
    },
}

export function getStageColor(stage: CandidateStage): { bg: string; text: string } {
    return envStageColors[stage] || defaultStageColors[stage]
}

export function getStageLabel(stage: CandidateStage): string {
    const labels: Record<CandidateStage, string> = {
        applied: 'New Applied',
        screening: 'Screening',
        interview: 'Interviews',
        offer: 'Offer Phase',
        hired: 'Onboarded',
        rejected: 'Archived'
    }
    return labels[stage] || stage
}

// Get CSS custom properties for stage colors
export function getStageColorCssVars(): Record<string, string> {
    return {
        '--stage-applied-bg': process.env.NEXT_PUBLIC_STAGE_APPLIED_BG || '#3b82f6',
        '--stage-screening-bg': process.env.NEXT_PUBLIC_STAGE_SCREENING_BG || '#8b5cf6',
        '--stage-interview-bg': process.env.NEXT_PUBLIC_STAGE_INTERVIEW_BG || '#f59e0b',
        '--stage-offer-bg': process.env.NEXT_PUBLIC_STAGE_OFFER_BG || '#ec4899',
        '--stage-hired-bg': process.env.NEXT_PUBLIC_STAGE_HIRED_BG || '#10b981',
        '--stage-rejected-bg': process.env.NEXT_PUBLIC_STAGE_REJECTED_BG || '#f43f5e',
    }
}

// Stage order configuration
export const STAGE_ORDER: CandidateStage[] = ['applied', 'screening', 'interview', 'offer', 'hired']

// Configurable stage order via environment
export function getStageOrder(): CandidateStage[] {
    const envOrder = process.env.NEXT_PUBLIC_STAGE_ORDER
    if (envOrder) {
        const stages = envOrder.split(',') as CandidateStage[]
        // Validate stages
        const validStages = stages.filter(s => STAGE_ORDER.includes(s))
        if (validStages.length > 0) {
            return validStages
        }
    }
    return STAGE_ORDER
}
