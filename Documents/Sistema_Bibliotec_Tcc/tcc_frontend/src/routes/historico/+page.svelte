<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';

    let historico = $state([]);
    let turmas = $state([]);
    let carregando = $state(true);
    let busca = $state('');
    let turmasExpandidas = $state(new Set());
    let tabelaGeralExpandida = $state(true);

    // Filtros de período
    let periodoSelecionado = $state('mes');
    let dataInicio = $state('');
    let dataFim = $state('');

    onMount(async () => { await carregar(); });

    async function carregar() {
        carregando = true;
        [historico, turmas] = await Promise.all([api.getHistorico(), api.getTurmas()]);
        carregando = false;
    }


    async function apagarTodoHistorico() {
        if (!confirm('Apagar TODO o histórico? Esta ação não pode ser desfeita!')) return;
        await api.limparHistorico();
        await carregar();
    }

    async function apagarRegistro(id) {
        if (!confirm('Apagar este registro do histórico?')) return;
        await api.deletarHistorico(id);
        historico = historico.filter(h => h.id !== id);
    }

    function toggleTurma(nome) {
        const novo = new Set(turmasExpandidas);
        novo.has(nome) ? novo.delete(nome) : novo.add(nome);
        turmasExpandidas = novo;
    }

    function duracaoDias(dataEmprestimo, dataDevolucao) {
        return Math.floor((new Date(dataDevolucao) - new Date(dataEmprestimo)) / (1000 * 60 * 60 * 24));
    }

    function diasAtraso(dataPrevista, dataDevolucao) {
        const atraso = Math.floor((new Date(dataDevolucao) - new Date(dataPrevista)) / (1000 * 60 * 60 * 24));
        return atraso > 0 ? atraso : 0;
    }

    function inicioDoMes() {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }

    function inicioDaSemana() {
        const d = new Date();
        const dia = d.getDay();
        const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    let filtradosPorPeriodo = $derived(() => {
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);

        let inicio = null;
        let fim = hoje;

        if (periodoSelecionado === 'hoje') {
            inicio = new Date();
            inicio.setHours(0, 0, 0, 0);
        } else if (periodoSelecionado === 'semana') {
            inicio = inicioDaSemana();
            inicio.setHours(0, 0, 0, 0);
        } else if (periodoSelecionado === 'mes') {
            inicio = inicioDoMes();
            inicio.setHours(0, 0, 0, 0);
        } else if (periodoSelecionado === 'personalizado') {
            inicio = dataInicio ? new Date(dataInicio) : null;
            fim = dataFim ? new Date(dataFim) : hoje;
            fim.setHours(23, 59, 59, 999);
        }

        return historico.filter(h => {
            const dataDev = new Date(h.data_devolucao);
            if (inicio && dataDev < inicio) return false;
            if (dataDev > fim) return false;
            return true;
        });
    });

    let filtrados = $derived(filtradosPorPeriodo().filter(h =>
        h.aluno?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        h.aluno?.turma?.toLowerCase().includes(busca.toLowerCase()) ||
        h.livro?.nome?.toLowerCase().includes(busca.toLowerCase())
    ));

    // Estatísticas
    let stats = $derived(() => {
        const base = filtradosPorPeriodo();
        if (base.length === 0) return null;

        const atrasados = base.filter(h => new Date(h.data_devolucao) > new Date(h.data_prevista_devolucao));

        // Livro mais emprestado
        const contagemLivros = {};
        for (const h of base) {
            const nome = h.livro?.nome ?? 'Desconhecido';
            contagemLivros[nome] = (contagemLivros[nome] ?? 0) + 1;
        }
        const livroTop = Object.entries(contagemLivros).sort((a, b) => b[1] - a[1])[0];

        // Membro mais ativo
        const contagemMembros = {};
        for (const h of base) {
            const nome = h.aluno?.nome ?? 'Desconhecido';
            contagemMembros[nome] = (contagemMembros[nome] ?? 0) + 1;
        }
        const membroTop = Object.entries(contagemMembros).sort((a, b) => b[1] - a[1])[0];

        return {
            total: base.length,
            atrasados: atrasados.length,
            percentualAtraso: Math.round((atrasados.length / base.length) * 100),
            livroTop: livroTop ? { nome: livroTop[0], qtd: livroTop[1] } : null,
            membroTop: membroTop ? { nome: membroTop[0], qtd: membroTop[1] } : null,
        };
    });

    let historicoPorTurma = $derived(() => {
        const grupos = {};
        for (const t of turmas) {
            const items = filtrados.filter(h => h.aluno?.turma === t.nome);
            if (items.length > 0) grupos[t.nome] = items;
        }
        const semTurma = filtrados.filter(h => !h.aluno?.turma);
        if (semTurma.length > 0) grupos['Sem turma'] = semTurma;
        return grupos;
    });
</script>

