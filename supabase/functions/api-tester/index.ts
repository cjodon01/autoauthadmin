import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface TestParams {
  platform: string
  feature: string
  connection_id: string
  page_id?: string
  content?: string
  post_id?: string
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
    const params: TestParams = await req.json()
    const { platform, feature, connection_id, page_id, content, post_id } = params

    if (!platform || !feature || !connection_id) {
      throw new Error('Missing required parameters: platform, feature, connection_id')
    }

    // Get the social connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('social_connections')
      .select('*')
      .eq('id', connection_id)
      .single()

    if (connectionError || !connection) {
      throw new Error('Social connection not found')
    }

    // Get page details if page_id is provided
    let page = null
    if (page_id) {
      const { data: pageData, error: pageError } = await supabaseClient
        .from('social_pages')
        .select('*')
        .eq('id', page_id)
        .single()

      if (pageError) {
        throw new Error('Social page not found')
      }
      page = pageData
    }

    // Execute the API test based on platform and feature
    const result = await executeAPITest(platform, feature, connection, page, { content, post_id })

    // Log the API test
    await supabaseClient.from('facebook_api_logs').insert([{
      user_id: connection.user_id,
      endpoint: result.endpoint,
      method: result.method || 'GET',
      response_code: result.status_code || 200,
      action_type: `api_test_${feature}`,
      request_body: result.request_body,
      response_body: result.response,
    }])

    return new Response(
      JSON.stringify({
        success: true,
        endpoint: result.endpoint,
        summary: result.summary,
        response: result.response,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('API tester function error:', error)
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

async function executeAPITest(
  platform: string, 
  feature: string, 
  connection: any, 
  page: any, 
  options: { content?: string, post_id?: string }
) {
  switch (platform) {
    case 'facebook':
    case 'instagram':
      return await testFacebookAPI(feature, connection, page, options)
    case 'linkedin':
      return await testLinkedInAPI(feature, connection, page, options)
    case 'twitter':
      return await testTwitterAPI(feature, connection, page, options)
    case 'reddit':
      return await testRedditAPI(feature, connection, page, options)
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

async function testFacebookAPI(
  feature: string, 
  connection: any, 
  page: any, 
  options: { content?: string, post_id?: string }
) {
  const baseUrl = 'https://graph.facebook.com/v18.0'
  const token = page?.page_access_token || connection.oauth_user_token

  switch (feature) {
    case 'list_pages': {
      const endpoint = `${baseUrl}/me/accounts`
      const response = await fetch(`${endpoint}?access_token=${token}`)
      const data = await response.json()
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.data?.length || 0} pages`,
        response: data,
      }
    }

    case 'list_posts': {
      const pageId = page?.page_id || 'me'
      const endpoint = `${baseUrl}/${pageId}/posts`
      const response = await fetch(`${endpoint}?access_token=${token}&limit=10`)
      const data = await response.json()
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.data?.length || 0} recent posts`,
        response: data,
      }
    }

    case 'post_to_page': {
      if (!options.content) {
        throw new Error('Content is required for posting')
      }
      
      const pageId = page?.page_id || 'me'
      const endpoint = `${baseUrl}/${pageId}/feed`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: options.content,
          access_token: token,
        }),
      })
      const data = await response.json()
      
      return {
        endpoint,
        method: 'POST',
        status_code: response.status,
        request_body: { message: options.content },
        summary: response.ok ? `Post created: ${data.id}` : 'Post failed',
        response: data,
      }
    }

    case 'get_engagements': {
      if (!options.post_id) {
        throw new Error('Post ID is required for engagement data')
      }
      
      const endpoint = `${baseUrl}/${options.post_id}`
      const response = await fetch(`${endpoint}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`)
      const data = await response.json()
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Likes: ${data.likes?.summary?.total_count || 0}, Comments: ${data.comments?.summary?.total_count || 0}`,
        response: data,
      }
    }

    case 'get_insights': {
      if (!options.post_id) {
        throw new Error('Post ID is required for insights')
      }
      
      const endpoint = `${baseUrl}/${options.post_id}/insights`
      const response = await fetch(`${endpoint}?metric=post_impressions,post_clicks&access_token=${token}`)
      const data = await response.json()
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Retrieved ${data.data?.length || 0} insight metrics`,
        response: data,
      }
    }

    default:
      throw new Error(`Unsupported Facebook feature: ${feature}`)
  }
}

async function testLinkedInAPI(
  feature: string, 
  connection: any, 
  page: any, 
  options: { content?: string, post_id?: string }
) {
  const baseUrl = 'https://api.linkedin.com/v2'
  const token = connection.oauth_user_token

  switch (feature) {
    case 'list_organizations': {
      const endpoint = `${baseUrl}/organizationAcls`
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.elements?.length || 0} organizations`,
        response: data,
      }
    }

    case 'list_posts': {
      const endpoint = `${baseUrl}/shares`
      const response = await fetch(`${endpoint}?q=owners&owners=urn:li:person:${connection.account_id}&count=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.elements?.length || 0} recent posts`,
        response: data,
      }
    }

    default:
      return {
        endpoint: `${baseUrl}/${feature}`,
        method: 'GET',
        status_code: 501,
        summary: `LinkedIn ${feature} not implemented yet`,
        response: { message: 'Feature not implemented' },
      }
  }
}

async function testTwitterAPI(
  feature: string, 
  connection: any, 
  page: any, 
  options: { content?: string, post_id?: string }
) {
  // Twitter API implementation would go here
  return {
    endpoint: `https://api.twitter.com/2/${feature}`,
    method: 'GET',
    status_code: 501,
    summary: `Twitter ${feature} not implemented yet`,
    response: { message: 'Twitter API not implemented' },
  }
}

async function testRedditAPI(
  feature: string, 
  connection: any, 
  page: any, 
  options: { content?: string, post_id?: string }
) {
  // Reddit API implementation would go here
  return {
    endpoint: `https://oauth.reddit.com/${feature}`,
    method: 'GET',
    status_code: 501,
    summary: `Reddit ${feature} not implemented yet`,
    response: { message: 'Reddit API not implemented' },
  }
}