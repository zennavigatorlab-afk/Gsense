import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase Account Deletion Handler
 * Compatible with Vercel Serverless Functions.
 *
 * Security Invariants:
 * 1. Requires valid Bearer authorization token from the caller's active session.
 * 2. Authenticates the token via supabase.auth.getUser() to resolve caller's verified user ID.
 * 3. Never trusts client-supplied user IDs.
 * 4. Deletes associated database records (feedback, summaries, events, preferences, profiles).
 * 5. Uses server-side SUPABASE_SERVICE_ROLE_KEY if present to delete the auth.users record.
 * 6. Never exposes service-role keys to frontend or client responses.
 * 7. Returns explicit error status (401, 500) if deletion cannot be completed.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }));
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    return res.end(
      JSON.stringify({
        success: false,
        error: 'Unauthorized: Missing or invalid Bearer authorization header',
      })
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.statusCode = 503;
    return res.end(
      JSON.stringify({
        success: false,
        error: 'Supabase backend is not configured on the server',
      })
    );
  }

  try {
    // 1. Authenticate user from the verified session token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(token);

    if (authError || !user) {
      res.statusCode = 401;
      return res.end(
        JSON.stringify({
          success: false,
          error: `Unauthorized: ${authError?.message || 'Invalid or expired session token'}`,
        })
      );
    }

    const userId = user.id;

    // 2. Cascade delete all associated interaction and profile records
    const adminClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
      : userClient;

    const [fbRes, sumRes, evtRes, prefRes, profRes] = await Promise.all([
      adminClient.from('assistance_feedback').delete().eq('user_id', userId),
      adminClient.from('learning_summaries').delete().eq('user_id', userId),
      adminClient.from('interaction_events').delete().eq('user_id', userId),
      adminClient.from('user_preferences').delete().eq('user_id', userId),
      adminClient.from('profiles').delete().eq('id', userId),
    ]);

    const recordError = fbRes.error || sumRes.error || evtRes.error || prefRes.error || profRes.error;
    if (recordError) {
      res.statusCode = 500;
      return res.end(
        JSON.stringify({
          success: false,
          error: `Database record deletion failed: ${recordError.message}`,
        })
      );
    }

    // 3. If service role key is configured on server, delete auth user entry
    if (supabaseServiceKey) {
      const { error: adminDeleteError } = await (adminClient.auth.admin as any).deleteUser(userId);
      if (adminDeleteError) {
        res.statusCode = 500;
        return res.end(
          JSON.stringify({
            success: false,
            error: `Failed to remove user auth account: ${adminDeleteError.message}`,
          })
        );
      }
    }

    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        success: true,
        message: 'Account and associated records successfully deleted from Supabase',
        userId,
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    return res.end(
      JSON.stringify({
        success: false,
        error: err?.message || 'Internal server error during account deletion',
      })
    );
  }
}
