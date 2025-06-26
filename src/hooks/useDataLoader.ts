import { useState, useEffect, useCallback } from 'react'
import { supabase, cachedQuery, debounce } from '../lib/supabase'

interface UseDataLoaderOptions {
  cacheKey?: string
  debounceMs?: number
  dependencies?: any[]
  enabled?: boolean
}

export function useDataLoader<T>(
  table: string,
  queryBuilder: () => any,
  options: UseDataLoaderOptions = {}
) {
  const {
    cacheKey,
    debounceMs = 300,
    dependencies = [],
    enabled = true
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      const result = await cachedQuery<T>(table, queryBuilder, cacheKey)
      
      if (result.error) {
        throw result.error
      }

      setData(result.data || [])
    } catch (err: any) {
      console.error(`Error loading ${table}:`, err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [table, queryBuilder, cacheKey, enabled])

  // Debounced version of loadData
  const debouncedLoadData = useCallback(
    debounce(loadData, debounceMs),
    [loadData, debounceMs]
  )

  useEffect(() => {
    if (enabled) {
      debouncedLoadData()
    }
  }, [debouncedLoadData, enabled, ...dependencies])

  const refresh = useCallback(() => {
    if (enabled) {
      loadData()
    }
  }, [loadData, enabled])

  return {
    data,
    loading,
    error,
    refresh
  }
}

// Specialized hooks for common data patterns
export function useProfiles(enabled = true) {
  return useDataLoader<any>(
    'profiles',
    () => supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    { enabled, cacheKey: 'profiles-list' }
  )
}

export function useSocialConnections(enabled = true) {
  return useDataLoader<any>(
    'social_connections',
    () => supabase.from('social_connections').select(`
      *,
      profiles!social_connections_user_id_fkey(brand_name, email)
    `).order('created_at', { ascending: false }),
    { enabled, cacheKey: 'social-connections-list' }
  )
}

export function useSocialPages(enabled = true) {
  return useDataLoader<any>(
    'social_pages',
    () => supabase.from('social_pages').select(`
      *,
      social_connections!social_pages_connection_id_fkey(provider),
      profiles!social_pages_user_id_fkey(brand_name, email)
    `).order('created_at', { ascending: false }),
    { enabled, cacheKey: 'social-pages-list' }
  )
}

export function useCampaigns(enabled = true) {
  return useDataLoader<any>(
    'campaigns',
    () => supabase.from('campaigns').select(`
      *,
      profiles!campaigns_user_id_fkey(brand_name, email),
      brands(name),
      social_pages(page_name, provider)
    `).order('created_at', { ascending: false }),
    { enabled, cacheKey: 'campaigns-list' }
  )
}

export function useBrands(enabled = true) {
  return useDataLoader<any>(
    'brands',
    () => supabase.from('brands').select('*').order('created_at', { ascending: false }),
    { enabled, cacheKey: 'brands-list' }
  )
}

export function useAIModels(enabled = true) {
  return useDataLoader<any>(
    'ai_models',
    () => supabase.from('ai_models').select(`
      *,
      ai_providers!ai_models_provider_id_fkey(provider_name)
    `).order('created_at', { ascending: false }),
    { enabled, cacheKey: 'ai-models-list' }
  )
}

export function useAIProviders(enabled = true) {
  return useDataLoader<any>(
    'ai_providers',
    () => supabase.from('ai_providers').select('*').order('created_at', { ascending: false }),
    { enabled, cacheKey: 'ai-providers-list' }
  )
}