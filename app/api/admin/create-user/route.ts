import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Helper to get admin client lazily
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!url || !key) {
        throw new Error('Missing Supabase Service Role configuration')
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

export async function POST(request: Request) {
    try {
        const { email, password, role = 'customer' } = await request.json()

        // 1. Verify the requester is an ADMIN
        const supabaseAdmin = getSupabaseAdmin()

        // We check the cookie to get the current user session
        // Note: For a more robust check in a real app, use @supabase/auth-helpers-nextjs or similar
        const cookieStore = await cookies()
        const token = cookieStore.get('sb-access-token')?.value || request.headers.get('Authorization')?.split('Bearer ')[1]

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 })
        }

        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !requester) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 })
        }

        // Check profile role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
        }

        // 2. Create the user in Auth with metadata role
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role } // This is picked up by our updated SQL trigger
        })

        if (createError) throw createError

        return NextResponse.json({ user: userData.user })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
