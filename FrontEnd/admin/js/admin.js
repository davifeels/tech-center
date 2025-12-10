// admin.js - VERSÃO COMPLETA E AJUSTADA PARA FLUXO FINAL COM MODAL CUSTOM E TOAST
import { 
    getProdutos, addProduto, updateProduto, deleteProduto, uploadImagemProduto, toggleEsgotado,
    getPedidos, addPedido, updatePedido, deletePedido,
    getClientes, addCliente, updateCliente, deleteCliente,
    checkAuth, logoutAdmin, getEstatisticas,
    getCards, addCard, updateCard, deleteCard, toggleCardAtivo
} from './supabase-config.js';

let todosProdutos = [];
let todosPedidos = [];
let todosClientes = [];
let todosCards = [];  

// ===========================================
// 1. FUNÇÃO DE NOTIFICAÇÃO (TOAST)
// ===========================================

/**
 * Exibe um Toast (alerta flutuante) no canto superior direito.
 * @param {string} title Título da mensagem (ex: "Sucesso!").
 * @param {string} message Mensagem de texto (ex: "Item salvo.").
 * @param {('success'|'danger'|'warning')} type Tipo do Toast para cor e ícone.
 */
window.showToast = (title, message, type = 'info', delay = 3000) => {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('Toast container não encontrado. Usando alert.');
        alert(`${title}: ${message}`);
        return;
    }

    let iconClass = 'bi-info-circle-fill';
    let iconColor = 'icon-info';
    let borderClass = type;

    if (type === 'danger') {
        iconClass = 'bi-x-circle-fill';
        iconColor = 'icon-danger';
    } else if (type === 'warning') {
        iconClass = 'bi-exclamation-triangle-fill';
        iconColor = 'icon-warning';
    } else if (type === 'success') {
        iconClass = 'bi-check-circle-fill';
        iconColor = 'icon-success';
    }

    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-dark border-0 toast-custom ${borderClass}`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    toastElement.setAttribute('data-bs-delay', delay);

    toastElement.innerHTML = `
        <div class="d-flex w-100">
            <div class="toast-body d-flex align-items-start">
                <i class="bi ${iconClass} toast-icon ${iconColor}"></i>
                <div>
                    <strong class="me-auto">${title}</strong>
                    <div class="text-muted small">${message}</div>
                </div>
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    container.appendChild(toastElement);
    
    // Inicializa o toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove o elemento do DOM após o fade out
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
};


// ===========================================
// 2. FUNÇÃO DE CONFIRMAÇÃO CUSTOMIZADA
// ===========================================

/**
 * Exibe um modal de confirmação customizado do Bootstrap.
 * @param {string} title Título do modal (ex: "Confirmação").
 * @param {string} message Mensagem de texto (ex: "Tem certeza que deseja excluir?").
 * @param {('danger'|'warning'|'info')} type Tipo de modal para cor e ícone.
 * @param {string} actionText Texto do botão de ação (ex: "Excluir").
 * @param {function} callback Função a ser executada se o usuário clicar em 'actionText'.
 */
window.customConfirm = (title, message, type, actionText, callback) => {
    const modalElement = document.getElementById('customConfirmModal');
    if (!modalElement) {
        if (confirm(message)) callback();
        return;
    }

    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
        modal = new bootstrap.Modal(modalElement);
    }
    
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    const confirmIcon = document.getElementById('confirmIcon');
    const confirmIconClass = document.getElementById('confirmIconClass');
    const actionBtn = document.getElementById('confirmActionBtn');

    // Resetar classes
    confirmIcon.className = 'confirm-icon-wrapper';
    actionBtn.className = 'btn-confirm-action';
    
    // Configurar cores, ícones e ações com base no tipo
    let iconClass = 'bi-question-circle-fill'; 
    let actionBtnClass = 'btn-primary-action';

    if (type === 'danger') {
        iconClass = 'bi-trash-fill';
        confirmIcon.classList.add('confirm-icon-danger');
        actionBtnClass = 'btn-danger-action';
    } else if (type === 'warning') { // Usado para "Sair do sistema"
        iconClass = 'bi-box-arrow-right';
        confirmIcon.classList.add('confirm-icon-warning');
        actionBtnClass = 'btn-warning-action'; // Ajustado para usar a nova classe CSS no dashboard.html
    } else { // info ou default
        iconClass = 'bi-check-circle-fill';
        confirmIcon.classList.add('confirm-icon-info');
    }

    confirmIconClass.className = 'bi ' + iconClass;
    actionBtn.classList.add(actionBtnClass);
    actionBtn.textContent = actionText;

    // Remover listeners antigos (para evitar múltiplas execuções)
    actionBtn.onclick = null; 

    // Adicionar novo listener
    actionBtn.onclick = () => {
        // O botão de ação no HTML não tem data-bs-dismiss, então forçamos o hide aqui.
        modal.hide(); 
        callback(); 
    };

    modal.show();
};


