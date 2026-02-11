
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAdmins() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')

    if (error) {
        console.error('Error fetching admins:', error.message)
    } else {
        console.log('Admin users found:', data)
    }
}

checkAdmins()
