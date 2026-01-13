import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Edit2, X } from 'lucide-react';
import { saveAnswerKey, getAllAnswerKeys, deleteAnswerKey } from '../utils/storage';

const AnswerKey = () => {
    const [answerKeys, setAnswerKeys] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        questions: [],
        minPassingScore: 60,
    });

    useEffect(() => {
        loadAnswerKeys();
    }, []);

    const loadAnswerKeys = () => {
        const keys = getAllAnswerKeys();
        setAnswerKeys(keys);
    };

    const handleCreateNew = () => {
        setFormData({
            name: '',
            questions: Array.from({ length: 10 }, (_, i) => ({
                number: i + 1,
                correctAnswer: 'A',
                weight: 10,
            })),
            minPassingScore: 60,
        });
        setIsCreating(true);
        setEditingId(null);
    };

    const handleEdit = (answerKey) => {
        setFormData({
            name: answerKey.name,
            questions: [...answerKey.questions],
            minPassingScore: answerKey.minPassingScore || 60,
        });
        setEditingId(answerKey.id);
        setIsCreating(true);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({ name: '', questions: [], minPassingScore: 60 });
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index] = {
            ...newQuestions[index],
            [field]: field === 'weight' ? parseFloat(value) || 0 : value,
        };
        setFormData({ ...formData, questions: newQuestions });
    };

    const addQuestion = () => {
        setFormData({
            ...formData,
            questions: [
                ...formData.questions,
                {
                    number: formData.questions.length + 1,
                    correctAnswer: 'A',
                    weight: 10,
                },
            ],
        });
    };

    const removeQuestion = (index) => {
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        // Renumber questions
        newQuestions.forEach((q, i) => {
            q.number = i + 1;
        });
        setFormData({ ...formData, questions: newQuestions });
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert('Por favor, insira um nome para o gabarito');
            return;
        }

        if (formData.questions.length === 0) {
            alert('Adicione pelo menos uma questão');
            return;
        }

        const totalWeight = formData.questions.reduce((sum, q) => sum + q.weight, 0);

        const answerKey = {
            id: editingId || Date.now().toString(),
            name: formData.name,
            questions: formData.questions,
            totalWeight: totalWeight.toFixed(2),
            minPassingScore: formData.minPassingScore,
            createdAt: editingId ? answerKeys.find(k => k.id === editingId)?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (saveAnswerKey(answerKey)) {
            loadAnswerKeys();
            handleCancel();
        } else {
            alert('Erro ao salvar gabarito');
        }
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este gabarito?')) {
            if (deleteAnswerKey(id)) {
                loadAnswerKeys();
            }
        }
    };

    const totalWeight = formData.questions.reduce((sum, q) => sum + q.weight, 0);

    return (
        <div style={{ padding: '2rem 0', minHeight: 'calc(100vh - 200px)' }}>
            <div className="container">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                }}>
                    <div>
                        <h2>Gerenciar Gabaritos</h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Crie e gerencie gabaritos para correção de provas
                        </p>
                    </div>
                    {!isCreating && (
                        <button onClick={handleCreateNew} className="btn btn-primary">
                            <Plus size={20} />
                            Novo Gabarito
                        </button>
                    )}
                </div>

                {isCreating ? (
                    <div className="card animate-fadeIn">
                        <div className="card-header">
                            <h3 className="card-title">
                                {editingId ? 'Editar Gabarito' : 'Novo Gabarito'}
                            </h3>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Nome do Gabarito</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex: Prova de Matemática - 1º Bimestre"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Pontuação Mínima para Aprovação (%)</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="Ex: 60"
                                min="0"
                                max="100"
                                value={formData.minPassingScore}
                                onChange={(e) => setFormData({ ...formData, minPassingScore: parseFloat(e.target.value) || 0 })}
                            />
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                                Porcentagem mínima necessária para considerar aprovado
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                            }}>
                                <label className="input-label" style={{ marginBottom: 0 }}>
                                    Questões ({formData.questions.length})
                                </label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--primary)',
                                        fontWeight: 600,
                                    }}>
                                        Pontuação Total: {totalWeight.toFixed(2)} pontos
                                    </span>
                                    <button onClick={addQuestion} className="btn btn-secondary btn-icon">
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gap: '0.75rem',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                padding: '0.5rem',
                            }}>
                                {formData.questions.map((question, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '60px 1fr 1fr auto',
                                            gap: '0.75rem',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                        }}
                                    >
                                        <div style={{
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            textAlign: 'center',
                                        }}>
                                            #{question.number}
                                        </div>
                                        <select
                                            className="input"
                                            value={question.correctAnswer}
                                            onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                                            style={{ padding: '0.5rem' }}
                                        >
                                            {['A', 'B', 'C', 'D', 'E'].map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="Pontos"
                                            min="0"
                                            max="1000"
                                            step="1"
                                            value={question.weight}
                                            onChange={(e) => handleQuestionChange(index, 'weight', e.target.value)}
                                            style={{ padding: '0.5rem' }}
                                        />
                                        <button
                                            onClick={() => removeQuestion(index)}
                                            className="btn btn-danger btn-icon"
                                            disabled={formData.questions.length === 1}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={handleCancel} className="btn btn-secondary">
                                <X size={18} />
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="btn btn-success">
                                <Save size={18} />
                                Salvar Gabarito
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-2">
                        {answerKeys.length === 0 ? (
                            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
                                    Nenhum gabarito cadastrado. Clique em "Novo Gabarito" para começar.
                                </p>
                            </div>
                        ) : (
                            answerKeys.map((key) => (
                                <div key={key.id} className="card animate-fadeIn">
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '1rem',
                                    }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                                {key.name}
                                            </h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                Criado em {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                    }}>
                                        <div className="badge badge-info">
                                            {key.questions.length} questões
                                        </div>
                                        <div className="badge badge-success">
                                            Total: {key.totalWeight} pts
                                        </div>
                                        <div className="badge badge-warning" style={{ gridColumn: '1 / -1' }}>
                                            Mínimo: {key.minPassingScore || 60}%
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEdit(key)}
                                            className="btn btn-secondary"
                                            style={{ flex: 1 }}
                                        >
                                            <Edit2 size={16} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(key.id)}
                                            className="btn btn-danger"
                                            style={{ flex: 1 }}
                                        >
                                            <Trash2 size={16} />
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnswerKey;