// ===========================================
// 3. FUNÇÕES GLOBAIS ESSENCIAIS (Ajustadas)
// ===========================================

// LOGOUT (Mantido, usa customConfirm no HTML)
window.logoutSistema = async () => {
    try {
        console.log('🚪 Fazendo logout...');
        await logoutAdmin();
        console.log('✅ Logout realizado com sucesso!');
        window.location.href = 'login.html'; 
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        window.showToast('Erro de Logout', 'Não foi possível sair. Tente novamente.', 'danger');
    }
};

// --- PRODUTOS ---
window.openModalProduto = async (produto = null) => {  
    const modal = document.getElementById('modalProduto');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('formProduto');
    
    form.reset();
    document.getElementById('imagePreviewDiv').innerHTML = ''; 
    
    await loadCardsIntoSelect(); 
    
    if (produto) {
        title.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Produto';
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('nome').value = produto.nome;
        document.getElementById('marca').value = produto.marca;
        
        document.getElementById('descricao').value = produto.descricao || ''; 
        
        document.getElementById('categoria').value = produto.categoria;
        document.getElementById('preco_novo').value = produto.preco_novo;
        document.getElementById('preco_antigo').value = produto.preco_antigo || '';
        document.getElementById('badge').value = produto.badge || '';
        document.getElementById('secao').value = produto.secao || 'todos';
        document.getElementById('reviews').value = produto.reviews || '';
        document.getElementById('quantidade_estoque').value = produto.quantidade_estoque || 0;
        document.getElementById('img').value = produto.img || '';
        document.getElementById('link').value = produto.link || '';
        document.getElementById('card-id').value = produto.card_id || ''; 
    } else {
        title.innerHTML = '<i class="bi bi-plus-circle-fill"></i> Adicionar Novo Produto';
        document.getElementById('produtoId').value = '';
    }
    modal.classList.add('show');
};

window.closeModalProduto = () => document.getElementById('modalProduto').classList.remove('show');

window.salvarProduto = async () => {
    try {
        const produtoId = document.getElementById('produtoId').value;
        const imageFile = document.getElementById('imagemFile').files[0];
        let imageUrl = document.getElementById('img').value;

        if (imageFile) { 
            imageUrl = await uploadImagemProduto(imageFile);
        } else if (!imageUrl) { 
            imageUrl = 'https://placehold.co/400x400/EEE/999?text=Sem+Imagem';
        }
        
        const badgeValue = document.getElementById('badge').value;
        let badgeColor = 'badge-azul';
        if (badgeValue === 'Oferta') badgeColor = 'badge-vermelho';
        else if (badgeValue === 'Hot') badgeColor = 'badge-amarelo';
        
        const quantidade = parseInt(document.getElementById('quantidade_estoque').value) || 0;
        const cardIdValue = document.getElementById('card-id').value;
        
        const finalCardId = cardIdValue ? cardIdValue : null;
        
        const descricaoTexto = document.getElementById('descricao').value;

        const produtoData = {
            nome: document.getElementById('nome').value,
            marca: document.getElementById('marca').value,
            descricao: descricaoTexto,
            categoria: document.getElementById('categoria').value,
            preco_novo: parseFloat(document.getElementById('preco_novo').value) || 0,
            preco_antigo: parseFloat(document.getElementById('preco_antigo').value) || 0,
            img: imageUrl,
            badge: badgeValue || null,
            badge_color: badgeColor,
            secao: document.getElementById('secao').value || 'todos',
            quantidade_estoque: quantidade,
            reviews: parseFloat(document.getElementById('reviews').value) || 0,
            link: document.getElementById('link')?.value || '#',
            esgotado: quantidade <= 0,
            card_id: finalCardId 
        };
        
        if (produtoId) { 
            await updateProduto(produtoId, produtoData);
            window.showToast('Sucesso!', 'Produto atualizado com sucesso!', 'success');
        } else { 
            await addProduto(produtoData);
            window.showToast('Sucesso!', 'Produto adicionado ao catálogo!', 'success');
        }
        
        window.closeModalProduto();
        await refreshAllData();
        
    } catch (error) {
        console.error('❌ ERRO DETALHADO ao salvar produto:', error);
        window.showToast('Erro ao Salvar', `Erro: ${error.message}`, 'danger');
    }
};

