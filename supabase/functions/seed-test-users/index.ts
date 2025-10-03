import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const testAccounts = [
      {
        email: 'tcadmin@gmail.com',
        password: 'tutorconnect123',
        user_metadata: {
          full_name: 'Admin User',
          role: 'admin'
        }
      },
      {
        email: 'tctutor@gmail.com',
        password: 'tutorconnect123',
        user_metadata: {
          full_name: 'Test Tutor',
          role: 'tutor'
        }
      },
      {
        email: 'tcstudent@gmail.com',
        password: 'tutorconnect123',
        user_metadata: {
          full_name: 'Test Student',
          role: 'student'
        }
      }
    ]

    const results = []

    for (const account of testAccounts) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users.some(u => u.email === account.email)

      if (userExists) {
        results.push({
          email: account.email,
          status: 'already_exists',
          message: 'User already exists'
        })
        continue
      }

      // Create the user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: account.user_metadata
      })

      if (error) {
        results.push({
          email: account.email,
          status: 'error',
          message: error.message
        })
      } else {
        results.push({
          email: account.email,
          status: 'created',
          user_id: data.user?.id
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
