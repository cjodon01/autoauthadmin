import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on actual schema
export interface Profile {
  id: string
  user_id: string
  brand_name: string
  brand_bio?: string
  brand_tone?: string
  email?: string
  stripe_customer_id?: string
  subscription?: string
  tier?: 'free' | 'starter' | 'pro' | 'team' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface SocialConnection {
  id: string
  user_id: string
  provider: string
  oauth_user_token: string
  long_lived_user_token?: string
  oauth_refresh_token?: string
  account_id?: string
  token_expires_at?: string
  created_at: string
  updated_at: string
}

export interface SocialPage {
  id: string
  connection_id: string
  user_id: string
  page_id: string
  page_name: string
  page_category?: string
  page_picture_url?: string
  page_access_token: string
  page_token_expires_at?: string
  page_description?: string
  preferred_audience?: string
  ai_extra_notes?: any
  provider?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  user_id: string
  page_id?: string
  campaign_name: string
  description?: string
  campaign_type: string
  goal?: string
  brand_id?: string
  schedule_cron?: string
  next_run_at?: string
  last_run_at?: string
  is_active: boolean
  status: string
  timezone?: string
  ai_tone?: string
  ai_posting_frequency?: string
  ai_extra_metadata?: any
  target_audience_specific?: any
  target_audience_psychographics?: string
  ai_tone_preference?: string[]
  ai_content_style_preference?: string[]
  negative_constraints_campaign?: string
  cta_action?: string
  cta_link?: string
  post_length_type?: string
  ai_intent?: string
  journey_start_date?: string
  journey_duration_days?: number
  journey_map?: any
  current_journey_day?: number
  start_date?: string
  duration_days?: number
  key_milestones?: string[]
  target_audience_journey?: string
  ai_model_for_journey_map?: string
  ai_model_for_general_campaign?: string
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  user_id: string
  name: string
  description?: string
  mission_statement?: string
  usp_statement?: string
  brand_persona_description?: string
  core_values?: string[]
  target_audience?: string
  brand_keywords_include?: string[]
  brand_keywords_exclude?: string[]
  brand_voice?: string
  industry?: string
  primary_color?: string
  secondary_color?: string
  created_at: string
  updated_at: string
}

export interface AIProvider {
  id: string
  provider_name: string
  api_key: string
  api_base_url: string
  status: string
  created_at: string
  updated_at: string
}

export interface AIModel {
  id: string
  model_name: string
  model_type: 'text_generation' | 'image_generation'
  provider_id: string
  api_model_id?: string
  is_active: boolean
  max_tokens_default?: number
  temperature_default?: number
  strengths_description?: string
  best_use_cases?: string
  pricing?: string
  status: string
  min_tier: 'free' | 'starter' | 'pro' | 'team' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface PostLog {
  id: string
  campaign_id?: string
  page_id?: string
  generated_content: string
  ai_prompt_used?: string
  posted_at?: string
  created_at: string
}

export interface SurveyQuestion {
  id: string
  question_text: string
  question_type: string
  created_at: string
  updated_at: string
}

export interface SurveyResponse {
  id: string
  user_id: string
  question_id: string
  response_yes_no?: boolean
  response_rating?: number
  response_text?: string
  created_at: string
}

export interface FacebookAPILog {
  id: string
  user_id?: string
  endpoint: string
  method: string
  response_code: number
  action_type: string
  request_body?: any
  response_body?: any
  error_message?: string
  created_at: string
}