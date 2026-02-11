'use client'

import { createClient } from '@/lib/supabase/client'
import { Candidate, SearchFilters } from '@/types/enhanced'

export interface FullTextSearchResult {
    candidates: Candidate[]
    total: number
    facets: {
        byJob: Record<string, number>
        byStage: Record<string, number>
        byRating: Record<string, number>
    }
}

export class SearchService {
    private supabase = createClient()

    /**
     * Full-text search for candidates using PostgreSQL text search
     * Searches across: full_name, email, current_title, current_company, location, skills, notes
     */
    async searchCandidates(
        userId: string,
        filters: SearchFilters,
        page = 1,
        pageSize = 20
    ): Promise<FullTextSearchResult> {
        const { searchTerm, jobFilter, stageFilter, ratingMin, ratingMax, dateFrom, dateTo } = filters

        let query = this.supabase
            .from('candidates')
            .select(`
                *,
                job:jobs(id, title)
            `, { count: 'exact' })
            .eq('customer_id', userId)

        // Apply full-text search if search term is provided
        if (searchTerm && searchTerm.trim()) {
            const searchPattern = `%${searchTerm.trim()}%`
            query = query.or(
                `full_name.ilike.${searchPattern},` +
                `email.ilike.${searchPattern},` +
                `current_title.ilike.${searchPattern},` +
                `current_company.ilike.${searchPattern},` +
                `location.ilike.${searchPattern},` +
                `skills.cs.{${searchTerm.toLowerCase()}},` +
                `notes.ilike.${searchPattern}`
            )
        }

        // Apply job filter
        if (jobFilter && jobFilter !== 'all') {
            query = query.eq('job_id', jobFilter)
        }

        // Apply stage filter
        if (stageFilter && stageFilter.length > 0) {
            query = query.in('stage', stageFilter)
        }

        // Apply rating filters
        if (ratingMin !== undefined) {
            query = query.gte('rating', ratingMin)
        }
        if (ratingMax !== undefined) {
            query = query.lte('rating', ratingMax)
        }

        // Apply date filters
        if (dateFrom) {
            query = query.gte('created_at', dateFrom)
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo)
        }

        // Apply pagination
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query
            .order('created_at', { ascending: false })
            .range(from, to)

        const { data, error, count } = await query

        if (error) {
            console.error('Error searching candidates:', error)
            throw error
        }

        // Get facets for filtering UI
        const facets = await this.getSearchFacets(userId, searchTerm)

        return {
            candidates: (data as unknown as Candidate[]) || [],
            total: count || 0,
            facets
        }
    }

    /**
     * Get aggregated facets for the search results
     */
    private async getSearchFacets(
        userId: string,
        searchTerm?: string
    ): Promise<FullTextSearchResult['facets']> {
        // Base query
        let baseQuery = this.supabase
            .from('candidates')
            .select('stage, rating, job:jobs(title)', { count: 'exact' })
            .eq('customer_id', userId)

        if (searchTerm && searchTerm.trim()) {
            const searchPattern = `%${searchTerm.trim()}%`
            baseQuery = baseQuery.or(
                `full_name.ilike.${searchPattern},` +
                `email.ilike.${searchPattern},` +
                `current_title.ilike.${searchPattern}`
            )
        }

        const { data } = await baseQuery

        // Count by job
        const byJob: Record<string, number> = {}
        // Count by stage
        const byStage: Record<string, number> = {}
        // Count by rating
        const byRating: Record<string, number> = {}

        data?.forEach(item => {
            // Count by job
            const jobTitle = (item.job as any)?.title || 'Unknown'
            byJob[jobTitle] = (byJob[jobTitle] || 0) + 1

            // Count by stage
            byStage[item.stage] = (byStage[item.stage] || 0) + 1

            // Count by rating
            const rating = item.rating || 0
            const ratingKey = rating === 0 ? 'Unrated' : `${rating}+ stars`
            byRating[ratingKey] = (byRating[ratingKey] || 0) + 1
        })

        return { byJob, byStage, byRating }
    }

    /**
     * Get search suggestions for autocomplete
     */
    async getSearchSuggestions(
        userId: string,
        query: string,
        limit = 5
    ): Promise<{ name: string; email: string; type: 'candidate' | 'job' }[]> {
        if (!query || query.trim().length < 2) {
            return []
        }

        const searchPattern = `%${query.trim()}%`

        // Get matching candidates
        const { data: candidates } = await this.supabase
            .from('candidates')
            .select('full_name, email')
            .eq('customer_id', userId)
            .ilike('full_name', searchPattern)
            .limit(limit)

        // Get matching jobs
        const { data: jobs } = await this.supabase
            .from('jobs')
            .select('title')
            .eq('customer_id', userId)
            .eq('status', 'active')
            .ilike('title', searchPattern)
            .limit(limit)

        const suggestions: { name: string; email: string; type: 'candidate' | 'job' }[] = []

        candidates?.forEach(c => {
            suggestions.push({ name: c.full_name, email: c.email, type: 'candidate' })
        })

        jobs?.forEach(j => {
            suggestions.push({ name: j.title, email: '', type: 'job' })
        })

        return suggestions.slice(0, limit)
    }

    /**
     * Advanced search with multiple criteria
     */
    async advancedSearch(
        userId: string,
        criteria: {
            skills?: string[]
            location?: string
            experienceMin?: number
            experienceMax?: number
            companies?: string[]
            titles?: string[]
        }
    ): Promise<Candidate[]> {
        let query = this.supabase
            .from('candidates')
            .select(`
                *,
                job:jobs(id, title)
            `)
            .eq('customer_id', userId)

        // Search by skills (overlap)
        if (criteria.skills && criteria.skills.length > 0) {
            criteria.skills.forEach(skill => {
                query = query.contains('skills', [skill])
            })
        }

        // Search by location
        if (criteria.location) {
            query = query.ilike('location', `%${criteria.location}%`)
        }

        // Search by experience range
        if (criteria.experienceMin !== undefined) {
            query = query.gte('years_of_experience', criteria.experienceMin)
        }
        if (criteria.experienceMax !== undefined) {
            query = query.lte('years_of_experience', criteria.experienceMax)
        }

        // Search by companies
        if (criteria.companies && criteria.companies.length > 0) {
            query = query.in('current_company', criteria.companies)
        }

        // Search by titles
        if (criteria.titles && criteria.titles.length > 0) {
            query = query.in('current_title', criteria.titles)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('Error in advanced search:', error)
            throw error
        }

        return (data as unknown as Candidate[]) || []
    }
}

export const searchService = new SearchService()
