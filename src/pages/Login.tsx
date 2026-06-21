import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!nome.trim()) { setError('Por favor, informe seu nome.'); setLoading(false); return; }
        await register(email, password, nome);
      }
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Email ou senha incorretos.');
      } else if (msg.includes('email-already-in-use')) {
        setError('Este e-mail já está em uso.');
      } else if (msg.includes('weak-password')) {
        setError('Senha fraca. Use pelo menos 6 caracteres.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--color-bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%', right: '-10%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
          }}>
            <Zap size={28} color="white" fill="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>
            <span className="gradient-text">APP PCTES</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Sistema de Acompanhamento de Pacientes
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Tab toggle */}
          <div style={{
            display: 'flex', background: 'var(--color-surface-2)', borderRadius: 10,
            padding: 4, marginBottom: 28,
          }}>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s',
                background: isLogin ? 'var(--color-surface)' : 'transparent',
                color: isLogin ? 'var(--color-text)' : 'var(--color-text-muted)',
                boxShadow: isLogin ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
              id="btn-tab-login"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s',
                background: !isLogin ? 'var(--color-surface)' : 'transparent',
                color: !isLogin ? 'var(--color-text)' : 'var(--color-text-muted)',
                boxShadow: !isLogin ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
              id="btn-tab-cadastro"
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLogin && (
              <div>
                <label className="label">Nome completo</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Dr. Seu Nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  id="input-nome-login"
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                id="input-email-login"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                id="input-senha-login"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: '0.85rem', color: 'var(--color-danger)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 4 }}
              id="btn-submit-login"
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Aguardando...</>
                : isLogin ? 'Entrar' : 'Criar Conta'
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Seus dados são privados e acessíveis apenas por você.
        </p>
      </div>
    </div>
  );
}
