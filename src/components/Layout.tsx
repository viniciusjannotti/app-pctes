import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, LogOut, Menu, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AtendimentoModal from './Modals/AtendimentoModal';
import InteracaoModal from './Modals/InteracaoModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { logout, userProfile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const [showAtendimentoModal, setShowAtendimentoModal] = useState(false);
  const [showInteracaoModal, setShowInteracaoModal] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Pacientes', icon: Users, path: '/pacientes' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = userProfile?.nome || user?.displayName || user?.email || 'Usuário';
  const initials = displayName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* ─── Top Navbar ─── */}
      <nav style={{
        background: 'rgba(13,13,26,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 8 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8 }}>
            <div style={{
              width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={16} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
              <span className="gradient-text">PCTES</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', gap: 4, flex: 1 }} className="hidden-mobile">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div style={{ flex: 1 }} className="show-mobile" />

          {/* Register button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowRegisterMenu(v => !v)}
              style={{ gap: 4 }}
              id="btn-registrar"
            >
              <Plus size={16} />
              <span className="hidden-mobile">Registrar</span>
            </button>
            {showRegisterMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 30 }}
                  onClick={() => setShowRegisterMenu(false)}
                />
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12, padding: 8, minWidth: 180, zIndex: 40,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => { setShowRegisterMenu(false); setShowAtendimentoModal(true); }}
                    id="btn-novo-atendimento"
                  >
                    Atendimento
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => { setShowRegisterMenu(false); setShowInteracaoModal(true); }}
                    id="btn-nova-interacao"
                  >
                    Interação
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Avatar & logout desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden-mobile">
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'white',
            }}>
              {initials}
            </div>
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Sair" id="btn-logout">
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="btn btn-ghost btn-icon show-mobile"
            onClick={() => setMenuOpen(v => !v)}
            id="btn-menu-mobile"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {menuOpen && (
          <div className="show-mobile" style={{
            borderTop: '1px solid var(--color-border)',
            padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: '0.9rem', fontWeight: 500,
                  color: location.pathname === item.path ? 'var(--color-primary)' : 'var(--color-text)',
                  background: location.pathname === item.path ? 'rgba(99,102,241,0.1)' : 'transparent',
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
            <div className="divider" />
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', color: 'var(--color-danger)' }}
              onClick={handleLogout}
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        )}
      </nav>

      {/* ─── Main Content ─── */}
      <main style={{ flex: 1, padding: '24px 0 80px' }}>
        <div className="page-container">
          {children}
        </div>
      </main>

      {/* ─── Bottom mobile nav ─── */}
      <div className="show-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(13,13,26,0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        zIndex: 40,
      }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 0', textDecoration: 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: '0.65rem', fontWeight: 500,
                transition: 'color 0.15s',
              }}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* ─── Modals ─── */}
      {showAtendimentoModal && (
        <AtendimentoModal onClose={() => setShowAtendimentoModal(false)} />
      )}
      {showInteracaoModal && (
        <InteracaoModal onClose={() => setShowInteracaoModal(false)} />
      )}

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
