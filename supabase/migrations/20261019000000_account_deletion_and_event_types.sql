-- ==============================================================================
-- G-SENSE Database Migration: 20261019000000_account_deletion_and_event_types.sql
-- Description:
--   1. Align interaction_events check constraint with engine event types ('idle_pause', 'backtrack')
--   2. Implement secure server-side delete_user_account() RPC function
--      verifying auth.uid() and cascading all associated user records.
-- ==============================================================================

-- 1. Align interaction_events event_type constraint
DO $$
BEGIN
  -- Drop existing check constraint if present
  ALTER TABLE public.interaction_events 
    DROP CONSTRAINT IF EXISTS interaction_events_event_type_check;

  -- Re-add with complete set of runtime engine event types
  ALTER TABLE public.interaction_events
    ADD CONSTRAINT interaction_events_event_type_check
    CHECK (event_type IN (
      'navigation',
      'repeat_attempt',
      'hesitation_pause',
      'correction',
      'action_success',
      'assistance_trigger',
      'idle_pause',
      'backtrack'
    ));
END $$;

-- 2. Secure server-side account deletion function
-- SECURITY DEFINER ensures it runs with appropriate permissions while strictly
-- checking auth.uid() so users can ONLY delete their own account.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_deleted_events INT := 0;
  v_deleted_feedback INT := 0;
  v_deleted_summaries INT := 0;
BEGIN
  -- Strict authentication guard: caller must have a valid session
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user session required for account deletion';
  END IF;

  -- Delete associated interaction records
  DELETE FROM public.assistance_feedback WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_deleted_feedback = ROW_COUNT;

  DELETE FROM public.learning_summaries WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_deleted_summaries = ROW_COUNT;

  DELETE FROM public.interaction_events WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_deleted_events = ROW_COUNT;

  DELETE FROM public.user_preferences WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;

  -- Return deletion receipt
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'deleted_events_count', v_deleted_events,
    'deleted_feedback_count', v_deleted_feedback,
    'deleted_summaries_count', v_deleted_summaries,
    'timestamp', TIMEZONE('utc'::text, NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict execution permission exclusively to authenticated users
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
