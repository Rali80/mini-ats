import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function setupStorage() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        console.error('Missing environment variables')
        return
    }

    const supabase = createClient(url, key)

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
        console.error('Error listing buckets:', listError)
        return
    }

    const exists = buckets.some(b => b.name === 'resumes')

    if (!exists) {
        console.log('Creating resumes bucket...')
        const { error: createError } = await supabase.storage.createBucket('resumes', {
            public: true,
            allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            fileSizeLimit: 5242880 // 5MB
        })

        if (createError) {
            console.error('Error creating bucket:', createError)
        } else {
            console.log('Resumes bucket created successfully')
        }
    } else {
        console.log('Resumes bucket already exists')
    }
}

setupStorage()
