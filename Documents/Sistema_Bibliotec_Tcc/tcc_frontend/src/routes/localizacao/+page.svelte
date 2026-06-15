<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';

    let tela = $state('lista');
    let setores = $state([]);
    let livrosTodos = $state([]);
    let setorSelecionado = $state(null);
    let estanteSelecionada = $state(null);
    let carregando = $state(true);
    let mensagem = $state('');
    let erro = $state('');

    let mostrarFormSetor = $state(false);
    let mostrarFormEstante = $state(false);
    let editandoSetor = $state(null);
    let editandoEstante = $state(null);
    let formSetor = $state({ nome: '', descricao: '' });
    let formEstante = $state({ nome: '', descricao: '', setor_id: '' });

    let mostrarFormLivro = $state(false);
    let mostrarVincular = $state(false);
    let editandoLivro = $state(null);
    let buscaVincular = $state('');
    let formLivro = $state({
        nome: '', isbn: '', autor: '', categoria: 'livro', genero: '',
        num_paginas: '', ano_publicacao: '', editora: '', quantidade: 1,
        n_patrimonio: '', sinopse: '', observacao: '', estante_id: ''
    });

    onMount(async () => { await carregar(); });

    async function carregar() {
        carregando = true;
        [setores, livrosTodos] = await Promise.all([api.getSetores(), api.getLivros()]);
        carregando = false;
    }

    let livrosDaEstanteAtual = $derived(
        estanteSelecionada ? livrosTodos.filter(l => Number(l.estante_id) === Number(estanteSelecionada.id)) : []
    );

    let livrosSemEstante = $derived(
        buscaVincular.length > 0
            ? livrosTodos.filter(l => !l.estante_id &&
                (l.nome?.toLowerCase().includes(buscaVincular.toLowerCase()) ||
                 l.autor?.toLowerCase().includes(buscaVincular.toLowerCase())))
            : []
    );

    function livrosDaEstante(estanteId) {
        return livrosTodos.filter(l => Number(l.estante_id) === Number(estanteId));
    }

    function abrirSetor(setor) { setorSelecionado = setor; tela = 'setor'; }
    function abrirEstante(estante) { estanteSelecionada = estante; tela = 'estante'; }

    function voltar() {
        if (tela === 'estante') { tela = 'setor'; estanteSelecionada = null; }
        else if (tela === 'setor') { tela = 'lista'; setorSelecionado = null; }
    }

    async function recarregarEAtualizar() {
        const setorId = setorSelecionado?.id;
        const estanteId = estanteSelecionada?.id;
        carregando = true;
        const [novosSetores, novosLivros] = await Promise.all([api.getSetores(), api.getLivros()]);
        livrosTodos = [...novosLivros];
        setores = [...novosSetores];
        carregando = false;
        if (setorId) setorSelecionado = setores.find(s => s.id === setorId);
        if (estanteId) estanteSelecionada = setorSelecionado?.estantes?.find(e => e.id === estanteId);
    }

    async function salvarSetor() {
        erro = '';
        if (!formSetor.nome.trim()) { erro = 'Nome obrigatório!'; return; }
        const res = editandoSetor ? await api.updateSetor(editandoSetor.id, formSetor) : await api.createSetor(formSetor);
        if (res.id) {
            mensagem = editandoSetor ? 'Setor atualizado!' : 'Setor criado!';
            mostrarFormSetor = false; editandoSetor = null; formSetor = { nome: '', descricao: '' };
            await recarregarEAtualizar();
        } else { erro = res.message || 'Erro ao salvar'; }
    }

    async function removerSetor(id) {
        if (confirm('Remover setor e todas as estantes?')) {
            await api.deleteSetor(id); await recarregarEAtualizar();
        }
    }

    function editarSetor(s) { editandoSetor = s; formSetor = { nome: s.nome, descricao: s.descricao ?? '' }; mostrarFormSetor = true; }

    async function salvarEstante() {
        erro = '';
        if (!formEstante.nome.trim()) { erro = 'Nome obrigatório!'; return; }
        formEstante.setor_id = setorSelecionado.id;
        const res = editandoEstante ? await api.updateEstante(editandoEstante.id, formEstante) : await api.createEstante(formEstante);
        if (res.id) {
            mensagem = editandoEstante ? 'Estante atualizada!' : 'Estante criada!';
            mostrarFormEstante = false; editandoEstante = null; formEstante = { nome: '', descricao: '', setor_id: '' };
            await recarregarEAtualizar();
        } else { erro = res.message || 'Erro ao salvar'; }
    }

    async function removerEstante(id) {
        if (confirm('Remover estante?')) {
            await api.deleteEstante(id); await recarregarEAtualizar();
        }
    }

    function editarEstante(e) { editandoEstante = e; formEstante = { nome: e.nome, descricao: e.descricao ?? '', setor_id: e.setor_id }; mostrarFormEstante = true; }

    function abrirFormLivro() {
        editandoLivro = null;
        formLivro = { nome: '', isbn: '', autor: '', categoria: 'livro', genero: '',
            num_paginas: '', ano_publicacao: '', editora: '', quantidade: 1,
            n_patrimonio: '', sinopse: '', observacao: '', estante_id: estanteSelecionada.id };
        mostrarFormLivro = true;
        mostrarVincular = false;
    }

    function editarLivro(livro) {
        editandoLivro = livro;
        formLivro = { ...livro, estante_id: estanteSelecionada.id };
        mostrarFormLivro = true;
        mostrarVincular = false;
    }

    async function salvarLivro() {
        erro = '';
        if (!formLivro.nome.trim()) { erro = 'Título obrigatório!'; return; }
        const res = editandoLivro
            ? await api.updateLivro(editandoLivro.id, formLivro)
            : await api.createLivro(formLivro);
        if (res.id) {
            mensagem = editandoLivro ? 'Livro atualizado!' : 'Livro adicionado!';
            mostrarFormLivro = false; editandoLivro = null;
            await recarregarEAtualizar();
        } else { erro = res.message || 'Erro ao salvar livro'; }
    }

    async function removerLivro(id) {
        if (confirm('Remover livro?')) {
            await api.deleteLivro(id); await recarregarEAtualizar();
        }
    }

    async function vincularLivro(livro) {
        const res = await api.updateLivro(livro.id, { estante_id: estanteSelecionada.id });
        if (res.id) {
            mensagem = `"${livro.nome}" vinculado à estante!`;
            buscaVincular = '';
            mostrarVincular = false;
            await recarregarEAtualizar();
        }
    }

    async function desvincularLivro(livro) {
        if (confirm('Remover livro desta estante?')) {
            await api.updateLivro(livro.id, { estante_id: null });
            mensagem = 'Livro removido da estante.';
            await recarregarEAtualizar();
        }
    }
