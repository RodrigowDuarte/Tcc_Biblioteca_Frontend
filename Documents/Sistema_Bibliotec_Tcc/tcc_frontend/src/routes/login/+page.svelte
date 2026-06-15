<script>
    import { api } from '$lib/api.js';

    let email = $state('');
    let password = $state('');
    let erro = $state('');
    let carregando = $state(false);

    async function login() {
        carregando = true;
        erro = '';
        try {
            const res = await api.login(email, password);
            if (res.token) {
                localStorage.setItem('token', res.token);
                window.location.href = '/';
            } else {
                erro = res.message || 'Credenciais invalidas';
            }
        } catch (e) {
            erro = 'Erro ao conectar com o servidor';
        }
        carregando = false;
    }
</script>

<div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f3f4f6;">
    <div style="background:white; padding:32px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); width:100%; max-width:400px;">
        <h1 style="text-align:center; font-size:24px; font-weight:bold; margin-bottom:24px;">Sistema de Biblioteca</h1>

        {#if erro}
            <div style="background:#fee2e2; color:#dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">{erro}</div>
        {/if}

        <div style="margin-bottom:16px;">
            <label for="email" style="display:block; font-size:14px; margin-bottom:4px;">E-mail</label>
            <input id="email" type="email" bind:value={email}
                style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px 12px; box-sizing:border-box;"
                placeholder="seu@email.com" />
        </div>

        <div style="margin-bottom:24px;">
            <label for="password" style="display:block; font-size:14px; margin-bottom:4px;">Senha</label>
            <input id="password" type="password" bind:value={password}
                style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px 12px; box-sizing:border-box;"
                placeholder="••••••••"
                onkeydown={(e) => e.key === 'Enter' && login()} />
        </div>

        <button onclick={login} disabled={carregando}
            style="width:100%; background:#2563eb; color:white; border:none; padding:10px; border-radius:4px; cursor:pointer; font-size:16px;">
            {carregando ? 'Entrando...' : 'Entrar'}
        </button>
    </div>
</div>
