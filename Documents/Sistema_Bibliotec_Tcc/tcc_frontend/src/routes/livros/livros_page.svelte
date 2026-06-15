<script>
    import { onMount } from 'svelte';
    import { api } from '$lib/api.js';

    let livros = $state([]);
    let setores = $state([]);
    let estantesFiltradas = $state([]);
    let busca = $state('');
    let carregando = $state(true);
    let mostrarForm = $state(false);
    let editando = $state(null);
    let categoriasExpandidas = $state(new Set(['livro'])); // livro começa aberto por padrão

    let form = $state({
        nome: '', isbn: '', autor: '', categoria: 'livro', genero: '',
        num_paginas: '', ano_publicacao: '', editora: '', quantidade: 1,
        n_patrimonio: '', sinopse: '', observacao: '',
        setor_id: '', estante_id: ''
    });

    const categorias = [
        { valor: 'livro',    label: 'Livro'    },
        { valor: 'revista',  label: 'Revista'  },
        { valor: 'colecao',  label: 'Coleção'  },
        { valor: 'jornal',   label: 'Jornal'   },
        { valor: 'gibi',     label: 'Gibi'     },
    ];

    onMount(async () => { await carregar(); });

    async function carregar() {
        carregando = true;
        [livros, setores] = await Promise.all([api.getLivros(), api.getSetores()]);
        carregando = false;
    }

    function onSetorChange() {
        form.estante_id = '';
        const setor = setores.find(s => s.id == form.setor_id);
        estantesFiltradas = setor?.estantes ?? [];
    }

    async function salvar() {
        if (editando) {
            await api.updateLivro(editando.id, form);
        } else {
            await api.createLivro(form);
        }
        mostrarForm = false;
        editando = null;
        resetForm();
        await carregar();
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
        form = { nome: '', isbn: '', autor: '', categoria: 'livro', genero: '',
            num_paginas: '', ano_publicacao: '', editora: '', quantidade: 1,
            n_patrimonio: '', sinopse: '', observacao: '',
            setor_id: '', estante_id: '' };
        estantesFiltradas = [];
    }

    function toggleCategoria(cat) {
        const novo = new Set(categoriasExpandidas);
        novo.has(cat) ? novo.delete(cat) : novo.add(cat);
        categoriasExpandidas = novo;
    }

    let filtrados = $derived(livros.filter(l =>
        l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        l.autor?.toLowerCase().includes(busca.toLowerCase()) ||
        l.isbn?.includes(busca) ||
        l.n_patrimonio?.includes(busca)
    ));

    // Quando há busca ativa, expandir todas as categorias automaticamente
    $effect(() => {
        if (busca.length > 0) {
            categoriasExpandidas = new Set(categorias.map(c => c.valor));
        }
    });

    function livrosDaCategoria(cat) {
        return filtrados.filter(l => l.categoria === cat);
    }

    function emprestadosDaCategoria(cat) {
        return livrosDaCategoria(cat).filter(l => l.status !== 'disponivel').length;
    }

    // Categorias que têm pelo menos um livro nos filtrados
    let categoriasComLivros = $derived(
        categorias.filter(c => livrosDaCategoria(c.valor).length > 0)
    );

    // Livros sem categoria reconhecida
    let semCategoria = $derived(
        filtrados.filter(l => !categorias.find(c => c.valor === l.categoria))
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
    <button onclick={() => { mostrarForm = true; editando = null; resetForm(); }}
        style="background:#16a34a; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">
        Novo Livro
    </button>
</div>

{#if mostrarForm}
<div style="background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px;">
    <h2 style="font-size:18px; font-weight:bold; margin-bottom:16px;">{editando ? 'Editar' : 'Novo'} Livro</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
            <label style="display:block; margin-bottom:4px;">Título *</label>
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
                    <option value={c.valor}>{c.label}</option>
                {/each}
            </select>
        </div>
        <div>
            <label style="display:block; margin-bottom:4px;">Gênero</label>
            <input bind:value={form.genero} style="width:100%; border:1px solid #d1d5db; border-radius:4px; padding:8px; box-sizing:border-box;" />
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
            <label style="display:block; margin-bottom:4px;">N. Patrimônio</label>
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
    {@const livrosCat = livrosDaCategoria(cat.valor)}
    {@const expandida = categoriasExpandidas.has(cat.valor)}
    <div style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:12px;">
        <!-- Cabeçalho da categoria -->
        <div onclick={() => toggleCategoria(cat.valor)}
            style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; cursor:pointer; background:#f9fafb; border-left:4px solid #2563eb;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; font-size:16px;">{cat.label}</span>
                <span style="background:#2563eb; color:white; padding:2px 10px; border-radius:999px; font-size:12px;">
                    {livrosCat.length} {livrosCat.length === 1 ? 'item' : 'itens'}
                </span>
                {#if emprestadosDaCategoria(cat.valor) > 0}
                    <span style="background:#d97706; color:white; padding:2px 8px; border-radius:999px; font-size:12px;">
                        {emprestadosDaCategoria(cat.valor)} emprestado{emprestadosDaCategoria(cat.valor) !== 1 ? 's' : ''}
                    </span>
                {/if}
            </div>
            <span style="font-size:18px; color:#6b7280;">{expandida ? '▲' : '▼'}</span>
        </div>
        <!-- Tabela da categoria -->
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

    <!-- Livros com categoria não reconhecida -->
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