// EDITAR PRODUTO (CORRIGIDO PARA BUSCAR O PRODUTO CORRETAMENTE)
window.editarProduto = async (id) => {
    // Busca o produto na lista global, garantindo que o ID seja comparado corretamente (Number vs String)
    const produto = todosProdutos.find(p => String(p.id) === String(id)); 
    
    if (produto) { 
        window.openModalProduto(produto); // Abre o modal de edição com os dados
    } else { 
        // Se não encontrar (ID inválido ou produto não carregado)
        window.showToast('Erro!', 'Produto não encontrado para edição.', 'danger'); 
    }
};

// TOGGLEAR ESTOQUE (AJUSTADO para showToast)
window.togglearEstoque = async (id, esgotado) => {
    try {
        await toggleEsgotado(id, esgotado);
        const msg = esgotado ? 'Produto marcado como esgotado.' : 'Produto reativado em estoque!';
        window.showToast('Status Atualizado', msg, esgotado ? 'warning' : 'success');
        await refreshAllData();
    } catch (error) { 
        console.error('❌ Erro:', error); 
        window.showToast('Erro', 'Erro ao atualizar status do produto', 'danger');
    }
};

// EXCLUIR PRODUTO (Mantido)
window.excluirProduto = async (id) => {
    window.customConfirm(
        'Excluir Produto',
        'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
        'danger',
        'Sim, Excluir',
        async () => {
            try {
                await deleteProduto(id);
                window.showToast('Excluído!', 'Produto excluído com sucesso!', 'success');
                await refreshAllData();
            } catch (error) { 
                console.error('❌ Erro ao excluir:', error); 
                window.showToast('Erro', 'Erro ao excluir produto', 'danger');
            }
        }
    );
};


// --- PEDIDOS (Ajustado para showToast) ---

window.openModalPedido = (ped = null) => {
    document.getElementById('formPedido').reset();
    if (ped) {
        document.getElementById('pedId').value = ped.id;
        document.getElementById('pedClienteNome').value = ped.cliente_nome;
        document.getElementById('pedValor').value = ped.valor;
        document.getElementById('pedStatus').value = ped.status;
        document.getElementById('modalPedidoTitle').innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Pedido';
    } else {
        document.getElementById('pedId').value = '';
        document.getElementById('modalPedidoTitle').innerHTML = '<i class="bi bi-receipt"></i> Novo Pedido';
    }
    document.getElementById('modalPedido').classList.add('show');
};

window.closeModalPedido = () => document.getElementById('modalPedido').classList.remove('show');

window.editarPedido = async (id) => {
    const ped = todosPedidos.find(p => p.id == id);
    if(ped) window.openModalPedido(ped);
};

window.salvarPedidoForm = async () => {
    try {
        const id = document.getElementById('pedId').value;
        const dados = {
            cliente_nome: document.getElementById('pedClienteNome').value,
            valor: parseFloat(document.getElementById('pedValor').value) || 0,
            status: document.getElementById('pedStatus').value
        };
        if (id) await updatePedido(id, dados);
        else await addPedido(dados);
        
        document.getElementById('modalPedido').classList.remove('show');
        window.showToast('Sucesso!', 'Pedido salvo!', 'success');
        await refreshAllData();
    } catch (e) {
        console.error('❌ Erro ao salvar pedido:', e);
        window.showToast('Erro', `Erro ao salvar pedido: ${e.message}`, 'danger');
    }
};

