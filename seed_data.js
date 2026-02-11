
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
    console.error('This key is required to create actual user accounts programmatically.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const CUSTOMERS = [
    { email: 'tech@startup.com', name: 'Tech Solutions Inc' },
    { email: 'hr@global.com', name: 'Global Corp' },
    { email: 'talent@creative.com', name: 'Creative Agency' }
]

const JOBS_TEMPLATES = [
    { title: 'Senior Frontend Engineer', location: 'Remote', type: 'full_time', description: 'React, Next.js, and TypeScript expert needed.' },
    { title: 'Product Manager', location: 'New York', type: 'full_time', description: 'Experienced PM for scaling SaaS products.' },
    { title: 'UX Designer', location: 'Hybrid', type: 'contract', description: 'Figma pro for mobile design projects.' },
    { title: 'Back-end Architect', location: 'San Francisco', type: 'full_time', description: 'Scalable systems with Go and Node.js.' }
]

const CANDIDATE_NAMES = [
    'John Doe', 'Jane Smith', 'Michael Jordan', 'Sarah Connor', 'Alan Turing',
    'Grace Hopper', 'Steve Wozniak', 'Ada Lovelace', 'Bill Gates', 'Elon Musk'
]

async function seed() {
    console.log('🚀 Starting Seeding Process...')

    for (const cust of CUSTOMERS) {
        console.log(`\nCreating Customer: ${cust.email}...`)

        // 1. Create User in Auth
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: cust.email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { role: 'customer' }
        })

        if (userError && !userError.message.includes('already registered')) {
            console.error(`Error creating user ${cust.email}:`, userError.message)
            continue
        }

        const userId = userData?.user?.id || (await findUserIdByEmail(cust.email))
        if (!userId) continue

        console.log(`User ID: ${userId}`)

        // 2. Clear existing jobs/candidates for this user (Optional)
        // await supabase.from('jobs').delete().eq('customer_id', userId)

        // 3. Create Jobs
        for (let i = 0; i < 2; i++) {
            const jobTemplate = JOBS_TEMPLATES[Math.floor(Math.random() * JOBS_TEMPLATES.length)]
            console.log(`  Creating Job: ${jobTemplate.title}`)

            const { data: jobData, error: jobError } = await supabase.from('jobs').insert({
                customer_id: userId,
                title: jobTemplate.title,
                description: jobTemplate.description,
                location: jobTemplate.location,
                employment_type: jobTemplate.type,
                status: 'active'
            }).select().single()

            if (jobError) {
                console.error('    Job Error:', jobError.message)
                continue
            }

            const jobId = jobData.id

            // 4. Create Candidates for this Job
            for (let j = 0; j < 3; j++) {
                const name = CANDIDATE_NAMES[Math.floor(Math.random() * CANDIDATE_NAMES.length)]
                const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']
                const stage = stages[Math.floor(Math.random() * stages.length)]

                console.log(`    Adding Candidate: ${name} (${stage})`)

                const { error: candError } = await supabase.from('candidates').insert({
                    customer_id: userId,
                    job_id: jobId,
                    full_name: name,
                    name: name, // support legacy
                    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
                    stage: stage,
                    current_title: jobTemplate.title.split(' ')[0] + ' Dev',
                    rating: Math.floor(Math.random() * 5) + 1,
                    notes: 'Excellent candidate profile with strong background.'
                })

                if (candError) console.error('      Candidate Error:', candError.message)
            }
        }
    }

    console.log('\n✅ Seeding Complete!')
}

async function findUserIdByEmail(email) {
    const { data } = await supabase.from('profiles').select('id').eq('email', email).single()
    return data?.id
}

seed()
