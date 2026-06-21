<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { api } from '$lib/api.js';
 
    let stats = $state(null);
    let carregando = $state(true);
    let inadimplentesLista = $state([]);
    let buscaInad = $state('');
 
    onMount(async () => {
        const token = localStorage.getItem('token');
        if (!token) { goto('/login'); return; }
 
        try {
            const [alunos, livros, inadimplentes, emprestimos, turmas] = await Promise.all([
                api.getAlunos(),
                api.getLivros(),
                api.getInadimplentes(),
                api.getEmprestimos(),
                api.getTurmas(),
            ]);
            inadimplentesLista = inadimplentes;
            stats = {
                membros: alunos.length,
                livros: livros.length,
                livrosDisponiveis: livros.filter(l => l.status === 'disponivel').length,
                inadimplentes: inadimplentes.length,
                emprestimos: emprestimos.length,
                turmas: turmas.length,
            };
        } catch(e) {
            stats = null;
        }
        carregando = false;
    });
 
    let inadFiltrados = $derived(
        inadimplentesLista.filter(i =>
            i.aluno?.nome?.toLowerCase().includes(buscaInad.toLowerCase()) ||
            i.aluno?.turma?.toLowerCase().includes(buscaInad.toLowerCase()) ||
            i.livro?.nome?.toLowerCase().includes(buscaInad.toLowerCase())
        )
    );
</script>
 
