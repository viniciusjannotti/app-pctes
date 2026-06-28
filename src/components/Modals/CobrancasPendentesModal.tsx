import React, { useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function CobrancasPendentesModal({ onClose }: Props) {
  const { pacientes, atendimentos } = useData();

  // Agrupar pendências por paciente
  const pendenciasPorPaciente = useMemo(() => {
    const map = new Map<string, { nome: string; pacienteId: string; total: number; atendimentos: Array<{ id: string; data: string; valor: number; tipo: string }> }>();

    atendimentos.forEach(a => {
      if (!a.valorPendente || a.valorPendente <= 0) return;
      const pac = pacientes.find(p => p.id === a.pacienteId);
      const nome = pac?.nomeExibicao || 'Paciente desconhecido';

      if (!map.has(a.pacienteId)) {
        map.set(a.pacienteId, { nome, pacienteId: a.pacienteId, total: 0, atendimentos: [] });
      }
      const entry = map.get(a.pacienteId)!;
      entry.total += a.valorPendente;
      entry.atendimentos.push({
        id: a.id,
        data: a.dataAtendimento,
        valor: a.valorPendente,
        tipo: a.tipo === 'consulta' ? 'Consulta' : 'Retorno',
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total);
  }, [pacientes, atendimentos]);

  const totalGeral = pendenciasPorPaciente.reduce((s, p) => s + p.total, 0);
  const totalPacientes = pendenciasPorPaciente.length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>💰 Cobranças Pendentes</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Valores em aberto por paciente
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-cobrancas-modal">
            <X size={20} />
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <div style={{
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 12, padding: '16px',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Pendente</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{formatBRL(totalGeral)}</p>
          </div>
          <div style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 12, padding: '16px',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pacientes com Débito</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{totalPacientes}</p>
          </div>
        </div>

        {/* Lista */}
        {pendenciasPorPaciente.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <AlertCircle size={36} />
            <p style={{ fontWeight: 600 }}>Sem pendências! 🎉</p>
            <p style={{ fontSize: '0.85rem' }}>Todos os atendimentos estão pagos.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              DETALHES POR PACIENTE
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
              {pendenciasPorPaciente.map((item, idx) => (
                <div key={item.pacienteId} style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {/* Cabeçalho do paciente */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderBottom: item.atendimentos.length > 1 ? '1px solid var(--color-border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: `rgba(251,191,36,${0.3 - idx * 0.03})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24',
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
                      <Link
                        to={`/pacientes/${item.pacienteId}`}
                        onClick={onClose}
                        style={{ fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.9rem' }}
                        id={`link-cob-pac-${item.pacienteId}`}
                      >
                        {item.nome}
                      </Link>
                    </div>
                    <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>
                      {formatBRL(item.total)}
                    </span>
                  </div>

                  {/* Atendimentos individuais */}
                  {item.atendimentos.map(at => (
                    <div key={at.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 14px 8px 46px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>{at.tipo}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 8 }}>
                          {formatDate(at.data)}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600 }}>
                        {formatBRL(at.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
