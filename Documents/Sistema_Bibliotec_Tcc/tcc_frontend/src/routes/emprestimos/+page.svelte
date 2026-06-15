<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';

    let emprestimos = $state([]);
    let turmas = $state([]);
    let alunos = $state([]);
    let livros = $state([]);
    let carregando = $state(true);
    let busca = $state('');
    let buscaAluno = $state('');
    let buscaLivro = $state('');
    let alunoSelecionado = $state(null);
    let livroSelecionado = $state(null);
    let dias = $state(7);
    let mensagem = $state('');
    let erro = $state('');
    let turmasExpandidas = $state(new Set());

    onMount(async () => { await carregar(); });

    async function carregar() {
        carregando = true;
        [emprestimos, alunos, livros, turmas] = await Promise.all([
            api.getEmprestimos(),
            api.getAlunos(),
            api.getLivros(),
            api.getTurmas()
        ]);
        carregando = false;
    }

    async function emprestar() {
        if (!alunoSelecionado || !livroSelecionado) { erro = 'Selecione um membro e um livro!'; return; }
        const res = await api.emprestar({ aluno_id: alunoSelecionado.id, livro_id: livroSelecionado.id, dias });
        if (res.id) {
            mensagem = 'Livro emprestado com sucesso!';
            alunoSelecionado = null; livroSelecionado = null; buscaAluno = ''; buscaLivro = '';
            await carregar();
        } else { erro = res.message || 'Erro ao emprestar'; }
    }

    async function devolver(emprestimo_id) {
        if (confirm('Confirmar devolução?')) {
            await api.devolver({ emprestimo_id });
            mensagem = 'Livro devolvido com sucesso!';
            await carregar();
        }
    }

    function toggleTurma(nome) {
        const novo = new Set(turmasExpandidas);
        novo.has(nome) ? novo.delete(nome) : novo.add(nome);
        turmasExpandidas = novo;
    }

    function selecionarAluno(aluno) {
        alunoSelecionado = aluno;
        buscaAluno = aluno.nome;
    }

    function selecionarLivro(livro) {
        livroSelecionado = livro;
        buscaLivro = livro.nome;
    }

    let alunosFiltrados = $derived(
        buscaAluno.length > 0 && !alunoSelecionado
            ? alunos.filter(a => a.nome.toLowerCase().includes(buscaAluno.toLowerCase()))
            : []
    );

    let livrosFiltrados = $derived(
        buscaLivro.length > 0 && !livroSelecionado
            ? livros.filter(l => l.nome.toLowerCase().includes(buscaLivro.toLowerCase()) && l.quantidade_disponivel > 0)
            : []
    );

    let emprestimosFiltrados = $derived(emprestimos.filter(e =>
        e.livro?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        e.aluno?.nome?.toLowerCase().includes(busca.toLowerCase())
    ));

    let emprestimosPorTurma = $derived(() => {
        const grupos = {};
        for (const t of turmas) {
            const ativos = emprestimos.filter(e => e.aluno?.turma === t.nome);
            if (ativos.length > 0) grupos[t.nome] = ativos;
        }
        const semTurma = emprestimos.filter(e => !e.aluno?.turma);
        if (semTurma.length > 0) grupos['Sem turma'] = semTurma;
        return grupos;
    });
</script>

<div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
    <a href="/" style="background:#e5e7eb; color:#1f2937; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:14px;">← Voltar</a>
    <h1 style="font-size:24px; font-weight:bold;">Empréstimos</h1>
</div>

