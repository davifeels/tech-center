// FrontEnd/js/supabase-config.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://xerofsbrexvgxuqtzkkv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlcm9mc2JyZXh2Z3h1cXR6a2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDQ2MDQsImV4cCI6MjA4MDUyMDYwNH0.IdgX8Y3dieqQ4drATU3oSFlEM5Sr223mhdYy8hZV3no'

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ Supabase conectado (Site Público)')

// PRODUTOS
export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('id', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getProdutosByCategoria(categoria) {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('categoria', categoria)
    .order('id', { ascending: false })
  
  if (error) throw error
  return data || []
}

// CARDS
export async function getCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('ordem', { ascending: true })
  
  if (error) throw error
  return data || []
}