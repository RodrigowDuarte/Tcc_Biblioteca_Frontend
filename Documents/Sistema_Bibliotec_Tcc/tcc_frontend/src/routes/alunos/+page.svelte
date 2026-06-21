<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';

    let alunos = $state([]);
    let turmas = $state([]);
    let busca = $state('');
    let carregando = $state(true);
    let mostrarForm = $state(false);
    let editando = $state(null);
    let turmasExpandidas = $state(new Set());

    let form = $state({
        nome: '', turma: '', tipo: 'aluno', cpf: '', telefone: '', email: '', endereco: ''
    });

    onMount(async () => { await carregar(); });

    async function carregar() {
        carregando = true;
        [alunos, turmas] = await Promise.all([api.getAlunos(), api.getTurmas()]);
        carregando = false;
    }

    async function salvar() {
        if (editando) {
            await api.updateAluno(editando.id, form);
        } else {
            await api.createAluno(form);
        }
        mostrarForm = false;
        editando = null;
        form = { nome: '', turma: '', tipo: 'aluno', cpf: '', telefone: '', email: '', endereco: '' };
        await carregar();
    }

    function editar(aluno) {
        editando = aluno;
        form = { ...aluno };
        mostrarForm = true;
    }

    async function remover(id) {
        if (confirm('Remover Membro?')) {
            const res = await api.deleteAluno(id);
            if (res.message === 'Aluno possui emprestimos ativos!') {
                alert('Não é possível remover: membro possui empréstimos ativos!');
                return;
            }
            await carregar();
        }
    }

    function toggleTurma(nome) {
        const novo = new Set(turmasExpandidas);
        novo.has(nome) ? novo.delete(nome) : novo.add(nome);
        turmasExpandidas = novo;
    }

    let filtrados = $derived(alunos.filter(a =>
        a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        a.cpf?.includes(busca) ||
        a.turma?.toLowerCase().includes(busca.toLowerCase())
    ));

    // Estatísticas
    let stats = $derived({
        total: alunos.length,
        inadimplentes: alunos.filter(a => a.inadimplente).length,
        comLivro: alunos.filter(a => a.tem_emprestimo && !a.inadimplente).length,
        emDia: alunos.filter(a => !a.tem_emprestimo).length,
    });

    // Agrupar por turma
    let grupos = $derived(() => {
        const g = {};
        for (const t of turmas) {
            const membros = filtrados.filter(a => a.turma === t.nome);
            if (membros.length > 0) g[t.nome] = { descricao: t.descricao, membros };
        }
        const semTurma = filtrados.filter(a => !a.turma);
        if (semTurma.length > 0) g['Sem turma'] = { descricao: '', membros: semTurma };
        return g;
    });

    //  expandir todos
    $effect(() => {
        if (busca.length > 0) {
            turmasExpandidas = new Set([...Object.keys(grupos()), 'Sem turma']);
        }
    });
</script>

<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
    <div style="display:flex; align-items:center; gap:12px;">
        <a href="/" style="background:#e5e7eb; color:#1f2937; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; text-decoration:none; font-size:14px;">← Voltar</a>
        <h1 style="font-size:24px; font-weight:bold;">Membros</h1>
        <span style="background:#e5e7eb; color:#374151; padding:2px 10px; border-radius:999px; font-size:13px;">{alunos.length} no total</span>
    </div>
    <button onclick={() => { mostrarForm = true; editando = null; form = { nome: '', turma: '', tipo: 'aluno', cpf: '', telefone: '', email: '', endereco: '' }; }}
        style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
        Novo Membro
    </button>
</div>