{#if mensagem}
    <div style="background:#dcfce7; color:#16a34a; padding:12px; border-radius:4px; margin-bottom:16px;">{mensagem}</div>
{/if}
{#if erro}
    <div style="background:#fee2e2; color:#dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">{erro}</div>
{/if}

<div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
    <!-- Emprestar -->
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px;">
        <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">Emprestar Livro</h2>
        <div style="margin-bottom:12px;">
            <label style="display:block; margin-bottom:4px;">Buscar Membro</label>
            <input
                value={buscaAluno}
                oninput={(e) => { buscaAluno = e.target.value; alunoSelecionado = null; }}
                placeholder="Digite o nome..."
                style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            {#if alunosFiltrados.length > 0}
            <div style="border:1px solid #d1d5db; border-radius:4px; max-height:150px; overflow-y:auto; background:white;">
                {#each alunosFiltrados as aluno}
                <div onclick={() => selecionarAluno(aluno)}
                    style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #f3f4f6;">
                    <span style="font-weight:500;">{aluno.nome}</span>
                    {#if aluno.turma}<span style="color:#6b7280; font-size:13px;"> — {aluno.turma}</span>{/if}
                    <span style="background:{aluno.tipo === 'professor' ? '#7c3aed' : '#2563eb'}; color:white; padding:1px 6px; border-radius:4px; font-size:11px; margin-left:4px;">{aluno.tipo}</span>
                </div>
                {/each}
            </div>
            {/if}
            {#if alunoSelecionado}
                <div style="background:#dbeafe; padding:6px 10px; border-radius:4px; margin-top:4px; font-size:14px; display:flex; justify-content:space-between; align-items:center;">
                    <span>Selecionado: <strong>{alunoSelecionado.nome}</strong></span>
                    <button onclick={() => { alunoSelecionado = null; buscaAluno = ''; }}
                        style="background:none; border:none; color:#2563eb; cursor:pointer; font-size:16px;">×</button>
                </div>
            {/if}
        </div>
        <div style="margin-bottom:12px;">
            <label style="display:block; margin-bottom:4px;">Buscar Livro</label>
            <input
                value={buscaLivro}
                oninput={(e) => { buscaLivro = e.target.value; livroSelecionado = null; }}
                placeholder="Digite o título..."
                style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            {#if livrosFiltrados.length > 0}
            <div style="border:1px solid #d1d5db; border-radius:4px; max-height:150px; overflow-y:auto; background:white;">
                {#each livrosFiltrados as livro}
                <div onclick={() => selecionarLivro(livro)}
                    style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #f3f4f6;">
                    <span style="font-weight:500;">{livro.nome}</span>
                    <span style="color:#6b7280; font-size:13px;"> — Disponível: {livro.quantidade_disponivel}</span>
                </div>
                {/each}
            </div>
            {/if}
            {#if livroSelecionado}
                <div style="background:#dbeafe; padding:6px 10px; border-radius:4px; margin-top:4px; font-size:14px; display:flex; justify-content:space-between; align-items:center;">
                    <span>Selecionado: <strong>{livroSelecionado.nome}</strong></span>
                    <button onclick={() => { livroSelecionado = null; buscaLivro = ''; }}
                        style="background:none; border:none; color:#2563eb; cursor:pointer; font-size:16px;">×</button>
                </div>
            {/if}
        </div>
        <div style="margin-bottom:16px;">
            <label style="display:block; margin-bottom:4px;">Prazo (dias)</label>
            <input bind:value={dias} type="number" min="1"
                style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <button onclick={emprestar}
            style="width:100%; background:#2563eb; color:white; border:none; padding:10px; border-radius:4px; cursor:pointer;">
            Emprestar
        </button>
    </div>

    <!-- Empréstimos Ativos -->
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px;">
        <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">Empréstimos Ativos</h2>
        <input bind:value={busca} placeholder="Pesquisar..."
            style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; margin-bottom:12px;" />
        {#if carregando}
            <p>Carregando...</p>
        {:else if emprestimosFiltrados.length === 0}
            <div style="padding:24px; text-align:center; color:#6b7280;">Nenhum empréstimo ativo.</div>
        {:else}
            {#each emprestimosFiltrados as e}
            <div style="border:1px solid {e.atrasado ? '#dc2626' : '#e5e7eb'}; border-radius:4px; padding:12px; margin-bottom:8px; background:{e.atrasado ? '#fee2e2' : 'white'};">
                <div style="font-weight:bold;">{e.livro?.nome}</div>
                <div style="font-size:14px; color:#6b7280;">{e.aluno?.nome}{e.aluno?.turma ? ' — ' + e.aluno.turma : ''}</div>
                <div style="font-size:12px; margin-top:4px;">
                    Devolver até: {new Date(e.data_prevista_devolucao).toLocaleDateString('pt-BR')}
                    {#if e.atrasado}<span style="color:#dc2626; font-weight:bold;"> — ATRASADO</span>{/if}
                </div>
                <button onclick={() => devolver(e.id)}
                    style="margin-top:8px; background:#d97706; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;">
                    Devolver
                </button>
            </div>
            {/each}
        {/if}
    </div>
</div>

<!-- Empréstimos por Turma (expansível) -->
{#if !carregando}
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px;">
    <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">Empréstimos Ativos por Turma</h2>
    {#if Object.keys(emprestimosPorTurma()).length === 0}
        <div style="padding:24px; text-align:center; color:#6b7280;">Nenhum empréstimo ativo.</div>
    {:else}
    {#each Object.entries(emprestimosPorTurma()) as [nomeTurma, empsTurma]}
    {@const temAtrasado = empsTurma.some(e => e.atrasado)}
    {@const expandida = turmasExpandidas.has(nomeTurma)}
    <div style="border:1px solid {temAtrasado ? '#fca5a5' : '#e5e7eb'}; border-radius:6px; margin-bottom:8px; overflow:hidden;">
        <div onclick={() => toggleTurma(nomeTurma)}
            style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; cursor:pointer; background:{temAtrasado ? '#fff5f5' : '#f9fafb'};">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; font-size:16px;">{nomeTurma}</span>
                <span style="background:#2563eb; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                    {empsTurma.length} empréstimo{empsTurma.length !== 1 ? 's' : ''}
                </span>
                {#if temAtrasado}
                    <span style="background:#dc2626; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                        atrasado
                    </span>
                {/if}
            </div>
            <span style="font-size:18px; color:#6b7280;">{expandida ? '▲' : '▼'}</span>
        </div>
        {#if expandida}
        <div style="padding:12px 16px; border-top:1px solid #e5e7eb;">
            {#each empsTurma as e}
            <div style="border:1px solid {e.atrasado ? '#dc2626' : '#e5e7eb'}; border-radius:4px; padding:10px; margin-bottom:8px; background:{e.atrasado ? '#fee2e2' : 'white'}; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:bold; font-size:14px;">{e.livro?.nome}</div>
                    <div style="font-size:13px; color:#6b7280;">{e.aluno?.nome}</div>
                    <div style="font-size:12px; margin-top:2px;">
                        Devolver até: {new Date(e.data_prevista_devolucao).toLocaleDateString('pt-BR')}
                        {#if e.atrasado}<span style="color:#dc2626; font-weight:bold;"> — ATRASADO</span>{/if}
                    </div>
                </div>
                <button onclick={() => devolver(e.id)}
                    style="background:#d97706; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:13px;">
                    Devolver
                </button>
            </div>
            {/each}
        </div>
        {/if}
    </div>
    {/each}
    {/if}
</div>
{/if}
