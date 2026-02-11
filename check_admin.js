
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAdmin() {
    const email = 'admin@ats.com'
    const password = 'Test123'

    console.log(`Checking if admin user can log in: ${email}...`)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (signInError) {
        console.error('Sign in error:', signInError.message)
    } else {
        console.log('Sign in successful for ID:', signInData.user?.id)

        // Check profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user?.id)
            .single()

        if (profileError) {
            console.error('Profile fetch error:', profileError.message)
        } else {
            console.log('Profile found:', profile)
        }
    }
}

checkAdmin()
