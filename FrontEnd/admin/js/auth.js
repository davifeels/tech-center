// FrontEnd/admin/js/auth.js
import { 
    loginAdmin, 
    logoutAdmin,
    supabase 
} from './supabase-config.js' // ✅ CORRIGIDO

console.log('🔧 Auth.js carregado')

const loginForm = document.getElementById('loginForm')

// Detectar qual página estamos
const currentPath = window.location.pathname
const isLoginPage = currentPath.includes('index.html') || currentPath.endsWith('/admin/') || currentPath.endsWith('/admin')
const isDashboardPage = currentPath.includes('dashboard.html')

console.log('📍 Página atual:', {
    isLoginPage,
    isDashboardPage,
    path: currentPath
})

// ===========================================
// 1. LÓGICA DE LOGIN
// ===========================================
if (loginForm) {
    console.log('✅ Formulário de login encontrado')
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const btn = document.getElementById('btnLogin')
        const alertError = document.getElementById('alertError')
        const alertSuccess = document.getElementById('alertSuccess')
        const errorMessage = document.getElementById('errorMessage')
        
        console.log('🔐 Tentando fazer login com:', email)
        
        // Esconder alertas anteriores
        if (alertError) alertError.classList.remove('show')
        if (alertSuccess) alertSuccess.classList.remove('show')
        
        try {
            btn.disabled = true
            btn.innerHTML = '<i class="bi bi-hourglass-split"></i> <span>Entrando...</span>'
            
            const result = await loginAdmin(email, password)
            
            console.log('✅ Login bem-sucedido!', result)
            
            // Mostrar sucesso
            if (alertSuccess) {
                alertSuccess.classList.add('show')
            }
            
            btn.innerHTML = '<i class="bi bi-check-lg"></i> <span>Sucesso! Redirecionando...</span>'
            
            // Redirecionar para o dashboard
            setTimeout(() => {
                console.log('↪️ Redirecionando para dashboard...')
                window.location.href = './dashboard.html'
            }, 1000)
            
        } catch (error) {
            btn.disabled = false
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> <span>Entrar no Painel</span>'
            
            console.error('❌ Erro detalhado:', error)
            
            let errorText = 'Erro ao fazer login.'
            
            if (error.message.includes('Invalid login credentials')) {
                errorText = '❌ Email ou senha incorretos.'
            } else if (error.message.includes('Email not confirmed')) {
                errorText = '⚠️ Confirme seu email antes de fazer login.'
            } else if (error.message.includes('User not found')) {
                errorText = '⚠️ Usuário não encontrado. Crie uma conta no Supabase primeiro.'
            } else if (error.message.includes('Invalid API key')) {
                errorText = '🔑 Chave API inválida. Verifique o arquivo supabase-config.js'
            } else {
                errorText = error.message || 'Verifique suas credenciais.'
            }
            
            if (errorMessage) {
                errorMessage.textContent = errorText
            }
            
            if (alertError) {
                alertError.classList.add('show')
            }
        }
    })
} else {
    console.log('⚠️ Formulário de login não encontrado nesta página')
}

// ===========================================
// 2. LÓGICA DE LOGOUT
// ===========================================
window.logout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
        try {
            console.log('🚪 Fazendo logout...')
            await logoutAdmin()
            console.log('✅ Logout realizado com sucesso!')
            window.location.href = './index.html'
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error)
            alert('Erro ao sair. Tente novamente.')
        }
    }
}

// ===========================================
// 3. PROTEÇÃO DE ROTA
// ===========================================
console.log('🔒 Configurando proteção de rotas...')

// Verificar sessão inicial
supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('🔍 Sessão inicial:', session ? '✅ Ativa' : '❌ Nenhuma sessão')
    
    const user = session ? session.user : null
    
    // Se está logado E está na página de Login, redireciona para Dashboard
    if (user && isLoginPage) {
        console.log('↪️ Usuário logado detectado na página de login. Redirecionando...')
        window.location.href = './dashboard.html'
    } 
    
    // Se NÃO está logado E está no Dashboard, redireciona para Login
    if (!user && isDashboardPage) {
        console.log('↪️ Usuário não logado no dashboard. Redirecionando para login...')
        window.location.href = './index.html'
    }
})

// Monitorar mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
    const user = session ? session.user : null

    console.log('🔄 Auth State Changed:', {
        event,
        user: user ? '✅ Logado' : '❌ Deslogado',
        email: user?.email
    })

    // Se acabou de fazer login
    if (event === 'SIGNED_IN' && isLoginPage) {
        console.log('↪️ Login detectado! Redirecionando para dashboard...')
        setTimeout(() => {
            window.location.href = './dashboard.html'
        }, 500)
    }
    
    // Se acabou de fazer logout
    if (event === 'SIGNED_OUT' && isDashboardPage) {
        console.log('↪️ Logout detectado! Redirecionando para login...')
        setTimeout(() => {
            window.location.href = './index.html'
        }, 500)
    }
})