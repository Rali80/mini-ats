import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const type = searchParams.get('type') || 'candidates'
        const limit = parseInt(searchParams.get('limit') || '10')

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] })
        }

        const searchPattern = `%${query}%`

        if (type === 'candidates') {
            // Search candidates
            const { data: candidates, error } = await supabase
                .from('candidates')
                .select('id, full_name, email, current_title, job:jobs(title)')
                .eq('customer_id', user.id)
                .or(
                    `full_name.ilike.${searchPattern},` +
                    `email.ilike.${searchPattern},` +
                    `current_title.ilike.${searchPattern},` +
                    `current_company.ilike.${searchPattern}`
                )
                .limit(limit)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 })
            }

            return NextResponse.json({
                results: candidates?.map(c => ({
                    id: c.id,
                    name: c.full_name,
                    email: c.email,
                    type: 'candidate',
                    subtitle: c.current_title || (c.job as any)?.title || '',
                })) || []
            })
        }

        if (type === 'jobs') {
            // Search jobs
            const { data: jobs, error } = await supabase
                .from('jobs')
                .select('id, title, status')
                .eq('customer_id', user.id)
                .eq('status', 'active')
                .ilike('title', searchPattern)
                .limit(limit)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 })
            }

            return NextResponse.json({
                results: jobs?.map(j => ({
                    id: j.id,
                    name: j.title,
                    type: 'job',
                    subtitle: j.status,
                })) || []
            })
        }

        // Search both
        const [candidatesResult, jobsResult] = await Promise.all([
            supabase
                .from('candidates')
                .select('id, full_name, email, current_title')
                .eq('customer_id', user.id)
                .ilike('full_name', searchPattern)
                .limit(5),
            supabase
                .from('jobs')
                .select('id, title, status')
                .eq('customer_id', user.id)
                .ilike('title', searchPattern)
                .limit(5)
        ])

        const results = [
            ...(candidatesResult.data?.map(c => ({
                id: c.id,
                name: c.full_name,
                email: c.email,
                type: 'candidate',
                subtitle: c.current_title || '',
            })) || []),
            ...(jobsResult.data?.map(j => ({
                id: j.id,
                name: j.title,
                type: 'job',
                subtitle: j.status,
            })) || [])
        ]

        return NextResponse.json({ results })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
