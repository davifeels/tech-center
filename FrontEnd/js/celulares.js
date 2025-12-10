// celulares.js - VERSÃO CORRIGIDA PARA MOBILE
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ====== SUPABASE CONFIG ======
const supabaseUrl = 'https://xerofsbrexvgxuqtzkkv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlcm9mc2JyZXh2Z3h1cXR6a2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDQ2MDQsImV4cCI6MjA4MDUyMDYwNH0.IdgX8Y3dieqQ4drATU3oSFlEM5Sr223mhdYy8hZV3no'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ Supabase inicializado')

// ====== CONSTANTES ======
const WHATSAPP_NUMBER = "5561996684007"
let carrinho = []

// ====== FUNÇÕES DE CARRINHO ======
window.loadCart = function() {
    try {
        const saved = localStorage.getItem('carrinho')
        if (saved) { 
            carrinho = JSON.parse(saved)
            updateCartUI()
            console.log('✅ Carrinho carregado:', carrinho)
        }
    } catch (e) {
        console.error('❌ Erro ao carregar carrinho:', e)
    }
}

window.addToCart = function(nome, preco, img = null) {
    console.log('🛒 Adicionando ao carrinho:', nome, preco)
    
    const existing = carrinho.find(item => item.nome === nome)
    const imagemFinal = img || 'https://placehold.co/100x100/f1f5f9/94a3b8?text=Foto'

    if (existing) {
        existing.quantidade++
    } else {
        carrinho.push({ nome, preco, quantidade: 1, img: imagemFinal })
    }
    
    saveCart()
    
    // Toast
    const toast = document.createElement('div')
    toast.className = 'position-fixed bottom-0 end-0 p-3'
    toast.style.zIndex = '9999'
    toast.innerHTML = `
        <div class="toast show border-0 shadow-lg rounded-3 overflow-hidden" style="background: white;">
            <div class="d-flex align-items-center p-3">
                <div class="rounded-circle bg-success d-flex align-items-center justify-content-center text-white me-3" style="width: 30px; height: 30px;">
                    <i class="bi bi-check-lg"></i>
                </div>
                <div>
                    <h6 class="mb-0 fw-bold text-dark">Adicionado!</h6>
                    <small class="text-muted">${nome}</small>
                </div>
            </div>
        </div>`
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
}

window.removeFromCart = function(nome) {
    carrinho = carrinho.filter(item => item.nome !== nome)
    saveCart()
}

window.updateQuantity = function(nome, change) {
    const item = carrinho.find(i => i.nome === nome)
    if (item) {
        item.quantidade += change
        if (item.quantidade <= 0) window.removeFromCart(nome)
        else saveCart()
    }
}

function saveCart() { 
    try {
        localStorage.setItem('carrinho', JSON.stringify(carrinho))
        updateCartUI()
    } catch (e) {
        console.error('❌ Erro ao salvar carrinho:', e)
    }
}

function updateCartUI() {
    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0)
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItens
        el.style.display = totalItens > 0 ? 'inline' : 'none'
    })

    const cartTotal = document.getElementById('cart-total')
    if (cartTotal) {
        const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)
        cartTotal.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
    }

    const container = document.getElementById('cart-items')
    if (container) {
        if (carrinho.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3 text-muted opacity-25">
                        <i class="bi bi-cart-x" style="font-size: 4rem;"></i>
                    </div>
                    <p class="fw-bold text-muted">Seu carrinho está vazio</p>
                </div>`
        } else {
            container.innerHTML = carrinho.map(item => `
                <div class="card mb-3 border-0 shadow-sm rounded-4 position-relative" style="background: white; overflow: hidden; transition: all 0.2s;">
                    <div class="card-body p-2">
                        <div class="d-flex align-items-center gap-3">
                            <div class="rounded-3 border bg-white d-flex align-items-center justify-content-center flex-shrink-0" 
                                 style="width: 80px; height: 80px; padding: 2px;">
                                <img src="${item.img}" alt="${item.nome}" 
                                     style="max-width: 100%; max-height: 100%; object-fit: contain;">
                            </div>
                            <div class="flex-grow-1" style="min-width: 0;">
                                <h6 class="fw-bold text-dark mb-1 text-truncate" style="font-size: 0.95rem;">${item.nome}</h6>
                                <div class="text-muted small">R$ ${item.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})} un.</div>
                            </div>
                            <div class="d-flex flex-column align-items-end gap-2">
                                <button onclick="window.removeFromCart('${item.nome}')" 
                                        class="btn btn-sm text-danger p-0 border-0 bg-transparent" 
                                        style="opacity: 0.7; transition: 0.2s;">
                                    <i class="bi bi-trash3-fill"></i>
                                </button>
                                <div class="d-flex align-items-center bg-light border rounded-pill px-1" style="height: 32px;">
                                    <button class="btn btn-sm border-0 px-2 h-100 text-muted" onclick="window.updateQuantity('${item.nome}', -1)">-</button>
                                    <span class="fw-bold px-1 text-dark" style="font-size: 0.9rem; min-width: 20px; text-align: center;">${item.quantidade}</span>
                                    <button class="btn btn-sm border-0 px-2 h-100 text-primary" onclick="window.updateQuantity('${item.nome}', 1)">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')
        }
    }
}

