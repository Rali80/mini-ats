DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- This assumes the user 'admin@ats.com' has been created in Supabase Auth.
    -- If not created yet, this script will still run but won't seed anything.
    
    SELECT id INTO admin_id FROM public.profiles WHERE email = 'admin@ats.com';

    IF admin_id IS NULL THEN
        RAISE NOTICE 'User admin@ats.com not found in profiles. Please register/create the user first.';
    ELSE
        -- Promote to admin
        UPDATE public.profiles SET role = 'admin' WHERE id = admin_id;
        RAISE NOTICE 'User admin@ats.com promoted to admin (ID: %)', admin_id;

        -- Create Sample Jobs under the Admin (so they are visible)
        INSERT INTO public.jobs (id, customer_id, title, description, location, employment_type, status)
        VALUES 
          (gen_random_uuid(), admin_id, 'Senior Frontend Engineer', 'Seeking React/Next.js expert for our core team.', 'Remote', 'full_time', 'active'),
          (gen_random_uuid(), admin_id, 'Back-end Architect', 'Design scalable microservices with Node.js.', 'New York', 'full_time', 'active'),
          (gen_random_uuid(), admin_id, 'UX Designer', 'Lead product design for our mobile apps.', 'Hybrid', 'contract', 'active');

        -- Create Sample Candidates for these Jobs
        DECLARE
            job_record RECORD;
        BEGIN
            FOR job_record IN (SELECT id FROM public.jobs WHERE customer_id = admin_id) LOOP
                -- Candidate 1: Applied
                INSERT INTO public.candidates (customer_id, job_id, full_name, name, email, stage, rating, current_title)
                VALUES (admin_id, job_record.id, 'John Doe', 'John Doe', 'john.' || encode(gen_random_bytes(4), 'hex') || '@test.com', 'applied', 4, 'Fullstack Dev');

                -- Candidate 2: Interview
                INSERT INTO public.candidates (customer_id, job_id, full_name, name, email, stage, rating, current_title)
                VALUES (admin_id, job_record.id, 'Jane Smith', 'Jane Smith', 'jane.' || encode(gen_random_bytes(4), 'hex') || '@test.com', 'interview', 5, 'Senior Engineer');

                -- Candidate 3: Rejected
                INSERT INTO public.candidates (customer_id, job_id, full_name, name, email, stage, rating, current_title)
                VALUES (admin_id, job_record.id, 'Michael Scott', 'Michael Scott', 'michael.' || encode(gen_random_bytes(4), 'hex') || '@test.com', 'rejected', 2, 'Project Manager');
                
                 -- Candidate 4: Offer
                INSERT INTO public.candidates (customer_id, job_id, full_name, name, email, stage, rating, current_title)
                VALUES (admin_id, job_record.id, 'Pam Beesly', 'Pam Beesly', 'pam.' || encode(gen_random_bytes(4), 'hex') || '@test.com', 'offer', 5, 'Graphic Designer');
            END LOOP;
        END;

        RAISE NOTICE 'Seeding completed successfully for admin@ats.com';
    END IF;
END $$;
