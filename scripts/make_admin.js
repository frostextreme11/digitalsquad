import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const email = process.argv[2]

if (!email) {
  console.error('Please provide an email address')
  process.exit(1)
}

async function makeAdmin() {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', email)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Successfully promoted ${email} to admin`)
  }
}

makeAdmin()