<!-- Layout de duas colunas: cards à esquerda, inadimplentes à direita -->
<div style="display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start;">
 
    <!-- COLUNA ESQUERDA: título + cards -->
    <div>
        <div style="margin-bottom:24px;">
            <h1 style="font-size:26px; font-weight:bold; margin-bottom:2px;">Sistema de Biblioteca</h1>
            <p style="color:#6b7280; font-size:14px;">Selecione uma área para começar.</p>
        </div>
 
        <!-- Grid de cards 2x3 -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
 
            <a href="/alunos" style="text-decoration:none;">
                <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:20px; border-top:4px solid #1f2937;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div>
                            <h2 style="font-size:16px; font-weight:bold; color:#1f2937; margin-bottom:2px;">Membros</h2>
                            <p style="font-size:12px; color:#6b7280;">Alunos e professores</p>
                        </div>
                        {#if stats}
                        <div style="text-align:right;">
                            <div style="font-size:22px; font-weight:bold; color:#1f2937;">{stats.membros}</div>
                            <div style="font-size:10px; color:#6b7280;">cadastrados</div>
                        </div>
                        {/if}
                    </div>
                    <div style="background:#1f2937; color:white; padding:6px 12px; border-radius:4px; text-align:center; font-size:13px; font-weight:500;">
                        Gerenciar Membros
                    </div>
                </div>
            </a>
 
            <a href="/livros" style="text-decoration:none;">
                <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:20px; border-top:4px solid #2563eb;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div>
                            <h2 style="font-size:16px; font-weight:bold; color:#1f2937; margin-bottom:2px;">Livros</h2>
                            <p style="font-size:12px; color:#6b7280;">Acervo da biblioteca</p>
                        </div>
                        {#if stats}
                        <div style="text-align:right;">
                            <div style="font-size:22px; font-weight:bold; color:#2563eb;">{stats.livros}</div>
                            <div style="font-size:10px; color:#6b7280;">{stats.livrosDisponiveis} disponíveis</div>
                        </div>
                        {/if}
                    </div>
                    <div style="background:#2563eb; color:white; padding:6px 12px; border-radius:4px; text-align:center; font-size:13px; font-weight:500;">
                        Gerenciar Livros
                    </div>
                </div>
            </a>
 
            <a href="/emprestimos" style="text-decoration:none;">
                <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:20px; border-top:4px solid #d97706;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div>
                            <h2 style="font-size:16px; font-weight:bold; color:#1f2937; margin-bottom:2px;">Empréstimos</h2>
                            <p style="font-size:12px; color:#6b7280;">Livros em circulação</p>
                        </div>
                        {#if stats}
                        <div style="text-align:right;">
                            <div style="font-size:22px; font-weight:bold; color:#d97706;">{stats.emprestimos}</div>
                            <div style="font-size:10px; color:#6b7280;">ativos</div>
                        </div>
                        {/if}
                    </div>
                    <div style="background:#d97706; color:white; padding:6px 12px; border-radius:4px; text-align:center; font-size:13px; font-weight:500;">
                        Ver Empréstimos
                    </div>
                </div>
            </a>
 
            <a href="/turmas" style="text-decoration:none;">
                <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:20px; border-top:4px solid #7c3aed;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div>
                            <h2 style="font-size:16px; font-weight:bold; color:#1f2937; margin-bottom:2px;">Turmas</h2>
                            <p style="font-size:12px; color:#6b7280;">Grupos e classes</p>
                        </div>
                        {#if stats}
                        <div style="text-align:right;">
                            <div style="font-size:22px; font-weight:bold; color:#7c3aed;">{stats.turmas}</div>
                            <div style="font-size:10px; color:#6b7280;">cadastradas</div>
                        </div>
                        {/if}
                    </div>
                    <div style="background:#7c3aed; color:white; padding:6px 12px; border-radius:4px; text-align:center; font-size:13px; font-weight:500;">
                        Gerenciar Turmas
                    </div>
                </div>
            </a>
 
            <a href="/historico" style="text-decoration:none;">
                <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:20px; border-top:4px solid #0891b2;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div>
                            <h2 style="font-size:16px; font-weight:bold; color:#1f2937; margin-bottom:2px;">Histórico</h2>
                            <p style="font-size:12px; color:#6b7280;">Devoluções registradas</p>
                        </div>
                    </div>
                    <div style="background:#0891b2; color:white; padding:6px 12px; border-radius:4px; text-align:center; font-size:13px; font-weight:500;">
                        Ver Histórico
                    </div>
                </div>
            </a>
 
            <a href="/localizacao" style="text-decoration:none;">
                <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:20px; border-top:4px solid #16a34a;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div>
                            <h2 style="font-size:16px; font-weight:bold; color:#1f2937; margin-bottom:2px;">Localização</h2>
                            <p style="font-size:12px; color:#6b7280;">Setores e estantes</p>
                        </div>
                    </div>
                    <div style="background:#16a34a; color:white; padding:6px 12px; border-radius:4px; text-align:center; font-size:13px; font-weight:500;">
                        Gerenciar Localização
                    </div>
                </div>
            </a>
 
        </div>
    </div>
 
    <!-- COLUNA DIREITA: painel de inadimplentes com scroll -->
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-top:4px solid #dc2626; position:sticky; top:16px;">
 
        <!-- Cabeçalho do painel -->
        <div style="padding:16px 16px 0 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:16px; font-weight:bold; color:#dc2626;">⚠ Inadimplentes</span>
                    {#if stats}
                    <span style="background:#dc2626; color:white; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:bold;">
                        {stats.inadimplentes}
                    </span>
                    {/if}
                </div>
                <a href="/inadimplentes" style="font-size:12px; color:#dc2626; text-decoration:none; font-weight:600;">
                    Ver página →
                </a>
            </div>
 
            <!-- Busca rápida -->
            <input
                bind:value={buscaInad}
                placeholder="Buscar por aluno, turma ou livro..."
                style="width:100%; border:1px solid #fca5a5; border-radius:4px; padding:6px 8px; box-sizing:border-box; font-size:13px; margin-bottom:10px; color:#1f2937;"
            />
        </div>
 
        <!-- Lista com scroll -->
        <div style="overflow-y:auto; max-height:calc(100vh - 220px); padding:0 16px 16px 16px;">
            {#if carregando}
                <div style="padding:24px; text-align:center; color:#6b7280; font-size:13px;">Carregando...</div>
            {:else if inadFiltrados.length === 0}
                <div style="padding:24px; text-align:center; color:#16a34a; font-size:13px; font-weight:600;">
                    {buscaInad ? 'Nenhum resultado.' : '✓ Nenhum inadimplente!'}
                </div>
            {:else}
                {#each inadFiltrados as i}
                {@const dias = Math.floor((new Date() - new Date(i.data_prevista_devolucao)) / (1000 * 60 * 60 * 24))}
                <div style="border:1px solid #fca5a5; border-radius:6px; padding:10px 12px; margin-bottom:8px; background:#fff5f5;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="font-weight:700; font-size:13px; color:#1f2937;">{i.aluno?.nome}</div>
                        <span style="background:#dc2626; color:white; padding:2px 7px; border-radius:999px; font-size:11px; font-weight:bold; white-space:nowrap; margin-left:6px;">
                            {dias}d
                        </span>
                    </div>
                    {#if i.aluno?.turma}
                    <div style="font-size:11px; color:#6b7280; margin-top:1px;">{i.aluno.turma}</div>
                    {/if}
                    <div style="font-size:12px; color:#374151; margin-top:4px;">📖 {i.livro?.nome}</div>
                    <div style="font-size:11px; color:#dc2626; margin-top:2px;">
                        Devolver até: {new Date(i.data_prevista_devolucao).toLocaleDateString('pt-BR')}
                    </div>
                </div>
                {/each}
            {/if}
        </div>
 
    </div>
 
</div>