<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
    <div style="display:flex; align-items:center; gap:12px;">
        <a href="/" style="background:#e5e7eb; color:#1f2937; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:14px;">← Voltar</a>
        <h1 style="font-size:24px; font-weight:bold;">Histórico</h1>
        <span style="background:#6b7280; color:white; padding:4px 12px; border-radius:999px; font-size:14px; font-weight:bold;">
            {historico.length} devoluções no total
        </span>
    </div>
    <button onclick={apagarTodoHistorico}
        style="background:#dc2626; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-size:14px;">
        Limpar histórico
    </button>
</div>

<!-- Filtros de período -->
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
    <span style="font-weight:bold; font-size:14px; color:#374151;">Período:</span>
    {#each [['hoje','Hoje'],['semana','Esta semana'],['mes','Este mês'],['tudo','Tudo'],['personalizado','Personalizado']] as [val, label]}
    <button onclick={() => periodoSelecionado = val}
        style="padding:6px 14px; border-radius:4px; border:1px solid {periodoSelecionado === val ? '#2563eb' : '#d1d5db'}; background:{periodoSelecionado === val ? '#2563eb' : 'white'}; color:{periodoSelecionado === val ? 'white' : '#374151'}; cursor:pointer; font-size:13px;">
        {label}
    </button>
    {/each}
    {#if periodoSelecionado === 'personalizado'}
    <div style="display:flex; align-items:center; gap:8px; margin-left:8px;">
        <input type="date" bind:value={dataInicio}
            style="border:1px solid #d1d5db; border-radius:4px; padding:5px 8px; font-size:13px;" />
        <span style="color:#6b7280;">até</span>
        <input type="date" bind:value={dataFim}
            style="border:1px solid #d1d5db; border-radius:4px; padding:5px 8px; font-size:13px;" />
    </div>
    {/if}
</div>

<!-- Estatísticas -->
{#if stats()}
{@const s = stats()}
<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:20px;">
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; border-left:4px solid #2563eb;">
        <div style="font-size:28px; font-weight:bold; color:#2563eb;">{s.total}</div>
        <div style="font-size:13px; color:#6b7280; margin-top:4px;">Devoluções no período</div>
    </div>
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; border-left:4px solid {s.percentualAtraso > 20 ? '#dc2626' : '#16a34a'};">
        <div style="font-size:28px; font-weight:bold; color:{s.percentualAtraso > 20 ? '#dc2626' : '#16a34a'};">{s.percentualAtraso}%</div>
        <div style="font-size:13px; color:#6b7280; margin-top:4px;">Devolvidos com atraso ({s.atrasados})</div>
    </div>
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; border-left:4px solid #7c3aed;">
        <div style="font-size:15px; font-weight:bold; color:#7c3aed; margin-bottom:2px;">{s.livroTop?.nome ?? '-'}</div>
        <div style="font-size:13px; color:#6b7280;">Livro mais emprestado ({s.livroTop?.qtd ?? 0}x)</div>
    </div>
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; border-left:4px solid #d97706;">
        <div style="font-size:15px; font-weight:bold; color:#d97706; margin-bottom:2px;">{s.membroTop?.nome ?? '-'}</div>
        <div style="font-size:13px; color:#6b7280;">Membro mais ativo ({s.membroTop?.qtd ?? 0}x)</div>
    </div>
</div>
{/if}

<input bind:value={busca} placeholder="Pesquisar por membro, turma ou livro..."
    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; margin-bottom:16px;" />

{#if carregando}
    <p>Carregando...</p>
{:else}

<!-- Tabela geral colapsável -->
<div style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:16px;">
    <div onclick={() => tabelaGeralExpandida = !tabelaGeralExpandida}
        style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; cursor:pointer; background:#f9fafb; border-left:4px solid #6b7280;">
        <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-weight:bold; font-size:16px;">Todas as Devoluções</span>
            <span style="background:#6b7280; color:white; padding:2px 10px; border-radius:999px; font-size:12px;">
                {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
            </span>
        </div>
        <span style="font-size:18px; color:#6b7280;">{tabelaGeralExpandida ? '▲' : '▼'}</span>
    </div>
    {#if tabelaGeralExpandida}
    {#if filtrados.length === 0}
        <div style="padding:32px; text-align:center; color:#6b7280; background:white;">
            {busca ? 'Nenhum resultado encontrado.' : 'Nenhuma devolução neste período.'}
        </div>
    {:else}
    <table style="width:100%; border-collapse:collapse; background:white;">
        <thead style="background:#1f2937; color:white;">
            <tr>
                <th style="padding:12px; text-align:left;">Membro</th>
                <th style="padding:12px; text-align:left;">Turma</th>
                <th style="padding:12px; text-align:left;">Tipo</th>
                <th style="padding:12px; text-align:left;">Livro</th>
                <th style="padding:12px; text-align:left;">Emprestado em</th>
                <th style="padding:12px; text-align:left;">Devolvido em</th>
                <th style="padding:12px; text-align:left;">Duração</th>
                <th style="padding:12px; text-align:left;">Status</th>
                <th style="padding:12px;"></th>
            </tr>
        </thead>
        <tbody>
            {#each filtrados as h}
            {@const dias = duracaoDias(h.data_emprestimo, h.data_devolucao)}
            {@const atrasado = new Date(h.data_devolucao) > new Date(h.data_prevista_devolucao)}
            {@const diasAtr = diasAtraso(h.data_prevista_devolucao, h.data_devolucao)}
            <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:12px; font-weight:bold;">{h.aluno?.nome}</td>
                <td style="padding:12px;">{h.aluno?.turma || '-'}</td>
                <td style="padding:12px;">
                    <span style="background:{h.aluno?.tipo === 'professor' ? '#7c3aed' : '#2563eb'}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">
                        {h.aluno?.tipo}
                    </span>
                </td>
                <td style="padding:12px;">{h.livro?.nome}</td>
                <td style="padding:12px; font-size:13px; color:#6b7280;">{new Date(h.data_emprestimo).toLocaleDateString('pt-BR')}</td>
                <td style="padding:12px; font-size:13px; color:#6b7280;">{new Date(h.data_devolucao).toLocaleDateString('pt-BR')}</td>
                <td style="padding:12px; font-size:13px;">{dias} {dias === 1 ? 'dia' : 'dias'}</td>
                <td style="padding:12px;">
                    {#if atrasado}
                        <span style="background:#dc2626; color:white; padding:2px 10px; border-radius:4px; font-size:12px;">
                            Atrasado {diasAtr}d
                        </span>
                    {:else}
                        <span style="background:#16a34a; color:white; padding:2px 10px; border-radius:4px; font-size:12px;">No prazo</span>
                    {/if}
                </td>
                <td style="padding:12px;">
                    <button onclick={() => apagarRegistro(h.id)}
                        style="background:#dc2626; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px;">
                        Apagar
                    </button>
                </td>
            </tr>
            {/each}
        </tbody>
    </table>
    {/if}
    {/if}
</div>

<!-- Histórico por Turma (expansível) -->
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px;">
    <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">Histórico por Turma</h2>
    {#if Object.keys(historicoPorTurma()).length === 0}
        <div style="padding:24px; text-align:center; color:#6b7280;">Nenhuma devolução neste período.</div>
    {:else}
    {#each Object.entries(historicoPorTurma()) as [nomeTurma, items]}
    {@const expandida = turmasExpandidas.has(nomeTurma)}
    {@const temAtrasado = items.some(h => new Date(h.data_devolucao) > new Date(h.data_prevista_devolucao))}
    <div style="border:1px solid #e5e7eb; border-radius:6px; margin-bottom:8px; overflow:hidden;">
        <div onclick={() => toggleTurma(nomeTurma)}
            style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; cursor:pointer; background:#f9fafb;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; font-size:16px;">{nomeTurma}</span>
                <span style="background:#6b7280; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                    {items.length} devolução{items.length !== 1 ? 'ões' : ''}
                </span>
                {#if temAtrasado}
                    <span style="background:#dc2626; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">houve atraso</span>
                {/if}
            </div>
            <span style="font-size:18px; color:#6b7280;">{expandida ? '▲' : '▼'}</span>
        </div>
        {#if expandida}
        <div style="padding:12px 16px; border-top:1px solid #e5e7eb;">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                    <tr style="color:#6b7280; border-bottom:1px solid #e5e7eb;">
                        <th style="padding:8px; text-align:left;">Membro</th>
                        <th style="padding:8px; text-align:left;">Livro</th>
                        <th style="padding:8px; text-align:left;">Devolvido em</th>
                        <th style="padding:8px; text-align:left;">Duração</th>
                        <th style="padding:8px; text-align:left;">Status</th>
                        <th style="padding:8px;"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each items as h}
                    {@const dias = duracaoDias(h.data_emprestimo, h.data_devolucao)}
                    {@const atrasado = new Date(h.data_devolucao) > new Date(h.data_prevista_devolucao)}
                    {@const diasAtr = diasAtraso(h.data_prevista_devolucao, h.data_devolucao)}
                    <tr style="border-bottom:1px solid #f3f4f6;">
                        <td style="padding:8px; font-weight:bold;">{h.aluno?.nome}</td>
                        <td style="padding:8px;">{h.livro?.nome}</td>
                        <td style="padding:8px; color:#6b7280;">{new Date(h.data_devolucao).toLocaleDateString('pt-BR')}</td>
                        <td style="padding:8px;">{dias} {dias === 1 ? 'dia' : 'dias'}</td>
                        <td style="padding:8px;">
                            {#if atrasado}
                                <span style="background:#dc2626; color:white; padding:2px 8px; border-radius:4px; font-size:11px;">Atrasado {diasAtr}d</span>
                            {:else}
                                <span style="background:#16a34a; color:white; padding:2px 8px; border-radius:4px; font-size:11px;">No prazo</span>
                            {/if}
                        </td>
                        <td style="padding:8px;">
                            <button onclick={() => apagarRegistro(h.id)}
                                style="background:#dc2626; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:11px;">
                                Apagar
                            </button>
                        </td>
                    </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        {/if}
    </div>
    {/each}
    {/if}
</div>
{/if}