window.checkout = function() {
    if (carrinho.length === 0) return alert('Carrinho vazio!')
    let msg = 'Olá! Gostaria de fazer o seguinte pedido:\n\n'
    carrinho.forEach(i => msg += `📦 ${i.quantidade}x ${i.nome} - R$ ${(i.preco * i.quantidade).toFixed(2)}\n`)
    const total = carrinho.reduce((sum, i) => sum + (i.preco * i.quantidade), 0)
    msg += `\n💰 *Total: R$ ${total.toFixed(2)}*`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
}

// ====== RENDERIZAÇÃO DE PRODUTOS ======
function renderProducts(productsToShow) {
    const container = document.getElementById('products-container')
    const countText = document.getElementById('product-count-text')
    
    console.log('🎨 Renderizando', productsToShow.length, 'produtos')
    
    if (!container) {
        console.error('❌ Container não encontrado!')
        return
    }
    
    if (productsToShow.length === 0) {
        countText.innerHTML = '0 encontrados'
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search text-muted" style="font-size: 4rem; opacity: 0.2;"></i>
                <h4 class="mt-3 text-muted">Nenhum produto encontrado</h4>
            </div>`
        return
    }

    countText.innerHTML = `<i class="bi bi-check-circle-fill text-success me-2"></i> ${productsToShow.length} produtos encontrados`

    container.innerHTML = productsToShow.map(p => {
        const nomeSafe = p.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;')
        const imgSafe = p.img && p.img.length > 10 ? p.img : 'https://placehold.co/400x400/EEE/999?text=Sem+Foto'
        const detailsLink = `produto.html?id=${p.id}`
        
        let badgeHtml = ''
        if (p.badge) {
            let badgeClass = 'badge-novo'
            if (p.badge.toLowerCase().includes('oferta') || p.badge.toLowerCase().includes('promoção')) {
                badgeClass = 'badge-oferta'
            } else if (p.badge.toLowerCase().includes('hot') || p.badge.toLowerCase().includes('destaque')) {
                badgeClass = 'badge-hot'
            }
            badgeHtml = `<span class="product-badge ${badgeClass}">${p.badge}</span>`
        }
        
        const isEsgotado = p.esgotado || p.quantidade_estoque <= 0
        const btnHtml = isEsgotado
            ? `<button class="btn-bag" disabled><i class="bi bi-x-lg"></i></button>`
            : `<button class="btn-bag" onclick="event.stopPropagation(); window.addToCart('${nomeSafe}', ${p.preco_novo}, '${imgSafe}'); return false;">
                   <i class="bi bi-bag-plus-fill"></i>
               </button>`

        const oldPriceHtml = p.preco_antigo > 0 
            ? `<div class="price-old">De R$ ${p.preco_antigo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>` 
            : ''

        return `
        <div class="col-6 col-md-4 col-lg-3"> 
            <a href="${detailsLink}" class="text-decoration-none">
                <div class="product-card">
                    ${badgeHtml}
                    <div class="product-img-wrapper">
                        <img src="${imgSafe}" alt="${nomeSafe}" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=Erro'">
                    </div>
                    <div class="product-info">
                        <div class="product-brand">${p.marca || 'TECH'}</div>
                        <h5 class="product-name">${p.nome}</h5>
                        <div class="price-section">
                            ${oldPriceHtml}
                            <div class="price-container">
                                <div class="price-current">R$ ${p.preco_novo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                                ${btnHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
        `
    }).join('')
}

// ====== BUSCA DE PRODUTOS ======
async function loadProducts() {
    try {
        console.log('🔄 Buscando produtos do Supabase...')
        
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('id', { ascending: false })
        
        if (error) {
            console.error('❌ Erro Supabase:', error)
            throw error
        }

        console.log('✅ Produtos carregados:', data?.length || 0)
        
        if (!data || data.length === 0) {
            renderProducts([])
            return
        }

        renderProducts(data)
        
    } catch (error) {
        console.error('❌ ERRO FATAL:', error.message)
        document.getElementById('products-container').innerHTML = `
            <div class="col-12">
                <div class="loading-wrapper">
                    <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                    <h4 class="mt-3">Erro ao carregar produtos</h4>
                    <p class="text-muted">${error.message}</p>
                    <p class="text-muted small">Verifique a conexão ou recarregue a página</p>
                </div>
            </div>`
    }
}

// ====== BUSCA ======
function setupProductSearch() {
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const search = e.target.value.toLowerCase()
            if (!search) {
                await loadProducts()
                return
            }
            
            try {
                const { data } = await supabase
                    .from('produtos')
                    .select('*')
                
                const filtered = data.filter(p => 
                    p.nome.toLowerCase().includes(search) ||
                    p.marca.toLowerCase().includes(search)
                )
                renderProducts(filtered)
            } catch (e) {
                console.error('❌ Erro na busca:', e)
            }
        })
    }
}

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 INICIANDO CELULARES.JS')
    window.loadCart()
    await loadProducts()
    setupProductSearch()
})

console.log('✅ celulares.js carregado com sucesso')