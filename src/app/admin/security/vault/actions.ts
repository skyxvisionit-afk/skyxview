'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Server Action for "Login As User" (Ghost Mode)
 * Note: Must return void or Promise<void> for form action compatibility.
 */
export async function loginAsUser(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        // Redirection should be top-level or handled by Next.js
        redirect('/auth/login')
    }
    
    // Security check: Only admins can ghost login
    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        
    if (profile?.role !== 'ADMIN') {
        redirect('/dashboard?error=unauthorized')
    }

    const cookieStore = await cookies()
    
    if (targetUserId === 'exit') {
        cookieStore.delete('ghost_user_id')
        redirect('/admin/security/vault')
    } else {
        // Double check target user exists
        const { data: targetUser } = await adminSupabase
            .from('users')
            .select('id')
            .eq('id', targetUserId)
            .single()
            
        if (!targetUser) {
            redirect('/admin/security/vault?error=user_not_found')
        }

        cookieStore.set('ghost_user_id', targetUserId, {
            path: '/',
            maxAge: 60 * 60, // 1 hour
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
        
        redirect('/dashboard')
    }
}
