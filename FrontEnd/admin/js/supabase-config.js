// FrontEnd/admin/js/supabase-config.js - Versão Final
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ATENÇÃO: Substitua pelas suas chaves reais
const supabaseUrl = 'https://xerofsbrexvgxuqtzkkv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlcm9mc2JyZXh2Z3h1cXR6a2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDQ2MDQsImV4cCI6MjA4MDUyMDYwNH0.IdgX8Y3dieqQ4drATU3oSFlEM5Sr223mhdYy8hZV3no'

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ Supabase conectado com sucesso!')

// ========================================\
// AUTENTICAÇÃO
// ========================================\

export async function loginAdmin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Erro no login:', error)
    throw error
  }
}

export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ========================================\
// PRODUTOS (CRUD)
// ========================================\

export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function addProduto(produto) {
  const { data, error } = await supabase
    .from('produtos')
    .insert([produto])
    .select()
    
  if (error) throw error
  return data[0]
}

export async function updateProduto(id, produto) {
  const { data, error } = await supabase
    .from('produtos')
    .update(produto)
    .eq('id', id)
    .select()
    
  if (error) throw error
  return data[0]
}

export async function deleteProduto(id) {
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id)
    
  if (error) throw error
  return true
}

export async function toggleEsgotado(id, isEsgotado) {
    const { data, error } = await supabase
        .from('produtos')
        .update({ esgotado: isEsgotado, quantidade_estoque: isEsgotado ? 0 : 1 })
        .eq('id', id)
        .select()
        
    if (error) throw error
    return data[0]
}

// ========================================\
// PEDIDOS (CRUD)
// ========================================\

export async function getPedidos() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('id, cliente_nome, valor, status, created_at'); 

    if (error) throw error;
    // Garante que os dados existem para evitar o TypeError no admin.js
    return data.map(p => ({
        ...p,
        id: p.id || 'N/A', 
        created_at: p.created_at || new Date().toISOString()
    }));
}

export async function addPedido(pedido) {
    const { data, error } = await supabase
        .from('pedidos')
        .insert([pedido])
        .select();
    if (error) throw error;
    return data[0];
}

export async function updatePedido(id, pedido) {
    const { data, error } = await supabase
        .from('pedidos')
        .update(pedido)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
}

export async function deletePedido(id) {
    const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
}


// ========================================\
// CLIENTES (CRUD)
// ========================================\

export async function getClientes() {
    const { data, error } = await supabase
        .from('clientes')
        .select('*');

    if (error) throw error;
    return data;
}

export async function addCliente(cliente) {
    const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select();
    if (error) throw error;
    return data[0];
}

export async function updateCliente(id, cliente) {
    const { data, error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
}

export async function deleteCliente(id) {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
}

// ========================================\
// STORAGE - UPLOAD DE IMAGENS (Necessário para o botão de Upload)
// ========================================\

export async function uploadImagemProduto(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('produtos-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('produtos-images')
    .getPublicUrl(fileName)
  
  return publicUrl
}

// ========================================\
// ESTATÍSTICAS
// ========================================\

export async function getEstatisticas() {
  
  const [
    { data: produtos, error: prodError },
    { data: pedidos, error: pedError },
    { data: clientes, error: cliError }
  ] = await Promise.all([
    supabase.from('produtos').select('preco_novo, quantidade_estoque, esgotado'),
    supabase.from('pedidos').select('valor, status'),
    supabase.from('clientes').select('id')
  ]);
  
  if (prodError) throw prodError;
  if (pedError) throw pedError;
  if (cliError) throw cliError;
  
  const totalProdutos = produtos.length;
  const emEstoque = produtos.filter(p => !p.esgotado && p.quantidade_estoque > 0).length;
  const esgotados = produtos.filter(p => p.esgotado || p.quantidade_estoque <= 0).length;
  
  const totalFaturamento = pedidos.reduce((acc, p) => {
      if (p.status === 'Entregue') {
          return acc + parseFloat(p.valor || 0);
      }
      return acc;
  }, 0);
  
  
  return {
    total: totalProdutos,
    emEstoque: emEstoque,
    esgotados: esgotados, 
    totalClientes: clientes.length, 
    valorTotal: totalFaturamento
  }
}


// ========================================
// CARDS - CRUD (Organizador de Destaques)
// ========================================

export async function getCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('ordem', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function addCard(card) {
  const { data, error } = await supabase
    .from('cards')
    .insert([card])
    .select()
    
  if (error) throw error
  return data[0]
}

export async function updateCard(id, card) {
  const { data, error } = await supabase
    .from('cards')
    .update(card)
    .eq('id', id)
    .select()
    
  if (error) throw error
  return data[0]
}

export async function deleteCard(id) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
    
  if (error) throw error
  return true
}

export async function toggleCardAtivo(id, ativo) {
  const { data, error } = await supabase
    .from('cards')
    .update({ ativo })
    .eq('id', id)
    .select()
    
  if (error) throw error
  return data[0]
}