<!-- Estatísticas -->
{#if !carregando}
<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:20px;">
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #2563eb;">
        <div style="font-size:28px; font-weight:bold; color:#2563eb;">{stats.total}</div>
        <div style="font-size:13px; color:#2563eb; margin-top:2px;">Total de membros</div>
    </div>
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #16a34a;">
        <div style="font-size:28px; font-weight:bold; color:#16a34a;">{stats.emDia}</div>
        <div style="font-size:13px; color:#16a34a; margin-top:2px;">Em dia</div>
    </div>
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #d97706;">
        <div style="font-size:28px; font-weight:bold; color:#d97706;">{stats.comLivro}</div>
        <div style="font-size:13px; color:#d97706; margin-top:2px;">Com livro emprestado</div>
    </div>
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #dc2626;">
        <div style="font-size:28px; font-weight:bold; color:#dc2626;">{stats.inadimplentes}</div>
        <div style="font-size:13px; color:#dc2626; margin-top:2px;">Inadimplentes</div>
    </div>
</div>
{/if}

{#if mostrarForm}
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px;">
    <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">{editando ? 'Editar' : 'Novo'} Membro</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
            <label style="display:block; margin-bottom:4px;">Nome</label>
            <input bind:value={form.nome} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Turma</label>
            <select bind:value={form.turma} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;">
                <option value="">Sem turma</option>
                {#each turmas as t}
                    <option value={t.nome}>{t.nome}{t.descricao ? ' — ' + t.descricao : ''}</option>
                {/each}
            </select>
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Tipo</label>
            <select bind:value={form.tipo} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;">
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
            </select>
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">CPF</label>
            <input bind:value={form.cpf} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Telefone</label>
            <input bind:value={form.telefone} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Email</label>
            <input bind:value={form.email} type="email" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div style="grid-column:1/-1;">
            <label style="display:block; margin-bottom:4px;">Endereço</label>
            <input bind:value={form.endereco} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
    </div>
    <div style="margin-top:16px; display:flex; gap:8px;">
        <button onclick={salvar} style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Salvar</button>
        <button onclick={() => mostrarForm = false} style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancelar</button>
    </div>
</div>
{/if}

<input bind:value={busca} placeholder="Pesquisar por nome, CPF ou turma..."
    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; margin-bottom:16px;" />

{#if carregando}
    <p>Carregando...</p>
{:else if filtrados.length === 0}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:48px; text-align:center; color:#6b7280;">
        {busca ? 'Nenhum membro encontrado.' : 'Nenhum membro cadastrado ainda.'}
    </div>
{:else}
    {#each Object.entries(grupos()) as [nomeTurma, grupo]}
    {@const expandida = turmasExpandidas.has(nomeTurma)}
    {@const temInadimplente = grupo.membros.some(a => a.inadimplente)}
    <div style="border:1px solid {temInadimplente ? '#fca5a5' : '#e5e7eb'}; border-radius:8px; overflow:hidden; margin-bottom:12px;">
        <!-- Cabeçalho da turma -->
        <div onclick={() => toggleTurma(nomeTurma)}
            style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; cursor:pointer; background:{temInadimplente ? '#fff5f5' : '#f9fafb'}; border-left:4px solid {temInadimplente ? '#dc2626' : '#2563eb'};">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; font-size:16px;">{nomeTurma}</span>
                {#if grupo.descricao}
                    <span style="font-size:13px; color:#6b7280;">{grupo.descricao}</span>
                {/if}
                <span style="background:#2563eb; color:white; padding:2px 10px; border-radius:999px; font-size:12px;">
                    {grupo.membros.length} membro{grupo.membros.length !== 1 ? 's' : ''}
                </span>
                {#if temInadimplente}
                    <span style="background:#dc2626; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                        {grupo.membros.filter(a => a.inadimplente).length} inadimplente{grupo.membros.filter(a => a.inadimplente).length !== 1 ? 's' : ''}
                    </span>
                {/if}
                {#if grupo.membros.filter(a => a.tem_emprestimo && !a.inadimplente).length > 0}
                    <span style="background:#d97706; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                        {grupo.membros.filter(a => a.tem_emprestimo && !a.inadimplente).length} com livro
                    </span>
                {/if}
            </div>
            <span style="font-size:18px; color:#6b7280;">{expandida ? '▲' : '▼'}</span>
        </div>
        <!-- Tabela de membros -->
        {#if expandida}
        <table style="width:100%; border-collapse:collapse; background:white; font-size:14px;">
            <thead style="background:#1f2937; color:white;">
                <tr>
                    <th style="padding:10px 20px; text-align:left;">Nome</th>
                    <th style="padding:10px; text-align:left;">Tipo</th>
                    <th style="padding:10px; text-align:left;">Situação</th>
                    <th style="padding:10px; text-align:left;">CPF</th>
                    <th style="padding:10px; text-align:left;">Telefone</th>
                    <th style="padding:10px; text-align:left;">Ações</th>
                </tr>
            </thead>
            <tbody>
                {#each grupo.membros as aluno}
                <tr style="border-top:1px solid #f3f4f6; background:{aluno.inadimplente ? '#fff5f5' : 'white'};">
                    <td style="padding:10px 20px; font-weight:500;">{aluno.nome}</td>
                    <td style="padding:10px;">
                        <span style="background:{aluno.tipo === 'professor' ? '#7c3aed' : '#2563eb'}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">
                            {aluno.tipo}
                        </span>
                    </td>
                    <td style="padding:10px;">
                        {#if aluno.inadimplente}
                            <span style="background:#dc2626; color:white; padding:2px 10px; border-radius:4px; font-size:12px; font-weight:bold;">Inadimplente</span>
                        {:else if aluno.tem_emprestimo}
                            <span style="background:#d97706; color:white; padding:2px 10px; border-radius:4px; font-size:12px;">Com livro</span>
                        {:else}
                            <span style="background:#16a34a; color:white; padding:2px 10px; border-radius:4px; font-size:12px;">Em dia</span>
                        {/if}
                    </td>
                    <td style="padding:10px; color:#6b7280;">{aluno.cpf || '-'}</td>
                    <td style="padding:10px; color:#6b7280;">{aluno.telefone || '-'}</td>
                    <td style="padding:10px; display:flex; gap:6px;">
                        <button onclick={() => editar(aluno)} style="background:#d97706; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                        <button onclick={() => remover(aluno.id)} style="background:#dc2626; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Remover</button>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
        {/if}
    </div>
    {/each}
{/if}
