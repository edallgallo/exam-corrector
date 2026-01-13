import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Award, ArrowLeft, FileText, Download } from 'lucide-react';
import { getGradeStatus } from '../utils/gradeCalculator';
import { saveResult } from '../utils/storage';
import { useEffect } from 'react';

const Results = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { gradeResult, answerKey, imagePath } = location.state || {};

    useEffect(() => {
        if (!gradeResult || !answerKey) {
            navigate('/correction');
            return;
        }

        // Save result to history
        const result = {
            id: Date.now().toString(),
            answerKeyName: answerKey.name,
            gradeResult,
            timestamp: new Date().toISOString(),
        };
        saveResult(result);
    }, [gradeResult, answerKey, navigate]);

    if (!gradeResult || !answerKey) {
        return null;
    }

    const status = getGradeStatus(parseFloat(gradeResult.percentage), answerKey.minPassingScore || 60);

    return (
        <div style={{ padding: '2rem 0', minHeight: 'calc(100vh - 200px)' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <button
                    onClick={() => navigate('/correction')}
                    className="btn btn-secondary"
                    style={{ marginBottom: '1.5rem' }}
                >
                    <ArrowLeft size={18} />
                    Voltar
                </button>

                {/* Grade Summary Card */}
                <div className="card animate-fadeIn" style={{
                    background: 'var(--gradient-primary)',
                    textAlign: 'center',
                    marginBottom: '2rem',
                }}>
                    <Award size={64} style={{ color: 'white', margin: '0 auto 1rem' }} />
                    <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>
                        Nota Final
                    </h2>
                    <div style={{
                        fontSize: '4rem',
                        fontWeight: '800',
                        color: 'white',
                        marginBottom: '1rem',
                        lineHeight: 1,
                    }}>
                        {gradeResult.totalScore}
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.125rem', marginBottom: '1rem' }}>
                        de {gradeResult.maxScore} pontos
                    </p>
                    <div className={`badge badge-${status.color}`} style={{
                        fontSize: '1rem',
                        padding: '0.5rem 1.5rem',
                        background: 'white',
                    }}>
                        {status.label} - {gradeResult.percentage}%
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <CheckCircle size={32} style={{ color: 'var(--success)', margin: '0 auto 0.75rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                            {gradeResult.correctCount}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                            Acertos
                        </p>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <XCircle size={32} style={{ color: 'var(--error)', margin: '0 auto 0.75rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--error)' }}>
                            {gradeResult.totalQuestions - gradeResult.correctCount}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                            Erros
                        </p>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <FileText size={32} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                            {gradeResult.totalQuestions}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                            Total
                        </p>
                    </div>
                </div>

                {/* Answer Key Info */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                        Gabarito Utilizado
                    </h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        {answerKey.name}
                    </p>
                </div>

                {/* Detailed Results */}
                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                        Detalhamento por Questão
                    </h3>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {gradeResult.results.map((result) => (
                            <div
                                key={result.questionNumber}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '60px 1fr 1fr 1fr auto',
                                    gap: '1rem',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: result.isCorrect
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(239, 68, 68, 0.1)',
                                    border: `1px solid ${result.isCorrect ? 'var(--success)' : 'var(--error)'}`,
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <div style={{
                                    fontWeight: '700',
                                    fontSize: '1.125rem',
                                    color: 'var(--text-primary)',
                                    textAlign: 'center',
                                }}>
                                    #{result.questionNumber}
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Gabarito
                                    </div>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '1.125rem',
                                        color: 'var(--text-primary)',
                                    }}>
                                        {result.correctAnswer}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Resposta
                                    </div>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '1.125rem',
                                        color: result.isCorrect ? 'var(--success)' : 'var(--error)',
                                    }}>
                                        {result.studentAnswer}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Pontos
                                    </div>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '1.125rem',
                                        color: 'var(--text-primary)',
                                    }}>
                                        {result.score.toFixed(2)} / {result.weight.toFixed(2)}
                                    </div>
                                </div>

                                <div>
                                    {result.isCorrect ? (
                                        <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                                    ) : (
                                        <XCircle size={24} style={{ color: 'var(--error)' }} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}>
                    <Link to="/correction" className="btn btn-primary">
                        <FileText size={18} />
                        Corrigir Outra Prova
                    </Link>
                    <Link to="/answer-key" className="btn btn-secondary">
                        <ArrowLeft size={18} />
                        Ver Gabaritos
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Results;
