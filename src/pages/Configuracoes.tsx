import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  GoogleCalendarStatus,
  getConnectionStatus,
  startGoogleCalendarConnect,
  disconnectGoogleCalendar,
} from '../services/googleCalendar';

export default function Configuracoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState<'connected' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const s = await getConnectionStatus();
      setStatus(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    const google = searchParams.get('google');
    if (google === 'connected' || google === 'error') {
      setFeedback(google);
      setSearchParams({}, { replace: true });
    }
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setErrorMsg('');
    setConnecting(true);
    try {
      await startGoogleCalendarConnect();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao conectar');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setErrorMsg('');
    setDisconnecting(true);
    try {
      await disconnectGoogleCalendar();
      setFeedback(null);
      await loadStatus();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Configurações</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
          Integrações e preferências da sua conta
        </p>
      </div>

      {feedback === 'connected' && (
        <div style={{
          background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          fontSize: '0.85rem', color: 'var(--color-success)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={16} /> Google Agenda conectado com sucesso.
        </div>
      )}
      {feedback === 'error' && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          fontSize: '0.85rem', color: 'var(--color-danger)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={16} /> Não foi possível conectar ao Google Agenda. Tente novamente.
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarCheck2 size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Google Agenda</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Conecte sua conta Google para futuramente marcar consultas considerando sua agenda.
            </p>
          </div>
        </div>

        {loadingStatus ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <div className="spinner" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Verificando conexão...</span>
          </div>
        ) : status?.connected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
              Conectado como <strong style={{ color: 'var(--color-text)' }}>{status.googleEmail}</strong>
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              id="btn-desconectar-google"
            >
              {disconnecting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Desconectando...</> : 'Desconectar'}
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleConnect}
            disabled={connecting}
            id="btn-conectar-google"
          >
            {connecting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Redirecionando...</> : 'Conectar Google Agenda'}
          </button>
        )}

        {errorMsg && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: 10 }}>{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
