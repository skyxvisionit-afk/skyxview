import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xwfujiwvheftcfiozugi.supabase.co'
const supabaseKey = 'sb_publishable_n6CHLQIvDdr_3ni5xC0gOQ_dXpvPnUD'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    const tables = ['users', 'activation_payments', 'withdraw_requests', 'commissions', 'system_settings', 'meetings', 'badges']
    for (const table of tables) {
        try {
            const { error } = await supabase.from(table).select('index').limit(1)
            if (error && error.code === '42P01') {
                console.log(`Table NOT FOUND: ${table}`)
            } else {
                console.log(`Table found: ${table}`)
            }
        } catch (e) {
            console.log(`Error checking table ${table}:`, e)
        }
    }
}

checkTables()
