<script>
    let { children } = $props();
    
    function logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
</script>

{#if token}
<nav style="background:#1f2937; color:white; padding:12px 24px; disFplay:flex; justify-content:space-between; align-items:center;">
    <a href="/" style="color:white; text-decoration:none; font-size:20px; font-weight:bold;">Biblioteca</a>
    <div style="display:flex; gap:16px; align-items:center;">
        <a href="/alunos" style="color:white; text-decoration:none;">Membros</a>
        <a href="/livros" style="color:white; text-decoration:none;">Livros</a>
        <a href="/emprestimos" style="color:white; text-decoration:none;">Emprestimos</a>
        <a href="/inadimplentes" style="color:white; text-decoration:none;">Inadimplentes</a>
        <a href="/turmas" style="color:white; text-decoration:none;">Turmas</a>
        <a href="/localizacao" style="color:white; text-decoration:none;">Localização</a>


        <a href="/historico" style="color:white; text-decoration:none;">Historico</a>
        <button onclick={logout} style="background:#dc2626; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Sair</button>
    </div>
</nav>
{/if}

<main style="max-width:1200px; margin:0 auto; padding:24px;">
    {@render children()}
</main>