<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';
 
    let tela = $state('turmas');
    let turmas = $state([]);
    let turmaSelecionada = $state(null);
    let membros = $state([]);
    let carregando = $state(true);
    let busca = $state('');
    let mostrarForm = $state(false);
    let editando = $state(null);
    let form = $state({ nome: '', descricao: '' });
    let mensagem = $state('');
    let erro = $state('');
    let mostrarFormMembro = $state(false);
    let formMembro = $state({ nome: '', turma: '', tipo: 'aluno', cpf: '', telefone: '', email: '', endereco: '' });
 
    onMount(async () => { await carregarTurmas(); });
 
    async function carregarTurmas() {
        carregando = true; busca = '';
        turmas = await api.getTurmas();
        carregando = false;
    }
 
    async function abrirTurma(turma) {
        carregando = true;
        turmaSelecionada = turma;
        tela = 'membros';
        busca = '';
        const res = await api.getMembrosDaTurma(turma.id);
        membros = res.membros ?? [];
        carregando = false;
    }
 
    async function recarregarMembros() {
        const res = await api.getMembrosDaTurma(turmaSelecionada.id);
        membros = res.membros ?? [];
        await carregarTurmas();
        turmaSelecionada = turmas.find(t => t.id === turmaSelecionada.id) ?? turmaSelecionada;
    }
 
    function voltarParaTurmas() { tela = 'turmas'; turmaSelecionada = null; membros = []; mostrarFormMembro = false; }
 
    async function salvarTurma() {
        erro = '';
        if (!form.nome.trim()) { erro = 'Nome é obrigatório!'; return; }
        const res = editando ? await api.updateTurma(editando.id, form) : await api.createTurma(form);
        if (res.id) { mensagem = editando ? 'Turma atualizada!' : 'Turma criada!'; fecharForm(); await carregarTurmas(); }
        else { erro = res.message || 'Erro ao salvar turma'; }
    }
 
    async function removerTurma(id) {
        if (confirm('Remover esta turma?')) { await api.deleteTurma(id); await carregarTurmas(); }
    }
 
    function editarTurma(turma) { editando = turma; form = { nome: turma.nome, descricao: turma.descricao ?? '' }; mostrarForm = true; }
    function fecharForm() { mostrarForm = false; editando = null; form = { nome: '', descricao: '' }; }
 
    function abrirFormMembro() {
        formMembro = { nome: '', turma: turmaSelecionada.nome, tipo: 'aluno', cpf: '', telefone: '', email: '', endereco: '' };
        mostrarFormMembro = true;
    }
 
    async function salvarMembro() {
        erro = '';
        if (!formMembro.nome.trim()) { erro = 'Nome é obrigatório!'; return; }
        const res = await api.createAluno(formMembro);
        if (res.id) {
            mensagem = 'Membro adicionado!';
            mostrarFormMembro = false;
            await recarregarMembros();
        } else { erro = res.message || 'Erro ao salvar membro'; }
    }
 
    function diasAtraso(dataPrevista) {
        return Math.floor((new Date() - new Date(dataPrevista)) / (1000 * 60 * 60 * 24));
    }
 
    let turmasFiltradas = $derived(turmas.filter(t =>
        t.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (t.descricao ?? '').toLowerCase().includes(busca.toLowerCase())
    ));
 
    let membrosFiltrados = $derived(membros.filter(m =>
        m.nome.toLowerCase().includes(busca.toLowerCase())
    ));
 
    // Ordenar: inadimplentes primeiro, depois com livro, depois em dia
    let membrosOrdenados = $derived([
        ...membrosFiltrados.filter(m => m.inadimplente),
        ...membrosFiltrados.filter(m => m.tem_emprestimo && !m.inadimplente),
        ...membrosFiltrados.filter(m => !m.tem_emprestimo && !m.inadimplente),
    ]);
 
    let statsturma = $derived({
        total: membros.length,
        inadimplentes: membros.filter(m => m.inadimplente).length,
        comLivro: membros.filter(m => m.tem_emprestimo && !m.inadimplente).length,
        emDia: membros.filter(m => !m.tem_emprestimo && !m.inadimplente).length,
    });
</script>
 