// DELETAR PEDIDO (Mantido)
window.deletarPedido = async (id) => { 
    window.customConfirm(
        'Excluir Pedido',
        'Tem certeza que deseja excluir este pedido?',
        'danger',
        'Sim, Excluir',
        async () => {
            try {
                await deletePedido(id);
                window.showToast('Excluído!', 'Pedido excluído!', 'success');
                await refreshAllData();
            } catch (error) {
                console.error('❌ Erro ao excluir:', error);
                window.showToast('Erro', 'Erro ao excluir pedido', 'danger');
            }
        }
    );
};

// --- CLIENTES (Ajustado para showToast) ---
window.openModalCliente = (cli = null) => {
    document.getElementById('formCliente').reset();
    if (cli) {
        document.getElementById('cliId').value = cli.id;
        document.getElementById('cliNome').value = cli.nome;
        document.getElementById('cliEmail').value = cli.email;
        document.getElementById('cliTelefone').value = cli.telefone || '';
        document.getElementById('modalClienteTitle').innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Cliente';
    } else {
        document.getElementById('cliId').value = '';
        document.getElementById('modalClienteTitle').innerHTML = '<i class="bi bi-person-plus-fill"></i> Novo Cliente';
    }
    document.getElementById('modalCliente').classList.add('show');
};

window.closeModalCliente = () => document.getElementById('modalCliente').classList.remove('show');

window.editarCliente = async (id) => {
    const cli = todosClientes.find(c => c.id == id);
    if(cli) window.openModalCliente(cli);
};

window.salvarClienteForm = async () => {
    try {
        const id = document.getElementById('cliId').value;
        const dados = {
            nome: document.getElementById('cliNome').value,
            email: document.getElementById('cliEmail').value,
            telefone: document.getElementById('cliTelefone').value || null
        };
        
        if (id) await updateCliente(id, dados);
        else await addCliente(dados);
        
        document.getElementById('modalCliente').classList.remove('show');
        window.showToast('Sucesso!', 'Cliente salvo!', 'success');
        await refreshAllData();
    } catch (e) {
        console.error('❌ Erro ao salvar cliente:', e);
        window.showToast('Erro', `Erro ao salvar cliente: ${e.message}`, 'danger');
    }
};

// DELETAR CLIENTE (Mantido)
window.deletarCliente = async (id) => { 
    window.customConfirm(
        'Excluir Cliente',
        'Tem certeza que deseja excluir este cliente?',
        'danger',
        'Sim, Excluir',
        async () => {
            try {
                await deleteCliente(id);
                window.showToast('Excluído!', 'Cliente excluído!', 'success');
                await refreshAllData();
            } catch (error) {
                console.error('❌ Erro ao excluir:', error);
                window.showToast('Erro', 'Erro ao excluir cliente', 'danger');
            }
        }
    );
};

// =========================================== 
// CARDS - FUNÇÕES DE CRUD (Ajustado para showToast)
// ===========================================

window.openModalCard = (card = null) => {
    document.getElementById('formCard').reset();
    document.getElementById('cardImagePreviewDiv').innerHTML = '';
    
    if (card) {
        document.getElementById('cardId').value = card.id;
        document.getElementById('cardTitulo').value = card.titulo;
        document.getElementById('cardSubtitulo').value = card.subtitulo || '';
        document.getElementById('cardImg').value = card.img || '';
        document.getElementById('cardLink').value = card.link || '';
        document.getElementById('cardIcone').value = card.icone || '';
        document.getElementById('cardOrdem').value = card.ordem;
        document.getElementById('modalCardTitle').innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Coleção';
    } else {
        document.getElementById('cardId').value = '';
        document.getElementById('modalCardTitle').innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> Criar Nova Coleção Destaque';
        document.getElementById('cardOrdem').value = 1;
    }
    document.getElementById('modalCard').classList.add('show');
};

