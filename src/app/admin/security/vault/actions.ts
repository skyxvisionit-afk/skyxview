'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAsUser(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }
    
    // Security check: Only admins can ghost login
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        
    if (profile?.role !== 'ADMIN') {
        return { error: 'Unauthorized. Only admins can use Ghost Login.' }
    }

    const cookieStore = await cookies()
    
    if (targetUserId === 'exit') {
        cookieStore.delete('ghost_user_id')
        redirect('/admin/security/vault')
    } else {
        cookieStore.set('ghost_user_id', targetUserId, {
            path: '/',
            maxAge: 60 * 60, // 1 hour
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        })
        redirect('/dashboard')
    }
}
