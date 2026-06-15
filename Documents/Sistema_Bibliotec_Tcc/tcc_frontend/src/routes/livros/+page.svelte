<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';

    let livros = $state([]);
    let setores = $state([]);
    let categorias = $state([]);
    let generos = $state([]);
    let estantesFiltradas = $state([]);
    let busca = $state('');
    let carregando = $state(true);
    let mostrarForm = $state(false);
    let mostrarFormCategoria = $state(false);
    let editandoCategoria = $state(null);
    let editando = $state(null);
    let categoriasExpandidas = $state(new Set(['livro']));
    let novaCategoriaNome = $state('');
    let mostrarFormGenero = $state(false);
    let editandoGenero = $state(null);
    let novoGeneroNome = $state('');
    let novoGeneroDescricao = $state('');
    let novaCategoriaDescricao = $state('');
    let mensagem = $state('');
    let erro = $state('');

    let form = $state({
        nome: '', isbn: '', autor: '', categoria: 'livro', genero: '',
        num_paginas: '', ano_publicacao: '', editora: '', quantidade: 1,
        n_patrimonio: '', sinopse: '', observacao: '',
        setor_id: '', estante_id: ''
    });

    onMount(async () => { await carregar(); });

    async function carregar() {
        carregando = true;
        [livros, setores, categorias, generos] = await Promise.all([
            api.getLivros(),
            api.getSetores(),
            api.getCategorias(),
            api.getGeneros()
        ]);
        carregando = false;
    }

    function onSetorChange() {
        form.estante_id = '';
        const setor = setores.find(s => s.id == form.setor_id);
        estantesFiltradas = setor?.estantes ?? [];
    }

    async function salvar() {
        erro = '';
        if (!form.nome.trim()) { erro = 'Título obrigatório!'; return; }
        if (!form.n_patrimonio.trim()) { erro = 'N. Patrimônio obrigatório!'; return; }
        const res = editando
            ? await api.updateLivro(editando.id, form)
            : await api.createLivro(form);
        if (res.id) {
            mostrarForm = false;
            editando = null;
            resetForm();
            await carregar();
        } else { erro = res.message || 'Erro ao salvar livro'; }
    }

    function editar(livro) {
        editando = livro;
        form = {
            nome: livro.nome, isbn: livro.isbn ?? '', autor: livro.autor ?? '',
            categoria: livro.categoria, genero: livro.genero ?? '',
            num_paginas: livro.num_paginas ?? '', ano_publicacao: livro.ano_publicacao ?? '',
            editora: livro.editora ?? '', quantidade: livro.quantidade,
            n_patrimonio: livro.n_patrimonio, sinopse: livro.sinopse ?? '',
            observacao: livro.observacao ?? '',
            setor_id: livro.estante?.setor?.id ?? '',
            estante_id: livro.estante_id ?? ''
        };
        const setor = setores.find(s => s.id == form.setor_id);
        estantesFiltradas = setor?.estantes ?? [];
        mostrarForm = true;
    }

    async function remover(id) {
        if (confirm('Remover livro?')) {
            await api.deleteLivro(id);
            await carregar();
        }
    }

    function resetForm() {
        form = { nome: '', isbn: '', autor: '', categoria: categorias[0]?.nome ?? 'livro', genero: '',
            num_paginas: '', ano_publicacao: '', editora: '', quantidade: 1,
            n_patrimonio: '', sinopse: '', observacao: '',
            setor_id: '', estante_id: '' };
        estantesFiltradas = [];
    }

    async function salvarCategoria() {
        erro = '';
        if (!novaCategoriaNome.trim()) { erro = 'Nome da categoria obrigatório!'; return; }
        const data = {
            nome: novaCategoriaNome.trim(),
            descricao: novaCategoriaDescricao.trim() || novaCategoriaNome.trim()
        };
        const res = editandoCategoria
            ? await api.updateCategoria(editandoCategoria.id, data)
            : await api.createCategoria(data);
        if (res.id) {
            mensagem = editandoCategoria ? `Categoria "${res.descricao}" atualizada!` : `Categoria "${res.descricao}" criada!`;
            categorias = await api.getCategorias();
            const novo = new Set(categoriasExpandidas);
            novo.add(res.nome);
            categoriasExpandidas = novo;
            novaCategoriaNome = '';
            novaCategoriaDescricao = '';
            editandoCategoria = null;
            if (mostrarForm) form.categoria = res.nome;
        } else { erro = res.message || 'Erro ao salvar categoria'; }
    }

    function editarCategoria(cat) {
        editandoCategoria = cat;
        novaCategoriaNome = cat.nome;
        novaCategoriaDescricao = cat.descricao;
    }

    function cancelarEdicaoCategoria() {
        editandoCategoria = null;
        novaCategoriaNome = '';
        novaCategoriaDescricao = '';
    }

    async function removerCategoria(cat) {
        if (confirm(`Remover categoria "${cat.descricao}"? Os livros desta categoria não serão apagados.`)) {
            await api.deleteCategoria(cat.id);
            categorias = categorias.filter(c => c.id !== cat.id);
            mensagem = 'Categoria removida.';
        }
    }

    async function salvarGenero() {
        erro = '';
        if (!novoGeneroNome.trim()) { erro = 'Nome do gênero obrigatório!'; return; }
        const data = {
            nome: novoGeneroNome.trim(),
            descricao: novoGeneroDescricao.trim() || novoGeneroNome.trim()
        };
        const res = editandoGenero
            ? await api.updateGenero(editandoGenero.id, data)
            : await api.createGenero(data);
        if (res.id) {
            mensagem = editandoGenero ? `Gênero "${res.descricao}" atualizado!` : `Gênero "${res.descricao}" criado!`;
            generos = await api.getGeneros();
            novoGeneroNome = '';
            novoGeneroDescricao = '';
            editandoGenero = null;
        } else { erro = res.message || 'Erro ao salvar gênero'; }
    }

    function editarGenero(g) {
        editandoGenero = g;
        novoGeneroNome = g.nome;
        novoGeneroDescricao = g.descricao;
    }

    function cancelarEdicaoGenero() {
        editandoGenero = null;
        novoGeneroNome = '';
        novoGeneroDescricao = '';
    }

    async function removerGenero(g) {
        const qtd = livros.filter(l => l.genero === g.nome).length;
        if (qtd > 0) { erro = `Não é possível remover: ${qtd} livro(s) com este gênero.`; return; }
        if (!confirm(`Remover gênero "${g.descricao}"?`)) return;
        await api.deleteGenero(g.id);
        generos = generos.filter(x => x.id !== g.id);
        mensagem = 'Gênero removido.';
    }

    function toggleCategoria(nome) {
        const novo = new Set(categoriasExpandidas);
        novo.has(nome) ? novo.delete(nome) : novo.add(nome);
        categoriasExpandidas = novo;
    }

    let filtrados = $derived(livros.filter(l =>
        l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        l.autor?.toLowerCase().includes(busca.toLowerCase()) ||
        l.isbn?.includes(busca) ||
        l.n_patrimonio?.includes(busca) ||
        l.genero?.toLowerCase().includes(busca.toLowerCase())
    ));

    $effect(() => {
        if (busca.length > 0) {
            categoriasExpandidas = new Set(categorias.map(c => c.nome));
        }
    });

    function livrosDaCategoria(nomecat) {
        return filtrados.filter(l => l.categoria === nomecat);
    }

    function emprestadosDaCategoria(nomecat) {
        return livrosDaCategoria(nomecat).filter(l => l.status !== 'disponivel').length;
    }

    let categoriasComLivros = $derived(
        categorias.filter(c => livrosDaCategoria(c.nome).length > 0)
    );

    let semCategoria = $derived(
        filtrados.filter(l => !categorias.find(c => c.nome === l.categoria))
    );
