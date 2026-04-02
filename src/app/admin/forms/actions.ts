'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function createAccountFromForm(formId: string) {
    try {
        if (!supabaseServiceKey) return { success: false, error: 'Missing service role key. Did you restart the server?' }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // 1. Get the form details
        const { data: form, error: formError } = await supabase
            .from('registration_forms')
            .select('*, users:submitted_by(*)')
            .eq('id', formId)
            .single()
            
        if (formError || !form) {
            return { success: false, error: 'Form not found or database error' }
        }
        
        if (form.status === 'ACCOUNT_CREATED') {
            return { success: false, error: 'Account already created from this form' }
        }

        const submitter = form.users
        const referredBy = submitter.id
        const trainerId = submitter.role === 'TEAM_TRAINER' ? submitter.id : submitter.trainer_id
        const leaderId = submitter.role === 'TEAM_LEADER' ? submitter.id : submitter.leader_id

        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find((u: any) => u.user_metadata?.whatsapp === form.account_number)
        
        let targetUserId = existingUser?.id

        if (!targetUserId) {
            // 2. Create Auth User
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: form.email || undefined,
                password: form.password,
                email_confirm: true,
                user_metadata: {
                    full_name: form.account_name,
                    whatsapp: form.account_number
                }
            })

            if (authError) return { success: false, error: authError.message }
            targetUserId = authUser.user.id
        }

        // Wait briefly to ensure trigger finishes
        await new Promise(r => setTimeout(r, 1000))

        const { error: updateError } = await supabase
            .from('users')
            .update({
                full_name: form.account_name,
                whatsapp: form.account_number,
                referred_by: referredBy,
                trainer_id: trainerId,
                leader_id: leaderId,
                status: 'INACTIVE'
            })
            .eq('id', targetUserId)

        if (updateError) return { success: false, error: 'Failed to update users table: ' + updateError.message }

        // 4. Update form status
        const { error: formStatusError } = await supabase
            .from('registration_forms')
            .update({ status: 'ACCOUNT_CREATED' })
            .eq('id', formId)
            
        if (formStatusError) return { success: false, error: 'Failed to update form status: ' + formStatusError.message }

        // 5. Send Notification
        const notifyUserId = trainerId || leaderId
        if (notifyUserId) {
            await supabase.from('form_notifications').insert({
                form_id: form.id,
                user_id: notifyUserId,
                message: `Account created for form ${form.employee_id} (${form.account_name}).`,
                whatsapp: form.account_number
            })
        }

        return { success: true }
    } catch (err: any) {
        console.error("Action error:", err)
        return { success: false, error: err.message || 'An unexpected server error occurred.' }
    }
}
