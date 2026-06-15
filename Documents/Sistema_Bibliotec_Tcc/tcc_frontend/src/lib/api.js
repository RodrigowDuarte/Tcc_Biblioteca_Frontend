const API_URL = 'http://127.0.0.1:8000/api';
function getToken() {
    return localStorage.getItem('token');
}
async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    return response.json();
}
export const api = {
    login: (email, password) =>
        request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),
    // Alunos
    getAlunos: () => request('/alunos'),
    getAluno: (id) => request(`/alunos/${id}`),
    createAluno: (data) => request('/alunos', { method: 'POST', body: JSON.stringify(data) }),
    updateAluno: (id, data) => request(`/alunos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAluno: (id) => request(`/alunos/${id}`, { method: 'DELETE' }),
    inadimplentes: () => request('/alunos-inadimplentes'),
    alunosPorTurma: (turma) => request(`/alunos/turma/${turma}`),
    // Livros
    getLivros: () => request('/livros'),
    getLivro: (id) => request(`/livros/${id}`),
    createLivro: (data) => request('/livros', { method: 'POST', body: JSON.stringify(data) }),
    updateLivro: (id, data) => request(`/livros/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLivro: (id) => request(`/livros/${id}`, { method: 'DELETE' }),
    // Categorias
    getCategorias: () => request('/categorias'),
    createCategoria: (data) => request('/categorias', { method: 'POST', body: JSON.stringify(data) }),
    updateCategoria: (id, data) => request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategoria: (id) => request(`/categorias/${id}`, { method: 'DELETE' }),
    // Generos
    getGeneros: () => request('/generos'),
    createGenero: (data) => request('/generos', { method: 'POST', body: JSON.stringify(data) }),
    updateGenero: (id, data) => request(`/generos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteGenero: (id) => request(`/generos/${id}`, { method: 'DELETE' }),
    // Emprestimos
    getEmprestimos: () => request('/emprestimos'),
    emprestar: (data) => request('/emprestar', { method: 'POST', body: JSON.stringify(data) }),
    devolver: (data) => request('/devolver', { method: 'POST', body: JSON.stringify(data) }),
    getHistorico: () => request('/historico'),
    deletarHistorico: (id) => request(`/historico/${id}`, { method: 'DELETE' }),
    limparHistorico: () => request('/historico/limpar', { method: 'DELETE' }),
    getInadimplentes: () => request('/inadimplentes'),
    // Turmas
    getTurmas: () => request('/turmas'),
    getTurma: (id) => request(`/turmas/${id}`),
    createTurma: (data) => request('/turmas', { method: 'POST', body: JSON.stringify(data) }),
    updateTurma: (id, data) => request(`/turmas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTurma: (id) => request(`/turmas/${id}`, { method: 'DELETE' }),
    getMembrosDaTurma: (id) => request(`/turmas/${id}/membros`),
    // Localizacao
    getSetores: () => request('/setores'),
    createSetor: (data) => request('/setores', { method: 'POST', body: JSON.stringify(data) }),
    updateSetor: (id, data) => request(`/setores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSetor: (id) => request(`/setores/${id}`, { method: 'DELETE' }),
    getEstantes: () => request('/estantes'),
    createEstante: (data) => request('/estantes', { method: 'POST', body: JSON.stringify(data) }),
    updateEstante: (id, data) => request(`/estantes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEstante: (id) => request(`/estantes/${id}`, { method: 'DELETE' }),
    getPrateleiras: () => request('/prateleiras'),
    createPrateleira: (data) => request('/prateleiras', { method: 'POST', body: JSON.stringify(data) }),
    updatePrateleira: (id, data) => request(`/prateleiras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePrateleira: (id) => request(`/prateleiras/${id}`, { method: 'DELETE' }),
};