</script>

<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
    <div style="display:flex; align-items:center; gap:12px;">
        <a href="/" style="background:#e5e7eb; color:#1f2937; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:14px;">← Voltar</a>
        <h1 style="font-size:24px; font-weight:bold;">Livros</h1>
        <span style="background:#e5e7eb; color:#374151; padding:2px 10px; border-radius:999px; font-size:13px;">
            {livros.length} no total
        </span>
    </div>
    <div style="display:flex; gap:8px;">
        <button onclick={() => { mostrarFormGenero = !mostrarFormGenero; mostrarFormCategoria = false; mostrarForm = false; }} style="background:#0891b2; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
            Gerenciar Generos
        </button>
        <button onclick={() => { mostrarFormCategoria = !mostrarFormCategoria; mostrarFormGenero = false; mostrarForm = false; }}
            style="background:#7c3aed; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
            Gerenciar Categorias
        </button>
        <button onclick={() => { mostrarForm = true; editando = null; resetForm(); mostrarFormCategoria = false; }}
            style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
            Novo Livro
        </button>
    </div>
</div>

{#if mensagem}<div style="background:#dcfce7; color:#16a34a; padding:12px; border-radius:4px; margin-bottom:16px;">{mensagem}</div>{/if}
{#if erro}<div style="background:#fee2e2; color:#dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">{erro}</div>{/if}

{#if mostrarFormCategoria}
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px; border-left:4px solid #7c3aed;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:18px; font-weight:bold;">Gerenciar Categorias</h2>
        <button onclick={() => { mostrarFormCategoria = false; cancelarEdicaoCategoria(); }}
            style="background:#6b7280; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:13px;">Fechar</button>
    </div>

    <!-- Formulário criar/editar -->
    <div style="background:#f9fafb; border-radius:6px; padding:16px; margin-bottom:20px;">
        <h3 style="font-size:14px; font-weight:bold; margin-bottom:12px; color:#7c3aed;">
            {editandoCategoria ? `Editando: ${editandoCategoria.descricao}` : 'Nova Categoria'}
        </h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
                <label style="display:block; margin-bottom:4px; font-size:13px;">Nome interno <span style="color:#dc2626;">*</span></label>
                <input bind:value={novaCategoriaNome} placeholder="Ex: manual, apostila..."
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; font-size:13px;"
                    disabled={!!editandoCategoria} />
                <span style="font-size:11px; color:#6b7280;">Sem espaços ou acentos</span>
            </div>
            <div>
                <label style="display:block; margin-bottom:4px; font-size:13px;">Nome de exibição</label>
                <input bind:value={novaCategoriaDescricao} placeholder="Ex: Manual, Apostila..."
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; font-size:13px;" />
                <span style="font-size:11px; color:#6b7280;">Como aparece na tela</span>
            </div>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px;">
            <button onclick={salvarCategoria} style="background:#7c3aed; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-size:13px;">
                {editandoCategoria ? "Salvar alteração" : "Criar categoria"}
            </button>
            {#if editandoCategoria}
            <button onclick={cancelarEdicaoCategoria} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-size:13px;">Cancelar edição</button>
            {/if}
        </div>
    </div>

    <!-- Lista de categorias -->
    <div>
        <div style="font-size:13px; font-weight:bold; color:#6b7280; margin-bottom:8px;">Categorias cadastradas ({categorias.length})</div>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
                <tr style="background:#f3f4f6; color:#6b7280;">
                    <th style="padding:8px 12px; text-align:left;">Nome de exibição</th>
                    <th style="padding:8px 12px; text-align:left;">Nome interno</th>
                    <th style="padding:8px 12px; text-align:left;">Livros</th>
                    <th style="padding:8px 12px; text-align:left;">Ações</th>
                </tr>
            </thead>
            <tbody>
                {#each categorias as cat}
                {@const qtd = livros.filter(l => l.categoria === cat.nome).length}
                <tr style="border-top:1px solid #e5e7eb; background:{editandoCategoria?.id === cat.id ? '#f3f0ff' : 'white'};">
                    <td style="padding:8px 12px; font-weight:500;">{cat.descricao}</td>
                    <td style="padding:8px 12px; color:#6b7280; font-family:monospace;">{cat.nome}</td>
                    <td style="padding:8px 12px;">
                        <span style="background:#e5e7eb; padding:2px 8px; border-radius:999px; font-size:12px;">{qtd}</span>
                    </td>
                    <td style="padding:8px 12px; display:flex; gap:6px;">
                        <button onclick={() => editarCategoria(cat)}
                            style="background:#d97706; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                        <button onclick={() => removerCategoria(cat)}
                            style="background:#dc2626; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px;"
                            disabled={qtd > 0}
                            title={qtd > 0 ? `${qtd} livro(s) nessa categoria` : ''}>
                            Remover
                        </button>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
{/if}

{#if mostrarFormGenero}
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px; border-left:4px solid #0891b2;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:18px; font-weight:bold;">Gerenciar Gêneros</h2>
        <button onclick={() => { mostrarFormGenero = false; cancelarEdicaoGenero(); }}
            style="background:#6b7280; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:13px;">Fechar</button>
    </div>
    <div style="background:#f0f9ff; border-radius:6px; padding:16px; margin-bottom:20px;">
        <h3 style="font-size:14px; font-weight:bold; margin-bottom:12px; color:#0891b2;">
            {editandoGenero ? `Editando: ${editandoGenero.descricao}` : 'Novo Gênero'}
        </h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
                <label style="display:block; margin-bottom:4px; font-size:13px;">Nome interno <span style="color:#dc2626;">*</span></label>
                <input bind:value={novoGeneroNome} placeholder="Ex: ficcao, thriller..."
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; font-size:13px;"
                    disabled={!!editandoGenero} />
                <span style="font-size:11px; color:#6b7280;">Sem espaços ou acentos</span>
            </div>
            <div>
                <label style="display:block; margin-bottom:4px; font-size:13px;">Nome de exibição</label>
                <input bind:value={novoGeneroDescricao} placeholder="Ex: Ficção, Thriller..."
                    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; font-size:13px;" />
            </div>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px;">
            <button onclick={salvarGenero} style="background:#0891b2; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-size:13px;">
                {editandoGenero ? 'Salvar alteração' : 'Criar gênero'}
            </button>
            {#if editandoGenero}
            <button onclick={cancelarEdicaoGenero} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-size:13px;">Cancelar edição</button>
            {/if}
        </div>
    </div>
    <div style="font-size:13px; font-weight:bold; color:#6b7280; margin-bottom:8px;">Gêneros cadastrados ({generos.length})</div>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
            <tr style="background:#f3f4f6; color:#6b7280;">
                <th style="padding:8px 12px; text-align:left;">Nome de exibição</th>
                <th style="padding:8px 12px; text-align:left;">Nome interno</th>
                <th style="padding:8px 12px; text-align:left;">Livros</th>
                <th style="padding:8px 12px; text-align:left;">Ações</th>
            </tr>
        </thead>
        <tbody>
            {#each generos as g}
            {@const qtd = livros.filter(l => l.genero === g.nome).length}
            <tr style="border-top:1px solid #e5e7eb; background:{editandoGenero?.id === g.id ? '#f0f9ff' : 'white'};">
                <td style="padding:8px 12px; font-weight:500;">{g.descricao}</td>
                <td style="padding:8px 12px; color:#6b7280; font-family:monospace;">{g.nome}</td>
                <td style="padding:8px 12px;">
                    <span style="background:#e5e7eb; padding:2px 8px; border-radius:999px; font-size:12px;">{qtd}</span>
                </td>
                <td style="padding:8px 12px; display:flex; gap:6px;">
                    <button onclick={() => editarGenero(g)}
                        style="background:#d97706; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                    <button onclick={() => removerGenero(g)}
                        style="background:#dc2626; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:12px;"
                        disabled={qtd > 0} title={qtd > 0 ? `${qtd} livro(s) com este gênero` : ''}>
                        Remover
                    </button>
                </td>
            </tr>
            {/each}
        </tbody>
    </table>
</div>
{/if}

{#if mostrarForm}
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px;">
    <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">{editando ? 'Editar' : 'Novo'} Livro</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
            <label style="display:block; margin-bottom:4px;">Título <span style="color:#dc2626;">*</span></label>
            <input bind:value={form.nome} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">ISBN</label>
            <input bind:value={form.isbn} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Autor</label>
            <input bind:value={form.autor} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Categoria</label>
            <select bind:value={form.categoria} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;">
                {#each categorias as c}
                    <option value={c.nome}>{c.descricao}</option>
                {/each}
            </select>
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Gênero</label>
            <select bind:value={form.genero} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;">
                <option value="">Sem gênero</option>
                {#each generos as g}
                    <option value={g.nome}>{g.descricao}</option>
                {/each}
            </select>
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Editora</label>
            <input bind:value={form.editora} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Ano</label>
            <input bind:value={form.ano_publicacao} type="number" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Páginas</label>
            <input bind:value={form.num_paginas} type="number" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Quantidade</label>
            <input bind:value={form.quantidade} type="number" min="1" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">N. Patrimônio <span style="color:#dc2626;">*</span></label>
            <input bind:value={form.n_patrimonio} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Setor</label>
            <select bind:value={form.setor_id} onchange={onSetorChange}
                style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;">
                <option value="">Sem setor</option>
                {#each setores as s}
                    <option value={s.id}>{s.nome}</option>
                {/each}
            </select>
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Estante</label>
            <select bind:value={form.estante_id}
                style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;"
                disabled={!form.setor_id}>
                <option value="">Sem estante</option>
                {#each estantesFiltradas as e}
                    <option value={e.id}>{e.nome}</option>
                {/each}
            </select>
        </div>
        <div style="grid-column:1/-1;">
            <label style="display:block; margin-bottom:4px;">Sinopse</label>
            <textarea bind:value={form.sinopse} rows="3" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;"></textarea>
        </div>
        <div style="grid-column:1/-1;">
            <label style="display:block; margin-bottom:4px;">Observação (estado do livro)</label>
            <textarea bind:value={form.observacao} rows="2" style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;"></textarea>
        </div>
    </div>
    <div style="margin-top:16px; display:flex; gap:8px;">
        <button onclick={salvar} style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Salvar</button>
        <button onclick={() => { mostrarForm = false; resetForm(); }} style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancelar</button>
    </div>
</div>
{/if}

<input bind:value={busca} placeholder="Pesquisar por título, autor, ISBN ou patrimônio..."
    style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box; margin-bottom:16px;" />

{#if carregando}
    <p>Carregando...</p>
{:else if filtrados.length === 0}
    <div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:48px; text-align:center; color:#6b7280;">
        {busca ? 'Nenhum livro encontrado.' : 'Nenhum livro cadastrado ainda.'}
    </div>
{:else}
    {#each categoriasComLivros as cat}
    {@const livrosCat = livrosDaCategoria(cat.nome)}
    {@const expandida = categoriasExpandidas.has(cat.nome)}
    {@const emprestados = emprestadosDaCategoria(cat.nome)}
    <div style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:12px;">
        <div onclick={() => toggleCategoria(cat.nome)}
            style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; cursor:pointer; background:#f9fafb; border-left:4px solid #2563eb;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; font-size:16px;">{cat.descricao}</span>
                <span style="background:#2563eb; color:white; padding:2px 10px; border-radius:999px; font-size:12px;">
                    {livrosCat.length} {livrosCat.length === 1 ? 'item' : 'itens'}
                </span>
                {#if emprestados > 0}
                    <span style="background:#d97706; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                        {emprestados} emprestado{emprestados !== 1 ? 's' : ''}
                    </span>
                {/if}
            </div>
            <span style="font-size:18px; color:#6b7280;">{expandida ? '▲' : '▼'}</span>
        </div>
        {#if expandida}
        <table style="width:100%; border-collapse:collapse; background:white; font-size:14px;">
            <thead style="background:#1f2937; color:white;">
                <tr>
                    <th style="padding:10px 20px; text-align:left;">Título</th>
                    <th style="padding:10px; text-align:left;">Autor</th>
                    <th style="padding:10px; text-align:left;">Gênero</th>
                    <th style="padding:10px; text-align:left;">Localização</th>
                    <th style="padding:10px; text-align:left;">Qtd</th>
                    <th style="padding:10px; text-align:left;">Disponível</th>
                    <th style="padding:10px; text-align:left;">Status</th>
                    <th style="padding:10px; text-align:left;">Ações</th>
                </tr>
            </thead>
            <tbody>
                {#each livrosCat as livro}
                <tr style="border-top:1px solid #f3f4f6;">
                    <td style="padding:10px 20px; font-weight:500;">{livro.nome}</td>
                    <td style="padding:10px; color:#6b7280;">{livro.autor || '-'}</td>
                    <td style="padding:10px; color:#6b7280;">{livro.genero || '-'}</td>
                    <td style="padding:10px; font-size:12px; color:#6b7280;">
                        {#if livro.estante}
                            {livro.estante.setor?.nome ?? ''} › {livro.estante.nome}
                        {:else}
                            -
                        {/if}
                    </td>
                    <td style="padding:10px;">{livro.quantidade}</td>
                    <td style="padding:10px;">{livro.quantidade_disponivel}</td>
                    <td style="padding:10px;">
                        <span style="background:{livro.status === 'disponivel' ? '#16a34a' : '#dc2626'}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">
                            {livro.status}
                        </span>
                    </td>
                    <td style="padding:10px; display:flex; gap:6px;">
                        <button onclick={() => editar(livro)} style="background:#d97706; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                        <button onclick={() => remover(livro.id)} style="background:#dc2626; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Remover</button>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
        {/if}
    </div>
    {/each}

    {#if semCategoria.length > 0}
    {@const expandida = categoriasExpandidas.has('_outros')}
    <div style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:12px;">
        <div onclick={() => toggleCategoria('_outros')}
            style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; cursor:pointer; background:#f9fafb; border-left:4px solid #6b7280;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; font-size:16px;">Outros</span>
                <span style="background:#6b7280; color:white; padding:2px 10px; border-radius:999px; font-size:12px;">
                    {semCategoria.length} {semCategoria.length === 1 ? 'item' : 'itens'}
                </span>
            </div>
            <span style="font-size:18px; color:#6b7280;">{expandida ? '▲' : '▼'}</span>
        </div>
        {#if expandida}
        <table style="width:100%; border-collapse:collapse; background:white; font-size:14px;">
            <thead style="background:#1f2937; color:white;">
                <tr>
                    <th style="padding:10px 20px; text-align:left;">Título</th>
                    <th style="padding:10px; text-align:left;">Autor</th>
                    <th style="padding:10px; text-align:left;">Categoria</th>
                    <th style="padding:10px; text-align:left;">Qtd</th>
                    <th style="padding:10px; text-align:left;">Status</th>
                    <th style="padding:10px; text-align:left;">Ações</th>
                </tr>
            </thead>
            <tbody>
                {#each semCategoria as livro}
                <tr style="border-top:1px solid #f3f4f6;">
                    <td style="padding:10px 20px; font-weight:500;">{livro.nome}</td>
                    <td style="padding:10px; color:#6b7280;">{livro.autor || '-'}</td>
                    <td style="padding:10px;">{livro.categoria}</td>
                    <td style="padding:10px;">{livro.quantidade}</td>
                    <td style="padding:10px;">
                        <span style="background:{livro.status === 'disponivel' ? '#16a34a' : '#dc2626'}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">
                            {livro.status}
                        </span>
                    </td>
                    <td style="padding:10px; display:flex; gap:6px;">
                        <button onclick={() => editar(livro)} style="background:#d97706; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Editar</button>
                        <button onclick={() => remover(livro.id)} style="background:#dc2626; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Remover</button>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
        {/if}
    </div>
    {/if}
{/if}



