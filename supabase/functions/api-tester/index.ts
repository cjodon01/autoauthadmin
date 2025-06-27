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
    // DEBUG: Log all incoming headers for debugging
    console.log('🔍 [API Tester Debug] Incoming request headers:')
    for (const [key, value] of req.headers.entries()) {
      if (key.toLowerCase() === 'authorization') {
        console.log(`  ${key}: ${value ? `Bearer ${value.substring(7, 20)}...` : 'MISSING'}`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    }

    // DEBUG: Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('🔍 [API Tester Debug] Environment variables:')
    console.log(`  SUPABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING'}`)
    console.log(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'}`)

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ [API Tester Debug] No authorization header found')
      throw new Error('No authorization header')
    }

    console.log('✅ [API Tester Debug] Authorization header found')

    const token = authHeader.replace('Bearer ', '')
    console.log(`🔍 [API Tester Debug] Token length: ${token.length}`)

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError) {
      console.error('❌ [API Tester Debug] User authentication error:', userError)
      throw new Error('Invalid authentication: ' + userError.message)
    }
    
    if (!user) {
      console.error('❌ [API Tester Debug] No user found from token')
      throw new Error('Invalid authentication - no user found')
    }

    console.log('✅ [API Tester Debug] User authenticated successfully:', {
      user_id: user.id,
      email: user.email,
      role: user.role
    })

    // Parse request body
    const params: TestParams = await req.json()
    const { platform, feature, connection_id, page_id, content, post_id } = params

    console.log('📥 [API Tester Debug] Request parameters:', {
      platform,
      feature,
      connection_id,
      page_id: page_id || 'none',
      content_length: content?.length || 0,
      post_id: post_id || 'none'
    })

    if (!platform || !feature || !connection_id) {
      throw new Error('Missing required parameters: platform, feature, connection_id')
    }

    // Get the social connection
    console.log('🔍 [API Tester Debug] Fetching social connection...')
    const { data: connection, error: connectionError } = await supabaseClient
      .from('social_connections')
      .select('*')
      .eq('id', connection_id)
      .single()

    if (connectionError) {
      console.error('❌ [API Tester Debug] Connection fetch error:', connectionError)
      throw new Error('Social connection not found: ' + connectionError.message)
    }

    if (!connection) {
      console.error('❌ [API Tester Debug] No connection data returned')
      throw new Error('Social connection not found')
    }

    console.log('✅ [API Tester Debug] Connection found:', {
      id: connection.id,
      provider: connection.provider,
      user_id: connection.user_id,
      has_token: !!connection.oauth_user_token
    })

    // Get page details if page_id is provided
    let page = null
    if (page_id) {
      console.log('🔍 [API Tester Debug] Fetching social page...')
      const { data: pageData, error: pageError } = await supabaseClient
        .from('social_pages')
        .select('*')
        .eq('id', page_id)
        .single()

      if (pageError) {
        console.error('❌ [API Tester Debug] Page fetch error:', pageError)
        throw new Error('Social page not found: ' + pageError.message)
      }
      
      page = pageData
      console.log('✅ [API Tester Debug] Page found:', {
        id: page.id,
        page_name: page.page_name,
        provider: page.provider,
        has_access_token: !!page.page_access_token
      })
    }

    // Execute the API test based on platform and feature
    console.log('🚀 [API Tester Debug] Executing API test...')
    const result = await executeAPITest(platform, feature, connection, page, { content, post_id })

    console.log('✅ [API Tester Debug] API test completed:', {
      endpoint: result.endpoint,
      status_code: result.status_code,
      summary: result.summary
    })

    // Log the API test
    try {
      await supabaseClient.from('facebook_api_logs').insert([{
        user_id: connection.user_id,
        endpoint: result.endpoint,
        method: result.method || 'GET',
        response_code: result.status_code || 200,
        action_type: `api_test_${feature}`,
        request_body: result.request_body,
        response_body: result.response,
      }])
      console.log('✅ [API Tester Debug] API test logged successfully')
    } catch (logError) {
      console.error('⚠️ [API Tester Debug] Failed to log API test:', logError)
      // Don't throw here, just log the warning
    }

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
    console.error('❌ [API Tester Debug] Function error:', error)
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
  console.log(`🔍 [API Tester Debug] Executing ${platform} ${feature}...`)
  
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
  
  console.log(`🔍 [Facebook API Debug] Testing ${feature}`)
  console.log(`🔍 [Facebook API Debug] Page available: ${!!page}`)
  console.log(`🔍 [Facebook API Debug] Connection token: ${connection.oauth_user_token ? 'present' : 'missing'}`)
  console.log(`🔍 [Facebook API Debug] Page token: ${page?.page_access_token ? 'present' : 'missing'}`)

  switch (feature) {
    case 'list_pages': {
      const token = connection.oauth_user_token
      const endpoint = `${baseUrl}/me/accounts`
      console.log(`📤 [Facebook API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?access_token=${token}`)
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.data?.length || 0} pages`,
        response: data,
      }
    }

    case 'list_posts': {
      const token = connection.oauth_user_token
      const endpoint = `${baseUrl}/me/posts`
      console.log(`📤 [Facebook API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?access_token=${token}&limit=10`)
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.data?.length || 0} recent posts`,
        response: data,
      }
    }

    case 'list_page_posts': {
      if (!page) {
        throw new Error('Page is required for listing page posts')
      }
      
      const token = page.page_access_token
      const endpoint = `${baseUrl}/${page.page_id}/posts`
      console.log(`📤 [Facebook API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?access_token=${token}&limit=10`)
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.data?.length || 0} page posts`,
        response: data,
      }
    }

    case 'post_to_feed': {
      if (!options.content) {
        throw new Error('Content is required for posting to feed')
      }
      
      const token = connection.oauth_user_token
      const endpoint = `${baseUrl}/me/feed`
      console.log(`📤 [Facebook API Debug] POST ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: options.content,
          access_token: token,
        }),
      })
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'POST',
        status_code: response.status,
        request_body: { message: options.content },
        summary: response.ok ? `Post created: ${data.id}` : 'Post failed',
        response: data,
      }
    }

    case 'post_to_page': {
      if (!options.content) {
        throw new Error('Content is required for posting to page')
      }
      
      if (!page) {
        throw new Error('Page is required for posting to page')
      }
      
      const token = page.page_access_token
      const endpoint = `${baseUrl}/${page.page_id}/feed`
      console.log(`📤 [Facebook API Debug] POST ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: options.content,
          access_token: token,
        }),
      })
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'POST',
        status_code: response.status,
        request_body: { message: options.content },
        summary: response.ok ? `Page post created: ${data.id}` : 'Page post failed',
        response: data,
      }
    }

    case 'get_engagements': {
      if (!options.post_id) {
        throw new Error('Post ID is required for engagement data')
      }
      
      const token = connection.oauth_user_token
      const endpoint = `${baseUrl}/${options.post_id}`
      console.log(`📤 [Facebook API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`)
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Likes: ${data.likes?.summary?.total_count || 0}, Comments: ${data.comments?.summary?.total_count || 0}`,
        response: data,
      }
    }

    case 'get_page_engagements': {
      if (!options.post_id) {
        throw new Error('Post ID is required for page engagement data')
      }
      
      if (!page) {
        throw new Error('Page is required for page engagement data')
      }
      
      const token = page.page_access_token
      const endpoint = `${baseUrl}/${options.post_id}`
      console.log(`📤 [Facebook API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`)
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Page Post - Likes: ${data.likes?.summary?.total_count || 0}, Comments: ${data.comments?.summary?.total_count || 0}`,
        response: data,
      }
    }

    case 'get_insights': {
      if (!options.post_id) {
        throw new Error('Post ID is required for insights')
      }
      
      const token = connection.oauth_user_token
      const endpoint = `${baseUrl}/${options.post_id}/insights`
      console.log(`📤 [Facebook API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?metric=post_impressions,post_clicks&access_token=${token}`)
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Retrieved ${data.data?.length || 0} insight metrics`,
        response: data,
      }
    }

    case 'get_page_insights': {
      if (!page) {
        throw new Error('Page is required for page insights')
      }
      
      const token = page.page_access_token
      const endpoint = `${baseUrl}/${page.page_id}/insights`
      console.log(`📤 [Facebook API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?metric=page_impressions,page_reach&access_token=${token}`)
      const data = await response.json()
      
      console.log(`📥 [Facebook API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Retrieved ${data.data?.length || 0} page insight metrics`,
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

  console.log(`🔍 [LinkedIn API Debug] Testing ${feature} with token: ${token ? 'present' : 'missing'}`)

  switch (feature) {
    case 'list_organizations': {
      const endpoint = `${baseUrl}/organizationAcls`
      console.log(`📤 [LinkedIn API Debug] GET ${endpoint}`)
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      console.log(`📥 [LinkedIn API Debug] Response: ${response.status}`, data)
      
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
      console.log(`📤 [LinkedIn API Debug] GET ${endpoint}`)
      
      const response = await fetch(`${endpoint}?q=owners&owners=urn:li:person:${connection.account_id}&count=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      console.log(`📥 [LinkedIn API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'GET',
        status_code: response.status,
        summary: `Found ${data.elements?.length || 0} recent posts`,
        response: data,
      }
    }

    case 'post_to_organization': {
      if (!options.content) {
        throw new Error('Content is required for posting to organization')
      }
      
      if (!page) {
        throw new Error('Organization page is required for posting')
      }
      
      const endpoint = `${baseUrl}/shares`
      console.log(`📤 [LinkedIn API Debug] POST ${endpoint}`)
      
      const postData = {
        owner: `urn:li:organization:${page.page_id}`,
        text: {
          text: options.content
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      })
      const data = await response.json()
      
      console.log(`📥 [LinkedIn API Debug] Response: ${response.status}`, data)
      
      return {
        endpoint,
        method: 'POST',
        status_code: response.status,
        request_body: postData,
        summary: response.ok ? `Organization post created` : 'Organization post failed',
        response: data,
      }
    }

    default:
      console.log(`⚠️ [LinkedIn API Debug] Feature ${feature} not implemented`)
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
  console.log(`⚠️ [Twitter API Debug] Feature ${feature} not implemented`)
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
  console.log(`⚠️ [Reddit API Debug] Feature ${feature} not implemented`)
  // Reddit API implementation would go here
  return {
    endpoint: `https://oauth.reddit.com/${feature}`,
    method: 'GET',
    status_code: 501,
    summary: `Reddit ${feature} not implemented yet`,
    response: { message: 'Reddit API not implemented' },
  }
}