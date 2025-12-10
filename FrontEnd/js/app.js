// app.js - Carrinho Visual Premium (CORRIGIDO: updateCartUI GLOBAL)
import { getProdutos, getCards } from './supabase-config.js'

const WHATSAPP_NUMBER = "5561996684007"
let carrinho = []

// 1. CONTADORES
function initCounters() {
    const speed = 30;

    document.querySelectorAll('.counter').forEach(counter => {
        const targetText = counter.getAttribute('data-target');
        const target = +targetText;
        const symbol = targetText.includes('+') ? '+' : (targetText.includes('%') ? '%' : '');

        const updateCount = () => {
            const currentCount = +counter.innerText.replace(/[+%]/g, '');
            const increment = target / 100;

            if (currentCount < target) {
                let nextCount = Math.ceil(currentCount + increment);
                if (nextCount > target) nextCount = target;
                counter.innerText = nextCount;
                if (nextCount === target) {
                     counter.innerText = nextCount + symbol;
                }
                setTimeout(updateCount, speed);
            }
        };

        counter.innerText = '0';
        updateCount();
    });
}

// 2. RENDERIZAR CARDS HOME
async function renderDynamicSections() {
    const container = document.getElementById('dynamic-sections-container');
    if (!container) return;

    try {
        const [produtos, cards] = await Promise.all([ getProdutos(), getCards() ]);
        const activeCards = cards.filter(c => c.ativo).sort((a, b) => a.ordem - b.ordem);

        if (activeCards.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma coleção ativa.</p>';
            return;
        }

        container.innerHTML = ''; 

        activeCards.forEach(card => {
            const qtdProdutos = produtos.filter(p => p.card_id === card.id).length;
            let imageUrl = card.img && card.img.length > 10 ? card.img : 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80';
            const subtitle = card.subtitulo || `${qtdProdutos} produtos`;

            container.innerHTML += `
                <div class="col-md-4">
                    <a href="categoria.html?card=${card.id}" class="text-decoration-none">
                        <div class="cat-card" style="background-image: url('${imageUrl}');">
                            <div class="cat-overlay">
                                <h4>${card.titulo}</h4>
                                <p>${subtitle}</p>
                                <span class="btn-white-box">Confira <i class="bi bi-arrow-right ms-2"></i></span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
    } catch (error) { console.error(error); }
}

// 3. LÓGICA DO CARRINHO
window.loadCart = function() {
    const saved = localStorage.getItem('carrinho');
    if (saved) { 
        carrinho = JSON.parse(saved); 
        window.updateCartUI(); 
    }
}

window.addToCart = function(nome, preco, img = null) {
    const existing = carrinho.find(item => item.nome === nome);
    const imagemFinal = img && img.length > 10 ? img : 'https://placehold.co/100x100/f1f5f9/94a3b8?text=Foto';

    if (existing) {
        existing.quantidade++;
        if (imagemFinal.length > 20 && existing.img.includes('placehold')) existing.img = imagemFinal;
    } else {
        carrinho.push({ nome, preco, quantidade: 1, img: imagemFinal });
    }
    
    saveCart();
    
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '9999';
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
        </div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.updateQuantity = function(nome, change) {
    const item = carrinho.find(i => i.nome === nome);
    if (item) {
        item.quantidade += change;
        if (item.quantidade <= 0) window.removeFromCart(nome);
        else saveCart();
    }
}

window.removeFromCart = function(nome) {
    carrinho = carrinho.filter(item => item.nome !== nome);
    saveCart();
}

window.checkout = function() {
    if (carrinho.length === 0) return alert('Carrinho vazio!');
    let msg = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    carrinho.forEach(i => msg += `📦 ${i.quantidade}x ${i.nome} - R$ ${(i.preco * i.quantidade).toFixed(2)}\n`);
    const total = carrinho.reduce((sum, i) => sum + (i.preco * i.quantidade), 0);
    msg += `\n💰 *Total Geral: R$ ${total.toFixed(2)}*`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function saveCart() { 
    localStorage.setItem('carrinho', JSON.stringify(carrinho)); 
    window.updateCartUI(); 
}

// ✅ FUNÇÃO GLOBAL PARA ATUALIZAR UI DO CARRINHO
window.updateCartUI = function() {
    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItens;
        el.style.display = totalItens > 0 ? 'inline' : 'none';
    });

    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
        const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        cartTotal.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    }

    const container = document.getElementById('cart-items');
    if (container) {
        if (carrinho.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3 text-muted opacity-25">
                        <i class="bi bi-cart-x" style="font-size: 4rem;"></i>
                    </div>
                    <p class="fw-bold text-muted">Seu carrinho está vazio</p>
                </div>`;
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
            `).join('');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    initCounters();
    renderDynamicSections();
});