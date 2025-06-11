import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
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

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Access denied - admin required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (req.method) {
      case 'GET':
        if (action === 'list') {
          // List all users
          const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
          if (error) throw error

          return new Response(
            JSON.stringify({ users: users.users }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'POST':
        const body = await req.json()
        
        if (action === 'create') {
          // Create new user
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: body.email,
            password: body.password || 'TempPassword123!',
            email_confirm: true,
          })
          if (error) throw error

          return new Response(
            JSON.stringify({ user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (action === 'update') {
          // Update user
          const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            body.userId,
            body.updates
          )
          if (error) throw error

          return new Response(
            JSON.stringify({ user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'DELETE':
        const deleteBody = await req.json()
        if (action === 'delete') {
          // Delete user
          const { error } = await supabaseAdmin.auth.admin.deleteUser(deleteBody.userId)
          if (error) throw error

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin users function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})