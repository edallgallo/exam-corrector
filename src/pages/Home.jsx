import { Link } from 'react-router-dom';
import { FileText, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';

const Home = () => {
    const features = [
        {
            icon: FileText,
            title: 'Cadastro de Gabaritos',
            description: 'Crie gabaritos personalizados com pesos para cada questão',
            color: 'var(--primary)',
        },
        {
            icon: CheckCircle,
            title: 'Correção Automática',
            description: 'Upload de imagens com processamento OCR inteligente',
            color: 'var(--accent)',
        },
        {
            icon: TrendingUp,
            title: 'Análise de Resultados',
            description: 'Visualize notas e estatísticas detalhadas',
            color: 'var(--secondary)',
        },
    ];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                padding: '4rem 0',
                textAlign: 'center',
            }}>
                <div className="container animate-fadeIn">
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-full)',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--primary)',
                    }}>
                        <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                            Sistema Inteligente de Correção
                        </span>
                    </div>

                    <h1 style={{ marginBottom: '1rem', fontSize: '3.5rem' }}>
                        Corretor de Provas
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        maxWidth: '600px',
                        margin: '0 auto 2rem',
                    }}>
                        Corrija provas automaticamente usando inteligência artificial e processamento de imagens
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/answer-key" className="btn btn-primary" style={{ fontSize: '1.125rem' }}>
                            <FileText size={20} />
                            Criar Gabarito
                        </Link>
                        <Link to="/correction" className="btn btn-secondary" style={{ fontSize: '1.125rem' }}>
                            <CheckCircle size={20} />
                            Corrigir Prova
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '4rem 0', flex: 1 }}>
                <div className="container">
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        Recursos Principais
                    </h2>

                    <div className="grid grid-3">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="card animate-fadeIn"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        background: `${feature.color}20`,
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1.5rem',
                                        border: `2px solid ${feature.color}`,
                                    }}>
                                        <Icon size={32} style={{ color: feature.color }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                                        {feature.title}
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                background: 'var(--gradient-primary)',
                padding: '3rem 0',
                textAlign: 'center',
            }}>
                <div className="container">
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>
                        Pronto para começar?
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem', fontSize: '1.125rem' }}>
                        Crie seu primeiro gabarito e comece a corrigir provas em minutos
                    </p>
                    <Link to="/answer-key" className="btn" style={{
                        background: 'white',
                        color: 'var(--primary)',
                        fontSize: '1.125rem',
                    }}>
                        Começar Agora
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
