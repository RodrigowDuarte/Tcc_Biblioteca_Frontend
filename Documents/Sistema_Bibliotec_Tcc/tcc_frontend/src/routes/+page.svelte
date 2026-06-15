<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { api } from '$lib/api.js';

    let stats = $state(null);
    let carregando = $state(true);

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
</script>

<div style="margin-bottom:32px;">
    <h1 style="font-size:28px; font-weight:bold; margin-bottom:4px;">Sistema de Biblioteca</h1>
    <p style="color:#6b7280; font-size:14px;"> Selecione uma área para começar.</p>
</div>

<!-- Cards principais -->
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:20px;">

    <a href="/alunos" style="text-decoration:none;">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; border-top:4px solid #1f2937; transition:box-shadow 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <h2 style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:4px;">Membros</h2>
                    <p style="font-size:13px; color:#6b7280;">Alunos e professores</p>
                </div>
                {#if stats}
                <div style="text-align:right;">
                    <div style="font-size:26px; font-weight:bold; color:#1f2937;">{stats.membros}</div>
                    <div style="font-size:11px; color:#6b7280;">cadastrados</div>
                </div>
                {/if}
            </div>
            <div style="background:#1f2937; color:white; padding:8px 16px; border-radius:4px; text-align:center; font-size:14px; font-weight:500;">
                Gerenciar Membros
            </div>
        </div>
    </a>

    <a href="/livros" style="text-decoration:none;">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; border-top:4px solid #1f2937;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <h2 style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:4px;">Livros</h2>
                    <p style="font-size:13px; color:#6b7280;">Acervo da biblioteca</p>
                </div>
                {#if stats}
                <div style="text-align:right;">
                    <div style="font-size:26px; font-weight:bold; color:#1f2937;">{stats.livros}</div>
                    <div style="font-size:11px; color:#6b7280;">{stats.livrosDisponiveis} disponíveis</div>
                </div>
                {/if}
            </div>
            <div style="background:#1f2937; color:white; padding:8px 16px; border-radius:4px; text-align:center; font-size:14px; font-weight:500;">
                Gerenciar Livros
            </div>
        </div>
    </a>

    <a href="/emprestimos" style="text-decoration:none;">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; border-top:4px solid #1f2937;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <h2 style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:4px;">Empréstimos</h2>
                    <p style="font-size:13px; color:#6b7280;">Livros em circulação</p>
                </div>
                {#if stats}
                <div style="text-align:right;">
                    <div style="font-size:26px; font-weight:bold; color:#1f2937;">{stats.emprestimos}</div>
                    <div style="font-size:11px; color:#6b7280;">ativos</div>
                </div>
                {/if}
            </div>
            <div style="background:#1f2937; color:white; padding:8px 16px; border-radius:4px; text-align:center; font-size:14px; font-weight:500;">
                Ver Empréstimos
            </div>
        </div>
    </a>

    <a href="/inadimplentes" style="text-decoration:none;">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; border-top:4px solid {stats?.inadimplentes > 0 ? '#dc2626' : '#1f2937'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <h2 style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:4px;">Inadimplentes</h2>
                    <p style="font-size:13px; color:#6b7280;">Devoluções em atraso</p>
                </div>
                {#if stats}
                <div style="text-align:right;">
                    <div style="font-size:26px; font-weight:bold; color:{stats.inadimplentes > 0 ? '#dc2626' : '#1f2937'};">{stats.inadimplentes}</div>
                    <div style="font-size:11px; color:#6b7280;">em atraso</div>
                </div>
                {/if}
            </div>
            <div style="background:{stats?.inadimplentes > 0 ? '#dc2626' : '#1f2937'}; color:white; padding:8px 16px; border-radius:4px; text-align:center; font-size:14px; font-weight:500;">
                Ver Inadimplentes
            </div>
        </div>
    </a>

    <a href="/turmas" style="text-decoration:none;">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; border-top:4px solid #1f2937;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <h2 style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:4px;">Turmas</h2>
                    <p style="font-size:13px; color:#6b7280;">Grupos e classes</p>
                </div>
                {#if stats}
                <div style="text-align:right;">
                    <div style="font-size:26px; font-weight:bold; color:#1f2937;">{stats.turmas}</div>
                    <div style="font-size:11px; color:#6b7280;">cadastradas</div>
                </div>
                {/if}
            </div>
            <div style="background:#1f2937; color:white; padding:8px 16px; border-radius:4px; text-align:center; font-size:14px; font-weight:500;">
                Gerenciar Turmas
            </div>
        </div>
    </a>

    <a href="/historico" style="text-decoration:none;">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; border-top:4px solid #1f2937;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <h2 style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:4px;">Histórico</h2>
                    <p style="font-size:13px; color:#6b7280;">Devoluções registradas</p>
                </div>
            </div>
            <div style="background:#1f2937; color:white; padding:8px 16px; border-radius:4px; text-align:center; font-size:14px; font-weight:500;">
                Ver Histórico
            </div>
        </div>
    </a>

</div>

<!-- Última linha centralizada -->
<div style="display:flex; justify-content:center;">
    <a href="/localizacao" style="text-decoration:none; width:calc(33.33% - 10px);">
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; border-top:4px solid #1f2937;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <h2 style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:4px;">Localização</h2>
                    <p style="font-size:13px; color:#6b7280;">Setores e estantes</p>
                </div>
            </div>
            <div style="background:#1f2937; color:white; padding:8px 16px; border-radius:4px; text-align:center; font-size:14px; font-weight:500;">
                Gerenciar Localização
            </div>
        </div>
    </a>
</div>