<!-- BREADCRUMB -->
<div style="display:flex; align-items:center; gap:8px; margin-bottom:20px;">
    {#if tela === 'turmas'}
        <a href="/" style="background:#e5e7eb; color:#1f2937; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:14px;">← Voltar</a>
        <h1 style="font-size:24px; font-weight:bold;">Turmas</h1>
    {:else}
        <button onclick={voltarParaTurmas} style="background:#e5e7eb; color:#1f2937; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:14px;">← Voltar</button>
        <span onclick={voltarParaTurmas} style="cursor:pointer; color:#2563eb; font-size:14px;">Turmas</span>
        <span style="color:#6b7280;">›</span>
        <h1 style="font-size:24px; font-weight:bold; color:#1f2937;">{turmaSelecionada?.nome}</h1>
        {#if turmaSelecionada?.descricao}
            <span style="font-size:14px; color:#6b7280;">— {turmaSelecionada.descricao}</span>
        {/if}
    {/if}
</div>
 
{#if mensagem}<div style="background:#dcfce7; color:#16a34a; padding:12px; border-radius:4px; margin-bottom:16px;">{mensagem}</div>{/if}
{#if erro}<div style="background:#fee2e2; color:#dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">{erro}</div>{/if}
 
<!-- TELA: LISTA DE TURMAS -->
{#if tela === 'turmas'}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <input bind:value={busca} placeholder="Pesquisar turma..."
            style="border:1px solid #d1d5db; border-radius:4px; padding:8px; width:60%; box-sizing:border-box;" />
        <button onclick={() => { mostrarForm = true; editando = null; form = { nome: '', descricao: '' }; }}
            style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
            + Nova Turma
        </button>
    </div>
 
    {#if mostrarForm}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px;">
        <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">{editando ? 'Editar' : 'Nova'} Turma</h2>
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:16px;">
            <div>
                <label style="display:block; margin-bottom:4px;">Nome <span style="color:#dc2626;">*</span></label>
                <input bind:value={form.nome} placeholder="Ex: 5B, 3A..."
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Descrição</label>
                <input bind:value={form.descricao} placeholder="Ex: 5º ano B — Tarde"
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
        </div>
        <div style="margin-top:16px; display:flex; gap:8px;">
            <button onclick={salvarTurma} style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Salvar</button>
            <button onclick={fecharForm} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancelar</button>
        </div>
    </div>
    {/if}
 
    {#if carregando}
        <p>Carregando...</p>
    {:else if turmasFiltradas.length === 0}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:48px; text-align:center; color:#6b7280;">
            Nenhuma turma cadastrada ainda.
        </div>
    {:else}
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:16px;">
        {#each turmasFiltradas as turma}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; cursor:pointer; border:2px solid {turma.total_inadimplentes > 0 ? '#fca5a5' : '#e5e7eb'};"
            onclick={() => abrirTurma(turma)}>
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-size:22px; font-weight:bold;">{turma.nome}</div>
                    {#if turma.descricao}<div style="font-size:13px; color:#6b7280; margin-top:2px;">{turma.descricao}</div>{/if}
                </div>
                <div style="text-align:right;">
                    <div style="font-size:24px; font-weight:bold; color:#2563eb;">{turma.total_membros}</div>
                    <div style="font-size:11px; color:#6b7280;">membros</div>
                </div>
            </div>
            <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
                {#if turma.total_inadimplentes > 0}
                    <span style="background:#fee2e2; color:#dc2626; font-size:12px; font-weight:bold; padding:3px 8px; border-radius:4px;">
                        {turma.total_inadimplentes} inadimplente{turma.total_inadimplentes > 1 ? 's' : ''}
                    </span>
                {/if}
            </div>
            <div style="margin-top:12px; display:flex; gap:6px;" onclick={(e) => e.stopPropagation()}>
                <button onclick={() => editarTurma(turma)} style="background:#d97706; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                <button onclick={() => removerTurma(turma.id)} style="background:#dc2626; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Remover</button>
            </div>
        </div>
        {/each}
    </div>
    {/if}
 
<!-- TELA: MEMBROS DA TURMA -->
{:else if tela === 'membros'}
 
    <!-- Estatísticas da turma -->
    {#if !carregando}
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:20px;">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #2563eb;">
            <div style="font-size:26px; font-weight:bold; color:#2563eb;">{statsturma.total}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:2px;">Total de membros</div>
        </div>
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #16a34a;">
            <div style="font-size:26px; font-weight:bold; color:#16a34a;">{statsturma.emDia}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:2px;">Em dia</div>
        </div>
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #d97706;">
            <div style="font-size:26px; font-weight:bold; color:#d97706;">{statsturma.comLivro}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:2px;">Com livro</div>
        </div>
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px; border-left:4px solid #dc2626;">
            <div style="font-size:26px; font-weight:bold; color:#dc2626;">{statsturma.inadimplentes}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:2px;">Inadimplentes</div>
        </div>
    </div>
    {/if}
 
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <input bind:value={busca} placeholder="Pesquisar membro..."
            style="border:1px solid #d1d5db; border-radius:4px; padding:8px; width:300px; box-sizing:border-box;" />
        <button onclick={abrirFormMembro}
            style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
            + Novo Membro
        </button>
    </div>
 
    {#if mostrarFormMembro}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px;">
        <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">Novo Membro — {turmaSelecionada?.nome}</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
                <label style="display:block; margin-bottom:4px;">Nome <span style="color:#dc2626;">*</span></label>
                <input bind:value={formMembro.nome} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Tipo</label>
                <select bind:value={formMembro.tipo} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;">
                    <option value="aluno">Aluno</option>
                    <option value="professor">Professor</option>
                </select>
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">CPF</label>
                <input bind:value={formMembro.cpf} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Telefone</label>
                <input bind:value={formMembro.telefone} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Email</label>
                <input bind:value={formMembro.email} type="email" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Endereço</label>
                <input bind:value={formMembro.endereco} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
        </div>
        <div style="margin-top:16px; display:flex; gap:8px;">
            <button onclick={salvarMembro} style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Salvar</button>
            <button onclick={() => mostrarFormMembro = false} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancelar</button>
        </div>
    </div>
    {/if}
 
    {#if carregando}
        <p>Carregando...</p>
    {:else if membrosOrdenados.length === 0}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:48px; text-align:center; color:#6b7280;">
            {busca ? 'Nenhum membro encontrado.' : 'Nenhum membro nesta turma. Clique em "+ Novo Membro" para adicionar.'}
        </div>
    {:else}
    <div style="background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead style="background:#1f2937; color:white;">
                <tr>
                    <th style="padding:12px 20px; text-align:left;">Nome</th>
                    <th style="padding:12px; text-align:left;">Tipo</th>
                    <th style="padding:12px; text-align:left;">Situação</th>
                    <th style="padding:12px; text-align:left;">Livros ativos</th>
                    <th style="padding:12px; text-align:left;">Detalhes</th>
                </tr>
            </thead>
            <tbody>
                {#each membrosOrdenados as m}
                <tr style="border-top:1px solid #f3f4f6; background:{m.inadimplente ? '#fff5f5' : 'white'};">
                    <td style="padding:12px 20px; font-weight:bold;">{m.nome}</td>
                    <td style="padding:12px;">
                        <span style="background:{m.tipo === 'professor' ? '#7c3aed' : '#2563eb'}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">{m.tipo}</span>
                    </td>
                    <td style="padding:12px;">
                        {#if m.inadimplente}
                            <span style="background:#dc2626; color:white; padding:2px 10px; border-radius:4px; font-size:12px; font-weight:bold;">Inadimplente</span>
                        {:else if m.tem_emprestimo}
                            <span style="background:#d97706; color:white; padding:2px 10px; border-radius:4px; font-size:12px;">Com livro</span>
                        {:else}
                            <span style="background:#16a34a; color:white; padding:2px 10px; border-radius:4px; font-size:12px;">Em dia</span>
                        {/if}
                    </td>
                    <td style="padding:12px; color:#6b7280;">
                        {#if m.emprestimos && m.emprestimos.length > 0}
                            {#each m.emprestimos as e}
                                <div style="font-size:13px;">{e.livro?.nome ?? '-'}</div>
                            {/each}
                        {:else}
                            -
                        {/if}
                    </td>
                    <td style="padding:12px; color:#6b7280; font-size:13px;">
                        {#if m.emprestimos && m.emprestimos.length > 0}
                            {#each m.emprestimos as e}
                            {@const atrasado = new Date(e.data_prevista_devolucao) < new Date()}
                            {@const dias = diasAtraso(e.data_prevista_devolucao)}
                            <div style="font-size:12px; color:{atrasado ? '#dc2626' : '#6b7280'};">
                                {atrasado ? `Atrasado ${dias}d` : `Devolve: ${new Date(e.data_prevista_devolucao).toLocaleDateString('pt-BR')}`}
                            </div>
                            {/each}
                        {/if}
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
    {/if}
{/if}