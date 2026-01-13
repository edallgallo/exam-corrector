import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, Edit3, Camera } from 'lucide-react';
import { getAllAnswerKeys } from '../utils/storage';
import { readAnswersWithOMR, correctExamWithOMR } from '../utils/omrProcessor';
import { calculateGrade } from '../utils/gradeCalculator';

const Correction = () => {
    const navigate = useNavigate();
    const [answerKeys, setAnswerKeys] = useState([]);
    const [selectedKeyId, setSelectedKeyId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [useManualEntry, setUseManualEntry] = useState(false);
    const [manualAnswers, setManualAnswers] = useState({});

    useEffect(() => {
        const keys = getAllAnswerKeys();
        setAnswerKeys(keys);
        if (keys.length > 0) {
            setSelectedKeyId(keys[0].id);
        }
    }, []);

    useEffect(() => {
        if (selectedKeyId) {
            const key = answerKeys.find(k => k.id === selectedKeyId);
            if (key) {
                const answers = {};
                key.questions.forEach(q => {
                    answers[q.number] = '';
                });
                setManualAnswers(answers);
            }
        }
    }, [selectedKeyId, answerKeys]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Por favor, selecione um arquivo de imagem válido');
                return;
            }

            setImageFile(file);
            setError('');

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const fakeEvent = { target: { files: [file] } };
            handleImageChange(fakeEvent);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleManualAnswerChange = (questionNum, value) => {
        setManualAnswers({
            ...manualAnswers,
            [questionNum]: value.toUpperCase()
        });
    };

    const handleSubmit = async () => {
        if (!selectedKeyId) {
            setError('Selecione um gabarito');
            return;
        }

        const answerKey = answerKeys.find(k => k.id === selectedKeyId);

        if (useManualEntry) {
            // Manual entry mode
            const studentAnswers = [];
            for (let i = 1; i <= answerKey.questions.length; i++) {
                studentAnswers.push(manualAnswers[i] || null);
            }

            const gradeResult = calculateGrade(studentAnswers, answerKey);

            navigate('/results', {
                state: {
                    gradeResult,
                    answerKey,
                    imagePath: imagePreview,
                },
            });
            return;
        }

        // OMR mode
        if (!imageFile) {
            setError('Selecione uma imagem da prova');
            return;
        }

        setIsProcessing(true);
        setError('');
        setProgress(0);
        setStatusMessage('Preparando...');

        try {
            // Usar OMR (OpenCV) para ler marcações
            setStatusMessage('Lendo marcações com OMR...');
            setProgress(20);

            const studentAnswers = await readAnswersWithOMR(
                imageFile,
                answerKey.questions.length,
                ["A", "B", "C", "D", "E"],
                false // debug mode
            );

            setProgress(80);
            setStatusMessage('Calculando nota...');

            const gradeResult = calculateGrade(studentAnswers.answers, answerKey);

            setProgress(100);
            setStatusMessage('Concluído!');

            setTimeout(() => {
                navigate('/results', {
                    state: {
                        gradeResult,
                        answerKey,
                        imagePath: imagePreview,
                        omrFlags: studentAnswers.flags, // Passar flags para revisão
                    },
                });
            }, 300);
        } catch (err) {
            setError(err.message || 'Erro ao processar a imagem');
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const selectedKey = answerKeys.find(k => k.id === selectedKeyId);

    return (
        <div style={{ padding: '2rem 0', minHeight: 'calc(100vh - 200px)' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h2>Corrigir Prova</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Selecione um gabarito e escolha o método de entrada
                    </p>
                </div>

                {answerKeys.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <AlertCircle size={48} style={{ color: 'var(--warning)', margin: '0 auto 1rem' }} />
                        <h3 style={{ marginBottom: '1rem' }}>Nenhum gabarito cadastrado</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Você precisa criar um gabarito antes de corrigir provas
                        </p>
                        <button
                            onClick={() => navigate('/answer-key')}
                            className="btn btn-primary"
                        >
                            Criar Gabarito
                        </button>
                    </div>
                ) : (
                    <div className="card animate-fadeIn">
                        <div className="input-group">
                            <label className="input-label">Selecione o Gabarito</label>
                            <select
                                className="input"
                                value={selectedKeyId}
                                onChange={(e) => setSelectedKeyId(e.target.value)}
                                disabled={isProcessing}
                            >
                                {answerKeys.map((key) => (
                                    <option key={key.id} value={key.id}>
                                        {key.name} ({key.questions.length} questões)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mode Selection */}
                        <div className="input-group">
                            <label className="input-label">Método de Entrada</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    onClick={() => setUseManualEntry(false)}
                                    className={`btn ${!useManualEntry ? 'btn-primary' : 'btn-secondary'}`}
                                    disabled={isProcessing}
                                >
                                    <Camera size={18} />
                                    OMR (Imagem)
                                </button>
                                <button
                                    onClick={() => setUseManualEntry(true)}
                                    className={`btn ${useManualEntry ? 'btn-primary' : 'btn-secondary'}`}
                                    disabled={isProcessing}
                                >
                                    <Edit3 size={18} />
                                    Manual
                                </button>
                            </div>
                        </div>

                        {useManualEntry ? (
                            /* Manual Entry Mode */
                            <div className="input-group">
                                <label className="input-label">Digite as Respostas do Aluno</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                }}>
                                    {selectedKey?.questions.map((q) => (
                                        <div key={q.number} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                #{q.number}
                                            </label>
                                            <select
                                                className="input"
                                                value={manualAnswers[q.number] || ''}
                                                onChange={(e) => handleManualAnswerChange(q.number, e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            >
                                                <option value="">-</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                                <option value="E">E</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* OCR Mode */
                            <>
                                <div className="input-group">
                                    <label className="input-label">Imagem da Prova</label>
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        style={{
                                            border: '2px dashed rgba(255, 255, 255, 0.2)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: '2rem',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all var(--transition-base)',
                                            background: imagePreview ? 'transparent' : 'var(--bg-secondary)',
                                        }}
                                        onClick={() => !isProcessing && document.getElementById('imageInput').click()}
                                    >
                                        {imagePreview ? (
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '400px',
                                                        borderRadius: 'var(--radius-md)',
                                                        objectFit: 'contain',
                                                    }}
                                                />
                                                {!isProcessing && (
                                                    <div style={{
                                                        marginTop: '1rem',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        Clique para alterar a imagem
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                    Clique ou arraste uma imagem aqui
                                                </p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    Formatos suportados: JPG, PNG, WEBP
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        id="imageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={isProcessing}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {isProcessing && (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '1.5rem',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            marginBottom: '1rem',
                                        }}>
                                            <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                    {statusMessage}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                    {progress}%
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-full)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${progress}%`,
                                                height: '100%',
                                                background: 'var(--gradient-primary)',
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {error && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--error)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--error)',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}>
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={useManualEntry ? false : (!imageFile || isProcessing)}
                            className="btn btn-success"
                            style={{ width: '100%', fontSize: '1.125rem' }}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Corrigir Prova
                                </>
                            )}
                        </button>

                        {!useManualEntry && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid var(--primary)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                                    💡 Dica: OMR não funcionando bem?
                                </h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Use o modo <strong>Manual</strong> para digitar as respostas diretamente. É mais rápido e preciso!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Correction;
