-- Final Schema Unification: Fix Candidate "name" issue and column naming
-- This script ensures the database matches the application's expectations (full_name instead of name, customer_id instead of user_id)

-- 1. Unify 'candidates' table
DO $$
BEGIN
    -- Handle 'name' column (legacy issue)
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'name') THEN
        -- If 'full_name' doesn't exist, rename 'name' to 'full_name'
        IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'full_name') THEN
            ALTER TABLE public.candidates RENAME COLUMN name TO full_name;
        ELSE
            -- Both exist: migrate data and make name nullable
            UPDATE public.candidates SET full_name = name WHERE full_name IS NULL;
            ALTER TABLE public.candidates ALTER COLUMN name DROP NOT NULL;
        END IF;
    END IF;

    -- Handle 'user_id' -> 'customer_id' (legacy issue)
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'user_id') THEN
        IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'customer_id') THEN
            ALTER TABLE public.candidates RENAME COLUMN user_id TO customer_id;
        ELSE
             UPDATE public.candidates SET customer_id = user_id WHERE customer_id IS NULL;
             ALTER TABLE public.candidates ALTER COLUMN user_id DROP NOT NULL;
        END IF;
    END IF;

    -- Handle 'status' -> 'stage' (legacy issue)
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'status') THEN
        IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'stage') THEN
             ALTER TABLE public.candidates RENAME COLUMN status TO stage;
        ELSE
             -- Don't drop not null yet, just leave it
        END IF;
    END IF;
END $$;

-- 2. Ensure critical columns are NOT NULL for the app to work
ALTER TABLE public.candidates ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.candidates ALTER COLUMN customer_id SET NOT NULL;
ALTER TABLE public.candidates ALTER COLUMN email SET NOT NULL;

-- 3. Fix rating constraint (allow 0 or null if needed, but app sends 1 now)
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_rating_check;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_rating_check CHECK (rating >= 0 AND rating <= 5);

-- 4. Set default stage if missing
ALTER TABLE public.candidates ALTER COLUMN stage SET DEFAULT 'applied';

-- 5. Fix Jobs table user_id/customer_id
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'user_id') THEN
        IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'customer_id') THEN
            ALTER TABLE public.jobs RENAME COLUMN user_id TO customer_id;
        END IF;
    END IF;
END $$;
