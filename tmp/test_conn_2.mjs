import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xwfujiwvheftcfiozugi.supabase.co'
const supabaseKey = 'sb_publishable_n6CHLQIvDdr_3ni5xC0gOQ_dXpvPnUD'

console.log('Testing connection to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    try {
        console.log('Starting fetch...')
        const { data, error } = await supabase.from('users').select('id').limit(1)
        if (error) {
            console.error('Error fetching users:', error)
        } else {
            console.log('Success fetching users:', data)
        }
    } catch (e) {
        console.error('Exception caught:', e)
    }
}

test()
