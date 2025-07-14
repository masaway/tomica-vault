-- Migrate existing owned_tomica data to new authentication system
-- This migration moves existing tomica records to the first authenticated user

-- Step 1: Check if there are existing tomica records without ownership
DO $$
DECLARE
    tomica_count INTEGER;
    user_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Count existing tomica records
    SELECT COUNT(*) INTO tomica_count FROM public.owned_tomica WHERE deleted_at IS NULL;
    
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    RAISE NOTICE 'Found % tomica records and % users', tomica_count, user_count;
    
    -- Only proceed if we have both tomica records and at least one user
    IF tomica_count > 0 AND user_count > 0 THEN
        -- Get the first user (oldest account)
        SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
        
        RAISE NOTICE 'Migrating tomica records to user: %', first_user_id;
        
        -- Create ownership records for all existing tomica
        INSERT INTO public.user_tomica_ownership (user_id, tomica_id, is_shared_with_family, created_at, updated_at)
        SELECT 
            first_user_id,
            t.id,
            false,
            t.created_at,
            NOW()
        FROM public.owned_tomica t
        LEFT JOIN public.user_tomica_ownership o ON o.tomica_id = t.id
        WHERE t.deleted_at IS NULL 
        AND o.tomica_id IS NULL; -- Only for tomica without existing ownership
        
        RAISE NOTICE 'Migration completed successfully';
    ELSE
        RAISE NOTICE 'No migration needed - no existing data or no users found';
    END IF;
END $$;