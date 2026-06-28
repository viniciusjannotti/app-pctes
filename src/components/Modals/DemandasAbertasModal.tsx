import React, { useMemo } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

const TIPO_COLORS: Record<string, string> = {
  seguimento: '#6366f1',
  retornoPrevisto: '#34d399',
  crise: '#f87171',
};

const TIPO_LABELS: Record<string, string> = {
  seguimento: 'Seguimento',
  retornoPrevisto: 'Retorno',
  crise: 'Crise',
};

const PRIORIDADE_COLORS: Record<string, string> = {
  critica: '#f87171',
  alta: '#fbbf24',
  media: '#818cf8',
  baixa: '#34d399',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <p style={{ fontWeight: 700, color: payload[0].payload.fill }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function DemandasAbertasModal({ onClose }: Props) {
  const { tarefas, pacientes } = useData();

  const demandasAbertas = useMemo(() =>
    tarefas.filter(t => !t.concluida && ['seguimento', 'retornoPrevisto', 'crise'].includes(t.tipo)),
    [tarefas]
  );

  const getPacienteNome = (id: string) =>
    pacientes.find(p => p.id === id)?.nomeExibicao || 'Sem paciente';

  // Dados para o gráfico de rosca
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    demandasAbertas.forEach(t => {
      counts[t.tipo] = (counts[t.tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: TIPO_LABELS[key] || key,
      value,
      fill: TIPO_COLORS[key] || '#94a3b8',
    }));
  }, [demandasAbertas]);

  // Ordenar: crise primeiro, depois alta, depois por data
  const demandasOrdenadas = useMemo(() =>
    [...demandasAbertas].sort((a, b) => {
      const prioOrder: Record<string, number> = { critica: 4, alta: 3, media: 2, baixa: 1 };
      return prioOrder[b.prioridade] - prioOrder[a.prioridade];
    }),
    [demandasAbertas]
  );

  const crises = demandasAbertas.filter(t => t.tipo === 'crise').length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🎯 Demandas Abertas</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Seguimentos, retornos e crises em aberto
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-demandas-modal">
            <X size={20} />
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{demandasAbertas.length}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total abertas</p>
          </div>
          <div style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{crises}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>🚨 Crises</p>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>
              {demandasAbertas.filter(t => t.tipo === 'retornoPrevisto').length}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Retornos</p>
          </div>
        </div>

        {/* Gráfico + Lista */}
        {demandasAbertas.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <p style={{ fontWeight: 600 }}>Tudo em dia! 🎉</p>
            <p style={{ fontSize: '0.85rem' }}>Nenhuma demanda aberta no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20 }}>
            {/* Gráfico de rosca */}
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                POR TIPO
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legenda manual */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pieData.map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: item.fill, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de demandas */}
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                DEMANDAS ABERTAS
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                {demandasOrdenadas.map(t => (
                  <Link
                    key={t.id}
                    to={t.pacienteId ? `/pacientes/${t.pacienteId}` : '/'}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                      transition: 'all 0.15s',
                      gap: 8,
                    }}
                    id={`link-demanda-${t.id}`}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: 2,
                          background: TIPO_COLORS[t.tipo] || '#94a3b8',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {getPacienteNome(t.pacienteId)}
                        </span>
                        {t.tipo === 'crise' && <span style={{ fontSize: '0.7rem' }}>🚨</span>}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: 1, paddingLeft: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {TIPO_LABELS[t.tipo]} — {t.titulo}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px',
                        borderRadius: 5,
                        background: `rgba(${t.prioridade === 'critica' ? '248,113,113' : t.prioridade === 'alta' ? '251,191,36' : '99,102,241'},0.15)`,
                        color: PRIORIDADE_COLORS[t.prioridade],
                      }}>
                        {t.prioridade}
                      </span>
                      <ExternalLink size={12} color="var(--color-text-muted)" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