</script>

<!-- BREADCRUMB -->
<div style="display:flex; align-items:center; gap:8px; margin-bottom:20px;">
    {#if tela === 'lista'}
        <a href="/" style="background:#e5e7eb; color:#1f2937; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:14px;">← Voltar</a>
    {:else}
        <span onclick={voltar} style="background:#e5e7eb; color:#1f2937; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:14px;">← Voltar</span>
    {/if}
    <span onclick={() => { tela='lista'; setorSelecionado=null; estanteSelecionada=null; }}
        style="cursor:pointer; font-weight:bold; font-size:24px; color:{tela === 'lista' ? '#1f2937' : '#2563eb'};">
        Localização
    </span>
    {#if tela === 'setor' || tela === 'estante'}
        <span style="color:#6b7280;">›</span>
        <span onclick={() => { tela='setor'; estanteSelecionada=null; }}
            style="cursor:{tela === 'estante' ? 'pointer' : 'default'}; color:{tela === 'estante' ? '#2563eb' : '#1f2937'}; font-weight:{tela === 'setor' ? 'bold' : 'normal'}; font-size:{tela === 'setor' ? '24px' : '16px'};">
            {setorSelecionado?.nome}
        </span>
    {/if}
    {#if tela === 'estante'}
        <span style="color:#6b7280;">›</span>
        <span style="color:#1f2937; font-weight:bold; font-size:24px;">{estanteSelecionada?.nome}</span>
    {/if}
</div>

{#if mensagem}<div style="background:#dcfce7; color:#16a34a; padding:12px; border-radius:4px; margin-bottom:16px;">{mensagem}</div>{/if}
{#if erro}<div style="background:#fee2e2; color:#dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">{erro}</div>{/if}

<!-- TELA 1: SETORES -->
{#if tela === 'lista'}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:18px; font-weight:bold;">Setores</h2>
        <button onclick={() => { mostrarFormSetor=true; editandoSetor=null; formSetor={nome:'',descricao:''}; }}
            style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
            + Novo Setor
        </button>
    </div>

    {#if mostrarFormSetor}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:16px;">
        <h3 style="font-weight:bold; margin-bottom:12px;">{editandoSetor ? 'Editar' : 'Novo'} Setor</h3>
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:12px;">
            <div>
                <label style="display:block; margin-bottom:4px;">Nome *</label>
                <input bind:value={formSetor.nome} placeholder="Ex: Ciências Humanas"
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Descrição</label>
                <input bind:value={formSetor.descricao}
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px;">
            <button onclick={salvarSetor} style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Salvar</button>
            <button onclick={() => mostrarFormSetor=false} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancelar</button>
        </div>
    </div>
    {/if}

    {#if carregando}
        <p>Carregando...</p>
    {:else if setores.length === 0}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:48px; text-align:center; color:#6b7280;">
            Nenhum setor cadastrado ainda.
        </div>
    {:else}
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
        {#each setores as setor}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; cursor:pointer; border:2px solid #e5e7eb;"
            onclick={() => abrirSetor(setor)}>
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-size:18px; font-weight:bold;">{setor.nome}</div>
                    {#if setor.descricao}<div style="font-size:13px; color:#6b7280; margin-top:2px;">{setor.descricao}</div>{/if}
                </div>
                <div style="text-align:right;">
                    <div style="font-size:22px; font-weight:bold; color:#2563eb;">{setor.estantes?.length ?? 0}</div>
                    <div style="font-size:11px; color:#6b7280;">estantes</div>
                </div>
            </div>
            <div style="margin-top:12px; display:flex; gap:6px;" onclick={(e) => e.stopPropagation()}>
                <button onclick={() => editarSetor(setor)} style="background:#d97706; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                <button onclick={() => removerSetor(setor.id)} style="background:#dc2626; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Remover</button>
            </div>
        </div>
        {/each}
    </div>
    {/if}

<!-- TELA 2: ESTANTES -->
{:else if tela === 'setor'}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="color:#6b7280; font-size:14px;">{setorSelecionado?.descricao ?? ''}</div>
        <button onclick={() => { mostrarFormEstante=true; editandoEstante=null; formEstante={nome:'',descricao:'',setor_id:''}; }}
            style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
            + Nova Estante
        </button>
    </div>

    {#if mostrarFormEstante}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:16px;">
        <h3 style="font-weight:bold; margin-bottom:12px;">{editandoEstante ? 'Editar' : 'Nova'} Estante</h3>
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:12px;">
            <div>
                <label style="display:block; margin-bottom:4px;">Nome *</label>
                <input bind:value={formEstante.nome} placeholder="Ex: Filosofia, Literatura Brasileira..."
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Descrição</label>
                <input bind:value={formEstante.descricao}
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px;">
            <button onclick={salvarEstante} style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Salvar</button>
            <button onclick={() => mostrarFormEstante=false} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancelar</button>
        </div>
    </div>
    {/if}

    {#if !setorSelecionado?.estantes || setorSelecionado.estantes.length === 0}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:48px; text-align:center; color:#6b7280;">
            Nenhuma estante neste setor ainda.
        </div>
    {:else}
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
        {#each setorSelecionado.estantes as estante}
        {@const qtdLivros = livrosDaEstante(estante.id).length}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; cursor:pointer; border:2px solid #e5e7eb;"
            onclick={() => abrirEstante(estante)}>
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-size:18px; font-weight:bold;">{estante.nome}</div>
                    {#if estante.descricao}<div style="font-size:13px; color:#6b7280; margin-top:2px;">{estante.descricao}</div>{/if}
                </div>
                <div style="text-align:right;">
                    <div style="font-size:22px; font-weight:bold; color:#7c3aed;">{qtdLivros}</div>
                    <div style="font-size:11px; color:#6b7280;">livros</div>
                </div>
            </div>
            <div style="margin-top:12px; display:flex; gap:6px;" onclick={(e) => e.stopPropagation()}>
                <button onclick={() => editarEstante(estante)} style="background:#d97706; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                <button onclick={() => removerEstante(estante.id)} style="background:#dc2626; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Remover</button>
            </div>
        </div>
        {/each}
    </div>
    {/if}

<!-- TELA 3: LIVROS DA ESTANTE -->
{:else if tela === 'estante'}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="color:#6b7280; font-size:14px;">{estanteSelecionada?.descricao ?? ''}</div>
        <div style="display:flex; gap:8px;">
            <button onclick={() => { mostrarVincular = !mostrarVincular; mostrarFormLivro = false; buscaVincular = ''; }}
                style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
                Vincular Livro Existente
            </button>
            <button onclick={abrirFormLivro}
                style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
                + Novo Livro
            </button>
        </div>
    </div>

    {#if mostrarVincular}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:20px; margin-bottom:16px;">
        <h3 style="font-weight:bold; margin-bottom:12px;">Vincular livro já cadastrado</h3>
        <input bind:value={buscaVincular} placeholder="Digite o título ou autor..."
            style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; margin-bottom:8px;" />
        {#if livrosSemEstante.length > 0}
            {#each livrosSemEstante as livro}
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid #e5e7eb; border-radius:4px; margin-bottom:6px;">
                <div>
                    <div style="font-weight:bold;">{livro.nome}</div>
                    <div style="font-size:13px; color:#6b7280;">{livro.autor || '-'} — {livro.categoria}</div>
                </div>
                <button onclick={() => vincularLivro(livro)}
                    style="background:#2563eb; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:13px;">
                    Adicionar aqui
                </button>
            </div>
            {/each}
        {:else if buscaVincular.length > 0}
            <p style="color:#6b7280; font-size:14px;">Nenhum livro sem estante encontrado.</p>
        {/if}
    </div>
    {/if}

    {#if mostrarFormLivro}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:16px;">
        <h3 style="font-weight:bold; margin-bottom:16px;">{editandoLivro ? 'Editar' : 'Novo'} Livro — {estanteSelecionada.nome}</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
                <label style="display:block; margin-bottom:4px;">Título *</label>
                <input bind:value={formLivro.nome} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">ISBN</label>
                <input bind:value={formLivro.isbn} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Autor</label>
                <input bind:value={formLivro.autor} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Categoria</label>
                <select bind:value={formLivro.categoria} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;">
                    <option value="livro">Livro</option>
                    <option value="revista">Revista</option>
                    <option value="colecao">Coleção</option>
                    <option value="jornal">Jornal</option>
                    <option value="gibi">Gibi</option>
                </select>
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Gênero</label>
                <input bind:value={formLivro.genero} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Editora</label>
                <input bind:value={formLivro.editora} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Ano</label>
                <input bind:value={formLivro.ano_publicacao} type="number" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Páginas</label>
                <input bind:value={formLivro.num_paginas} type="number" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">Quantidade</label>
                <input bind:value={formLivro.quantidade} type="number" min="1" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; margin-bottom:4px;">N. Patrimônio</label>
                <input bind:value={formLivro.n_patrimonio} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
            </div>
            <div style="grid-column:1/-1;">
                <label style="display:block; margin-bottom:4px;">Sinopse</label>
                <textarea bind:value={formLivro.sinopse} rows="3" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;"></textarea>
            </div>
            <div style="grid-column:1/-1;">
                <label style="display:block; margin-bottom:4px;">Observação</label>
                <textarea bind:value={formLivro.observacao} rows="2" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;"></textarea>
            </div>
        </div>
        <div style="margin-top:16px; display:flex; gap:8px;">
            <button onclick={salvarLivro} style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Salvar</button>
            <button onclick={() => mostrarFormLivro=false} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancelar</button>
        </div>
    </div>
    {/if}

    {#if livrosDaEstanteAtual.length === 0}
        <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:48px; text-align:center; color:#6b7280;">
            Nenhum livro nesta estante ainda.
        </div>
    {:else}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); overflow:hidden;">
        <div style="padding:16px 20px; background:#f3f0ff; border-left:4px solid #7c3aed; font-weight:bold;">
            {livrosDaEstanteAtual.length} livro{livrosDaEstanteAtual.length !== 1 ? 's' : ''} nesta estante
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead style="background:#f9fafb;">
                <tr>
                    <th style="padding:10px 20px; text-align:left; color:#6b7280;">Título</th>
                    <th style="padding:10px; text-align:left; color:#6b7280;">Autor</th>
                    <th style="padding:10px; text-align:left; color:#6b7280;">Categoria</th>
                    <th style="padding:10px; text-align:left; color:#6b7280;">Qtd</th>
                    <th style="padding:10px; text-align:left; color:#6b7280;">Disponível</th>
                    <th style="padding:10px; text-align:left; color:#6b7280;">Status</th>
                    <th style="padding:10px; text-align:left; color:#6b7280;">Ações</th>
                </tr>
            </thead>
            <tbody>
                {#each livrosDaEstanteAtual as livro}
                <tr style="border-top:1px solid #f3f4f6;">
                    <td style="padding:10px 20px; font-weight:500;">{livro.nome}</td>
                    <td style="padding:10px; color:#6b7280;">{livro.autor || '-'}</td>
                    <td style="padding:10px;">{livro.categoria}</td>
                    <td style="padding:10px;">{livro.quantidade}</td>
                    <td style="padding:10px;">{livro.quantidade_disponivel}</td>
                    <td style="padding:10px;">
                        <span style="background:{livro.status === 'disponivel' ? '#16a34a' : '#dc2626'}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">
                            {livro.status}
                        </span>
                    </td>
                    <td style="padding:10px; display:flex; gap:6px;">
                        <button onclick={() => editarLivro(livro)} style="background:#d97706; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                        <button onclick={() => desvincularLivro(livro)} style="background:#6b7280; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Desvincular</button>
                        <button onclick={() => removerLivro(livro.id)} style="background:#dc2626; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Remover</button>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
    {/if}
{/if}
