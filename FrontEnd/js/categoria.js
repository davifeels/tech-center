// js/celulares.js - VERSÃO LIMPA (Usa a configuração central)
import { getProdutos } from './supabase-config.js'

const WHATSAPP_NUMBER = "5561996684007"
let carrinho = []

// ====== CARRINHO (Lógica Padrão) ======
window.loadCart = function() {
    try {
        const saved = localStorage.getItem('carrinho')
        if (saved) { 
            carrinho = JSON.parse(saved)
            updateCartUI()
        }
    } catch (e) {
        console.error('❌ Erro ao carregar carrinho:', e)
    }
}

window.addToCart = function(nome, preco, img = null) {
    const existing = carrinho.find(item => item.nome === nome)
    const imagemFinal = img || 'https://placehold.co/100x100/f1f5f9/94a3b8?text=Foto'

    if (existing) {
        existing.quantidade++
    } else {
        carrinho.push({ nome, preco, quantidade: 1, img: imagemFinal })
    }
    
    saveCart()
    
    // Toast Notificação
    const toast = document.createElement('div')
    toast.className = 'position-fixed bottom-0 end-0 p-3'
    toast.style.zIndex = '9999'
    toast.innerHTML = `
        <div class="toast show border-0 shadow-lg rounded-3 overflow-hidden" style="background: white;">
            <div class="d-flex align-items-center p-3">
                <i class="bi bi-check-circle-fill text-success fs-4 me-3"></i>
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
    let msg = 'Olá! Gostaria de fazer o pedido:\n\n'
    carrinho.forEach(i => msg += `📦 ${i.quantidade}x ${i.nome} - R$ ${(i.preco * i.quantidade).toFixed(2)}\n`)
    const total = carrinho.reduce((sum, i) => sum + (i.preco * i.quantidade), 0)
    msg += `\n💰 *Total: R$ ${total.toFixed(2)}*`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
}

// ====== RENDERIZAÇÃO (Agora usa as classes do CSS central) ======
function renderProducts(productsToShow) {
    const container = document.getElementById('products-container')
    const countText = document.getElementById('product-count-text')
    
    if (!container) return

    if (productsToShow.length === 0) {
        if(countText) countText.textContent = '0 encontrados'
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search text-muted" style="font-size: 4rem; opacity: 0.2;"></i>
                <h4 class="mt-3 text-muted">Nenhum produto encontrado</h4>
            </div>`
        return
    }

    if(countText) countText.innerHTML = `<i class="bi bi-check-circle-fill text-success me-2"></i> ${productsToShow.length} produtos encontrados`

    container.innerHTML = productsToShow.map(p => {
        const nomeSafe = p.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;')
        const imgSafe = p.img || 'https://placehold.co/400x400/EEE/999?text=Sem+Foto'
        const detailsLink = `produto.html?id=${p.id}`
        
        let badgeHtml = ''
        if (p.badge) {
            let badgeClass = 'badge-novo'
            if (p.badge.toLowerCase().includes('oferta')) badgeClass = 'badge-oferta'
            else if (p.badge.toLowerCase().includes('hot')) badgeClass = 'badge-hot'
            badgeHtml = `<span class="product-badge ${badgeClass}">${p.badge}</span>`
        }
        
        const isEsgotado = p.esgotado || p.quantidade_estoque <= 0
        const btnHtml = isEsgotado
            ? `<button class="btn-bag bg-secondary" disabled><i class="bi bi-x-lg"></i></button>`
            : `<button class="btn-bag" onclick="event.stopPropagation(); window.addToCart('${nomeSafe}', ${p.preco_novo}, '${imgSafe}'); return false;">
                   <i class="bi bi-bag-plus"></i>
               </button>`

        const oldPriceHtml = p.preco_antigo > 0 
            ? `<div class="price-old">De R$ ${p.preco_antigo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>` 
            : '<div class="price-old">&nbsp;</div>'

        // Layout HTML idêntico ao celulares.html
        return `
        <div class="col-12 col-md-6 col-lg-4"> 
            <a href="${detailsLink}" class="text-decoration-none">
                <div class="product-card">
                    ${badgeHtml}
                    <div class="product-img-wrapper">
                        <img src="${imgSafe}" alt="${nomeSafe}" loading="lazy">
                    </div>
                    <div class="product-info d-flex flex-column h-100">
                        <div class="product-brand">${p.marca || 'TECH'}</div>
                        <h5 class="product-name">${p.nome}</h5>
                        <div class="price-section mt-auto">
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

let todosProdutos = [];

// ====== INICIALIZAÇÃO ======
async function loadProducts() {
    try {
        // Usa a função importada do config, não cria cliente novo
        todosProdutos = await getProdutos();
        renderProducts(todosProdutos);
    } catch (error) {
        console.error('Erro:', error)
        document.getElementById('products-container').innerHTML = `<div class="col-12 text-center py-5">Erro ao carregar.</div>`
    }
}

// ====== BUSCA ======
function setupProductSearch() {
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const search = e.target.value.toLowerCase()
            const filtered = todosProdutos.filter(p => 
                p.nome.toLowerCase().includes(search) ||
                p.marca.toLowerCase().includes(search)
            )
            renderProducts(filtered)
        })
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    window.loadCart()
    await loadProducts()
    setupProductSearch()
})