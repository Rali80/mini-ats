import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Helper to get admin client
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

export async function DELETE(request: Request) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Verify the requester is an admin
        const cookieStore = await cookies()
        const token = cookieStore.get('sb-access-token')?.value ||
            request.headers.get('Authorization')?.split('Bearer ')[1]

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !requester) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 })
        }

        // Check requester role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
        }

        // Prevent self-deletion
        if (userId === requester.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
        }

        // Delete the user from Supabase Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            throw deleteError
        }

        // Delete related profile data
        await supabaseAdmin.from('profiles').delete().eq('id', userId)

        // Note: Related data (jobs, candidates, etc.) will be deleted by RLS CASCADE
        // if configured, or you may need to manually delete them

        return NextResponse.json({ success: true, message: 'User deleted successfully' })
    } catch (error: any) {
        console.error('Delete user error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
