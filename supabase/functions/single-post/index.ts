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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    // Parse request body
    const { page_id, content } = await req.json()

    if (!page_id || !content) {
      throw new Error('Missing required fields: page_id and content')
    }

    // Get the social page details
    const { data: socialPage, error: pageError } = await supabaseClient
      .from('social_pages')
      .select('*')
      .eq('id', page_id)
      .eq('provider', 'facebook')
      .single()

    if (pageError || !socialPage) {
      throw new Error('Facebook page not found or access denied')
    }

    // Log the API request
    const logEntry = {
      user_id: socialPage.user_id,
      endpoint: `/v18.0/${socialPage.page_id}/feed`,
      method: 'POST',
      action_type: 'post_creation',
      request_body: { message: content },
      response_code: 0, // Will update after API call
      created_at: new Date().toISOString(),
    }

    try {
      // Make Facebook API call
      const facebookResponse = await fetch(
        `https://graph.facebook.com/v18.0/${socialPage.page_id}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            access_token: socialPage.page_access_token,
          }),
        }
      )

      const responseData = await facebookResponse.json()
      logEntry.response_code = facebookResponse.status
      logEntry.response_body = responseData

      if (!facebookResponse.ok) {
        logEntry.error_message = responseData.error?.message || 'Facebook API error'
        
        // Log the failed attempt
        await supabaseClient.from('facebook_api_logs').insert([logEntry])
        
        throw new Error(responseData.error?.message || 'Failed to post to Facebook')
      }

      // Log the successful post
      await supabaseClient.from('facebook_api_logs').insert([logEntry])

      // Log the post in posts_log table
      await supabaseClient.from('posts_log').insert([{
        page_id: socialPage.id,
        generated_content: content,
        posted_at: new Date().toISOString(),
        ai_prompt_used: 'Manual admin post trigger',
      }])

      return new Response(
        JSON.stringify({
          success: true,
          post_id: responseData.id,
          message: 'Post published successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (apiError) {
      // Log the error
      logEntry.response_code = 500
      logEntry.error_message = apiError.message
      await supabaseClient.from('facebook_api_logs').insert([logEntry])
      
      throw apiError
    }

  } catch (error) {
    console.error('Single post function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})