import { supabaseAdmin } from './supabase';

/**
 * Create a new user notification.
 * Safe wrapper that handles table missing errors gracefully.
 */
export async function createNotification(userId: string, title: string, message: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        is_read: false,
      });

    if (error) {
      console.error('[Notification] Error inserting notification:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Notification] Exception creating notification (table might not exist yet):', err?.message || err);
    return false;
  }
}
