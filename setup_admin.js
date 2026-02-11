
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupAdmin() {
    const email = 'admin@ats.com'   // New email requested
    const password = 'Test123'      // New password requested

    console.log(`Attempting to setup admin: ${email}...`)

    // 1. Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'admin'
            }
        }
    })

    if (signUpError) {
        if (signUpError.message.includes('already registered')) {
            console.log('User already exists in Auth.')
        } else {
            console.error('Sign up error:', signUpError.message)
            return
        }
    } else {
        console.log('Sign up successful for ID:', signUpData.user?.id)
    }

    console.log('\n--- IMPORTANT STEP ---')
    console.log('If you havent already, please run this SQL in your Supabase Dashboard:')
    console.log(`UPDATE profiles SET role = 'admin' WHERE email = '${email}';`)
    console.log('----------------------')
}

setupAdmin()