window.closeModalCard = () => document.getElementById('modalCard').classList.remove('show');

window.editarCard = async (id) => {
    const card = todosCards.find(c => c.id == id);
    if(card) window.openModalCard(card);
    else window.showToast('Erro!', 'Card não encontrado para edição.', 'danger');
};

window.salvarCardForm = async () => {
    try {
        const id = document.getElementById('cardId').value;
        const imageFile = document.getElementById('cardImagemFile').files[0];
        let imageUrl = document.getElementById('cardImg').value;
        
        if (imageFile) {
            imageUrl = await uploadImagemProduto(imageFile);
        } else if (!imageUrl) {
            window.showToast('Atenção!', 'Adicione uma imagem (upload ou URL)!', 'warning');
            return;
        }
        
        const dados = {
            titulo: document.getElementById('cardTitulo').value,
            subtitulo: document.getElementById('cardSubtitulo').value || null,
            img: imageUrl,
            link: document.getElementById('cardLink').value,
            icone: document.getElementById('cardIcone').value || null,
            ordem: parseInt(document.getElementById('cardOrdem').value) || 1,
            ativo: true
        };
        
        if (id) await updateCard(id, dados);
        else await addCard(dados);
        
        document.getElementById('modalCard').classList.remove('show');
        window.showToast('Sucesso!', 'Coleção salva!', 'success');
        await refreshAllData();
    } catch (e) {
        console.error('❌ Erro ao salvar card:', e);
        window.showToast('Erro', `Erro: ${e.message}`, 'danger');
    }
};

window.togglearCard = async (id, ativo) => {
    try {
        await toggleCardAtivo(id, ativo);
        await refreshAllData();
    } catch (error) {
        console.error('❌ Erro:', error);
        window.showToast('Erro', 'Erro ao atualizar status do card', 'danger');
    }
};

// DELETAR CARD (Mantido)
window.deletarCard = async (id) => {
    window.customConfirm(
        'Excluir Coleção',
        'Tem certeza que deseja excluir esta coleção? Os produtos associados não serão excluídos.',
        'danger',
        'Sim, Excluir',
        async () => {
            try {
                await deleteCard(id);
                window.showToast('Excluído!', 'Coleção excluída!', 'success');
                await refreshAllData();
            } catch (error) {
                console.error('❌ Erro ao excluir:', error);
                window.showToast('Erro', 'Erro ao excluir coleção', 'danger');
            }
        }
    );
};

