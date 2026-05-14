import { createClient } from '@/utils/supabase/client'

export async function logActivity(action: string, details: any = {}) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('activity_log').insert({
      user_id: user.id,
      action,
      details,
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}
