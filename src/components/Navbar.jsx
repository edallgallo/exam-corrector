import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, FileText, CheckCircle, Home } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Início', icon: Home },
        { path: '/answer-key', label: 'Gabaritos', icon: FileText },
        { path: '/correction', label: 'Corrigir', icon: CheckCircle },
    ];

    return (
        <nav style={{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
            }}>
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                }}>
                    <GraduationCap size={32} style={{ color: 'var(--primary)' }} />
                    <span style={{
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Corretor de Provas
                    </span>
                </Link>

                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="btn"
                                style={{
                                    background: isActive ? 'var(--gradient-primary)' : 'transparent',
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '0.625rem 1.25rem',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <Icon size={18} />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <style>{`
        @media (max-width: 640px) {
          .nav-label {
            display: none;
          }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