// Funções Auxiliares de Cards (Mantidas)
async function loadCardsIntoSelect() {
    try {
        const cardsToUse = todosCards.length > 0 ? todosCards : await getCards(); 
        const select = document.getElementById('card-id');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">Nenhum Destaque</option>';
        
        cardsToUse.forEach(c => { 
            if (c.ativo) { 
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = `${c.icone ? getIconEmoji(c.icone) : ''} ${c.titulo}`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('❌ Erro ao carregar cards no select:', error);
    }
}

function getCardName(cardId) {
    const card = todosCards.find(c => c.id == cardId);
    return card ? card.titulo : 'Card';
}

function getIconEmoji(iconClass) {
    switch(iconClass) {
        case 'bi-fire': return '🔥';
        case 'bi-star-fill': return '⭐';
        case 'bi-lightning-fill': return '⚡';
        case 'bi-box-seam': return '📦';
        case 'bi-gift-fill': return '🎁';
        default: return '🏷️';
    }
}

// ===========================================
// 4. FUNÇÕES DE IMAGEM (Ajustado para showToast)
// ===========================================

window.previewImage = (event) => {
    const file = event.target.files[0];
    const previewDiv = document.getElementById('imagePreviewDiv');
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewDiv.innerHTML = `
                <div style="max-width: 200px; margin: 1rem 0;">
                    <img src="${e.target.result}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" alt="Preview">
                    <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
                        <i class="bi bi-check-circle-fill" style="color: var(--success);"></i>
                        Imagem selecionada!
                    </p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        window.showToast('Atenção!', 'Por favor, selecione uma imagem válida (PNG, JPG, WebP).', 'warning');
    }
};

// ===========================================
// 5. RENDERIZAÇÃO (Mantido)
// ===========================================

function renderProdutos(lista) {
    const container = document.getElementById('listaProdutos');
    
    if (lista.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 0; color: var(--gray-600);">
                <i class="bi bi-inbox" style="font-size: 4rem; display: block; margin-bottom: 1rem;"></i>
                <h3 style="font-weight: 600; margin-bottom: 0.5rem;">Nenhum produto encontrado</h3>
                <p>Adicione produtos para começar a gerenciar seu catálogo</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lista.map(p => {
        const isEsgotado = p.esgotado || p.quantidade_estoque <= 0;
        const opacity = isEsgotado ? 'opacity: 0.6;' : '';
        const statusClass = isEsgotado ? 'esgotado' : 'disponivel';
        const statusText = isEsgotado ? 'Esgotado' : 'Disponível';
        
        const badgeHtml = p.badge ? `<span class="badge badge-produto ${p.badge_color || 'badge-azul'}">${p.badge}</span>` : '';
        
        const rating = p.reviews || 0;
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating % 1) >= 0.5;
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) starsHtml += '<i class="bi bi-star-fill" style="color: #fbbf24;"></i>';
            else if (i === fullStars && hasHalfStar) starsHtml += '<i class="bi bi-star-half" style="color: #fbbf24;"></i>';
            else starsHtml += '<i class="bi bi-star" style="color: #cbd5e1;"></i>';
        }
        
        const toggleText = isEsgotado ? 'Reativar' : 'Esgotar';
        
        const cardBadge = p.card_id ? `<span class="badge badge-info" style="margin-left: 0.5rem; color: #1e40af; background: #dbeafe;">📌 ${getCardName(p.card_id)}</span>` : '';
        
        // CORRIGIDO: Passando p.id como string para o JS
        return `
        <div class="produto-card" style="${opacity}">
            <div class="produto-img">
                <img src="${p.img || 'https://placehold.co/120x120?text=Sem+Imagem'}" alt="${p.nome}" onerror="this.src='https://placehold.co/120x120?text=Sem+Imagem'">
            </div>
            
            <div class="produto-info">
                <h4>
                    ${p.nome}
                    ${badgeHtml}
                    ${cardBadge}
                </h4>
                
                <div class="produto-meta">
                    <span><i class="bi bi-tag-fill"></i> ${p.marca}</span>
                    <span><i class="bi bi-folder-fill"></i> ${p.categoria}</span>
                    <span><i class="bi bi-box-seam"></i> Estoque: ${p.quantidade_estoque || 0}</span>
                </div>
                
                ${p.preco_antigo > 0 ? `<div style="text-decoration: line-through; color: var(--gray-600); font-size: 0.9rem;">R$ ${p.preco_antigo.toFixed(2)}</div>` : ''}
                <div class="produto-preco">R$ ${p.preco_novo.toFixed(2)}</div>
                
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                    ${starsHtml}
                    <span style="font-size: 0.85rem; color: var(--gray-600);">(${rating.toFixed(1)})</span>
                </div>
                
                <span class="produto-status ${statusClass}">
                    <i class="bi bi-circle-fill"></i>
                    ${statusText}
                </span>
            </div>
            
            <div class="produto-actions"> 
                <button class="btn-action btn-editar" onclick="window.editarProduto('${p.id}')">
                    <i class="bi bi-pencil-fill"></i> Editar
                </button>
                
                <button class="btn-action btn-toggle" onclick="window.customConfirm('Alterar Estoque', 'Deseja realmente marcar como ${toggleText}?', '${isEsgotado ? 'warning' : 'danger'}', '${toggleText}', () => window.togglearEstoque('${p.id}', ${!isEsgotado}))">
                    <i class="bi bi-arrow-repeat"></i> ${toggleText}
                </button>
                
                <button class="btn-action btn-excluir" onclick="window.excluirProduto('${p.id}')">
                    <i class="bi bi-trash-fill"></i> Excluir
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function renderPedidos(lista, filtro = 'Todos') {
    const tbody = document.getElementById('tabelaPedidos');
    
    let listaFiltrada = lista;
    if (filtro !== 'Todos') {
        listaFiltrada = lista.filter(p => p.status === filtro);
    }
    
    if (listaFiltrada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4">Nenhum pedido em status "${filtro}" encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaFiltrada.map(p => {
        let badgeClass = 'info';
        if (p.status === 'Entregue') badgeClass = 'success';
        if (p.status === 'Cancelado') badgeClass = 'danger';
        if (p.status === 'Processando') badgeClass = 'warning';
        
        return `
        <tr>
            <td><strong>#${p.id ? p.id.toString().substring(0, 6) : 'N/A'}</strong></td>
            <td>${p.cliente_nome || 'Desconhecido'}</td>
            <td>R$ ${parseFloat(p.valor || 0).toFixed(2).replace('.', ',')}</td>
            <td><span class="badge ${badgeClass}">${p.status}</span></td>
            <td>${p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view"><i class="bi bi-eye"></i></button>
                    <button class="btn-icon edit" onclick="window.editarPedido('${p.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon delete" onclick="window.deletarPedido('${p.id}')"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderClientes(lista) {
    const tbody = document.getElementById('tabelaClientes');
    
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4">Nenhum cliente cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(c => {
        return `
        <tr>
            <td>#${c.id.toString().substring(0, 3)}</td>
            <td><strong>${c.nome || 'N/A'}</strong></td>
            <td>${c.email || 'N/A'}</td>
            <td>${c.telefone || '-'}</td>
            <td><span class="badge info">${c.compras_count || 0} pedidos</span></td>
            <td>R$ ${(c.total_gasto || 0).toFixed(2).replace('.', ',')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view"><i class="bi bi-eye"></i></button>
                    <button class="btn-icon edit" onclick="window.editarCliente('${c.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon delete" onclick="window.deletarCliente('${c.id}')"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderCards(lista) {
    const container = document.getElementById('listaCards');
    const cardsAtivos = lista.filter(c => c.ativo).sort((a, b) => a.ordem - b.ordem);

    if (cardsAtivos.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 4rem 0; color: var(--gray-600); grid-column: 1/-1;"><i class="bi bi-grid-3x3-gap" style="font-size: 4rem; display: block; margin-bottom: 1rem;"></i><h3 style="font-weight: 600; margin-bottom: 0.5rem;">Nenhuma coleção criada</h3><p>Crie coleções para agrupar os produtos de destaque na Home.</p></div>';
        return;
    }
    
    container.innerHTML = cardsAtivos.map(c => {
        const produtosCount = todosProdutos.filter(p => p.card_id == c.id).length;
        const icone = c.icone || 'bi-bookmark-star-fill';
        const checked = c.ativo ? 'checked' : '';
        const subtitulo = c.subtitulo || 'Sem subtítulo';
        const linkInfo = c.link ? '<p class="text-muted small"><i class="bi bi-link"></i> ' + c.link + '</p>' : '';
        const imgPreview = c.img ? '<div class="card-img-preview"><img src="' + c.img + '" alt="' + c.titulo + '"></div>' : '';
        
        return '<div class="card h-100"><div class="card-body">' + 
               imgPreview +
               '<div class="d-flex justify-content-between align-items-start mb-3">' +
               '<i class="bi ' + icone + ' fs-1 text-primary"></i>' +
               '<div class="form-check form-switch">' +
               `<input class="form-check-input" type="checkbox" ${checked} onchange="window.togglearCard('${c.id}', this.checked)">` +
               '</div></div>' +
               '<h5>' + c.titulo + '</h5>' +
               '<p class="text-muted small">' + subtitulo + '</p>' +
               linkInfo +
               '<p class="mb-3"><strong>' + produtosCount + '</strong> produtos associados</p>' +
               '<small class="text-muted">Ordem: ' + c.ordem + '</small>' +
               '<div class="d-flex gap-2 mt-3">' +
               // Botões de Card AJUSTADOS
               `<button class="btn btn-sm btn-primary flex-fill" onclick="window.editarCard('${c.id}')"><i class="bi bi-pencil-fill"></i> Editar</button>` +
               `<button class="btn btn-sm btn-danger" onclick="window.deletarCard('${c.id}')"><i class="bi bi-trash-fill"></i></button>` +
               '</div></div></div>';
    }).join('');
}

// Funções utilitárias (Mantidas)
async function refreshAllData() {
    try {
        // Tenta carregar os dados
        const [produtosData, pedidosData, clientesData, cardsData] = await Promise.all([
            getProdutos(),
            getPedidos(),
            getClientes(),
            getCards()
        ]);
        
        // Atualiza as variáveis globais
        todosProdutos = produtosData;
        todosPedidos = pedidosData;
        todosClientes = clientesData;
        todosCards = cardsData;
        
        const currentSection = document.querySelector('.sidebar-menu a.active')?.dataset.section;
        
        await updateStats();
        
        if (currentSection === 'produtos') renderProdutos(todosProdutos);
        if (currentSection === 'cards') renderCards(todosCards); 
        if (currentSection === 'pedidos') renderPedidos(todosPedidos, 'Todos');
        if (currentSection === 'clientes') renderClientes(todosClientes);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar dados:', error);
        window.showToast('Erro de Conexão', 'Não foi possível carregar os dados. Verifique o Supabase.', 'danger', 5000);
    }
}

async function updateStats() {
    try {
        const stats = await getEstatisticas();
        
        document.getElementById('totalProdutos').textContent = stats.total;
        document.getElementById('emEstoqueCount').textContent = stats.emEstoque;
        document.getElementById('totalClientesCount').textContent = stats.esgotados;
        document.getElementById('faturamentoTotal').textContent = 'R$ ' + stats.valorTotal.toLocaleString('pt-BR', {
            minimumFractionDigits: 2
        });
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a[data-section]');
    const sections = document.querySelectorAll('.section-content');
    const titles = {
        'dashboard': ['Dashboard', 'Bem-vindo ao painel administrativo'],
        'produtos': ['Produtos', 'Gerencie todos os produtos da loja'],
        'cards': ['Cards da Home', 'Gerencie os cards que aparecem na home'],
        'pedidos': ['Pedidos', 'Visualize e gerencie os pedidos'],
        'clientes': ['Clientes', 'Gerencie seus clientes'],
        'configuracoes': ['Configurações', 'Personalize seu sistema']
    };

    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const section = link.dataset.section;

            if (!titles[section]) return;

            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            link.classList.add('active');
            
            const targetSection = document.getElementById('section-' + section);
            if (targetSection) {
                 targetSection.classList.add('active');
            }


            document.getElementById('pageTitle').textContent = titles[section][0];
            document.getElementById('pageSubtitle').textContent = titles[section][1];
            
            if (section === 'produtos') await renderProdutos(todosProdutos);
            if (section === 'cards') await renderCards(todosCards);
            if (section === 'pedidos') await renderPedidos(todosPedidos, 'Todos');
            if (section === 'clientes') await renderClientes(todosClientes);
        });
    });
    
    document.querySelectorAll('.filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filtro = btn.textContent.trim();
            renderPedidos(todosPedidos, filtro);
        });
    });
    
    const initialSection = 'dashboard';
    const initialLink = document.querySelector(`.sidebar-menu a[data-section="${initialSection}"]`);
    if(initialLink) {
        document.getElementById('pageTitle').textContent = titles[initialSection][0];
        document.getElementById('pageSubtitle').textContent = titles[initialSection][1];
    }
}

function setupProductSearch() {
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filtrados = todosProdutos.filter(p => 
            p.nome.toLowerCase().includes(search) ||
            p.marca.toLowerCase().includes(search)
        );
        renderProdutos(filtrados);
    });
}

// ===========================================
// 6. INICIALIZAÇÃO (Mantido)
// ===========================================

document.addEventListener('DOMContentLoaded', async () => {
    
    const user = await checkAuth();
    if (!user) {
        return;
    }
    
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userName').textContent = user.email.split('@')[0];
    
    setupNavigation();
    // É CRÍTICO que o refreshAllData seja chamado antes de qualquer ação de edição
    await refreshAllData(); 
    setupProductSearch();
});