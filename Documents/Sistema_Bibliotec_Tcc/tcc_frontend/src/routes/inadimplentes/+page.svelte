<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';
 
    let inadimplentes = $state([]);
    let turmas = $state([]);
    let carregando = $state(true);
    let busca = $state('');
    let turmasExpandidas = $state(new Set());
    let tabelaGeralExpandida = $state(false);
 
    onMount(async () => { await carregar(); });
 
    async function carregar() {
        carregando = true;
        [inadimplentes, turmas] = await Promise.all([api.getInadimplentes(), api.getTurmas()]);
        carregando = false;
    }
 
    function toggleTurma(nome) {
        const novo = new Set(turmasExpandidas);
        novo.has(nome) ? novo.delete(nome) : novo.add(nome);
        turmasExpandidas = novo;
    }
 
    function diasAtraso(dataPrevista) {
        return Math.floor((new Date() - new Date(dataPrevista)) / (1000 * 60 * 60 * 24));
    }
 
    let filtrados = $derived(inadimplentes.filter(i =>
        i.aluno?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        i.aluno?.turma?.toLowerCase().includes(busca.toLowerCase()) ||
        i.livro?.nome?.toLowerCase().includes(busca.toLowerCase())
    ));
 
    let inadimplentesPorTurma = $derived(() => {
        const grupos = {};
        for (const t of turmas) {
            const items = inadimplentes.filter(i => i.aluno?.turma === t.nome);
            if (items.length > 0) grupos[t.nome] = items;
        }
        const semTurma = inadimplentes.filter(i => !i.aluno?.turma);
        if (semTurma.length > 0) grupos['Sem turma'] = semTurma;
        return grupos;
    });
</script>
 
<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
    <div style="display:flex; align-items:center; gap:12px;">
        <a href="/" style="background:#e5e7eb; color:#1f2937; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:14px;">← Voltar</a>
        <h1 style="font-size:24px; font-weight:bold;">Inadimplentes</h1>
    </div>
    <span style="background:#dc2626; color:white; padding:4px 12px; border-radius:999px; font-size:14px; font-weight:bold;">
        {inadimplentes.length} em atraso
    </span>
</div>
 
<input bind:value={busca} placeholder="Pesquisar por membro, turma ou livro..."
    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; margin-bottom:16px;" />
 
{#if carregando}
    <p>Carregando...</p>
{:else}
 
<!-- Tabela geral (colapsável) -->
<div style="border:1px solid #fca5a5; border-radius:8px; overflow:hidden; margin-bottom:24px;">
    <div onclick={() => tabelaGeralExpandida = !tabelaGeralExpandida}
        style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; cursor:pointer; background:#fff5f5;">
        <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-weight:bold; font-size:16px;">Todos os Inadimplentes</span>
            <span style="background:#dc2626; color:white; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:bold;">
                {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
            </span>
        </div>
        <span style="font-size:18px; color:#6b7280;">{tabelaGeralExpandida ? '▲' : '▼'}</span>
    </div>
    {#if tabelaGeralExpandida}
        {#if filtrados.length === 0}
            <div style="padding:32px; text-align:center; color:#6b7280; background:white;">
                {busca ? 'Nenhum resultado encontrado.' : 'Nenhum inadimplente no momento!'}
            </div>
        {:else}
        <table style="width:100%; border-collapse:collapse; background:white;">
            <thead style="background:#1f2937; color:white;">
                <tr>
                    <th style="padding:12px; text-align:left;">Membro</th>
                    <th style="padding:12px; text-align:left;">Turma</th>
                    <th style="padding:12px; text-align:left;">Tipo</th>
                    <th style="padding:12px; text-align:left;">Livro</th>
                    <th style="padding:12px; text-align:left;">Devolver até</th>
                    <th style="padding:12px; text-align:left;">Atraso</th>
                </tr>
            </thead>
            <tbody>
                {#each filtrados as i}
                {@const dias = diasAtraso(i.data_prevista_devolucao)}
                <tr style="border-bottom:1px solid #fee2e2; background:#fff5f5;">
                    <td style="padding:12px; font-weight:bold;">{i.aluno?.nome}</td>
                    <td style="padding:12px;">{i.aluno?.turma || '-'}</td>
                    <td style="padding:12px;">
                        <span style="background:{i.aluno?.tipo === 'professor' ? '#7c3aed' : '#2563eb'}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">
                            {i.aluno?.tipo}
                        </span>
                    </td>
                    <td style="padding:12px;">{i.livro?.nome}</td>
                    <td style="padding:12px; color:#dc2626;">{new Date(i.data_prevista_devolucao).toLocaleDateString('pt-BR')}</td>
                    <td style="padding:12px;">
                        <span style="background:#dc2626; color:white; padding:2px 10px; border-radius:999px; font-size:13px; font-weight:bold;">
                            {dias} {dias === 1 ? 'dia' : 'dias'}
                        </span>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
        {/if}
    {/if}
</div>
 
<!-- Inadimplentes por Turma (expansível) -->
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px;">
    <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">Inadimplentes por Turma</h2>
    {#if Object.keys(inadimplentesPorTurma()).length === 0}
        <div style="padding:24px; text-align:center; color:#16a34a; font-weight:bold;">Nenhum inadimplente!</div>
    {:else}
        {#each Object.entries(inadimplentesPorTurma()) as [nomeTurma, items]}
        {@const expandida = turmasExpandidas.has(nomeTurma)}
        {@const maxAtraso = Math.max(...items.map(i => diasAtraso(i.data_prevista_devolucao)))}
        <div style="border:1px solid #fca5a5; border-radius:6px; margin-bottom:8px; overflow:hidden;">
            <div onclick={() => toggleTurma(nomeTurma)}
                style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; cursor:pointer; background:#fff5f5;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-weight:bold; font-size:16px;">{nomeTurma}</span>
                    <span style="background:#dc2626; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                        {items.length} inadimplente{items.length !== 1 ? 's' : ''}
                    </span>
                    <span style="background:#7f1d1d; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                        máx {maxAtraso} dias
                    </span>
                </div>
                <span style="font-size:18px; color:#6b7280;">{expandida ? '▲' : '▼'}</span>
            </div>
            {#if expandida}
            <div style="padding:12px 16px; border-top:1px solid #fee2e2;">
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="color:#6b7280; border-bottom:1px solid #e5e7eb;">
                            <th style="padding:8px; text-align:left;">Membro</th>
                            <th style="padding:8px; text-align:left;">Tipo</th>
                            <th style="padding:8px; text-align:left;">Livro</th>
                            <th style="padding:8px; text-align:left;">Devolver até</th>
                            <th style="padding:8px; text-align:left;">Atraso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each items as i}
                        {@const dias = diasAtraso(i.data_prevista_devolucao)}
                        <tr style="border-bottom:1px solid #fee2e2; background:#fff5f5;">
                            <td style="padding:8px; font-weight:bold;">{i.aluno?.nome}</td>
                            <td style="padding:8px;">
                                <span style="background:{i.aluno?.tipo === 'professor' ? '#7c3aed' : '#2563eb'}; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">
                                    {i.aluno?.tipo}
                                </span>
                            </td>
                            <td style="padding:8px;">{i.livro?.nome}</td>
                            <td style="padding:8px; color:#dc2626;">{new Date(i.data_prevista_devolucao).toLocaleDateString('pt-BR')}</td>
                            <td style="padding:8px;">
                                <span style="background:#dc2626; color:white; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:bold;">
                                    {dias} {dias === 1 ? 'dia' : 'dias'}
                                </span>
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