import React, { useMemo } from 'react';
import { X, UserCheck, UserX, UserPlus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

const COLORS = {
  ativo: '#34d399',
  inativo: '#64748b',
  alta: '#a78bfa',
};

const STATUS_LABELS = {
  ativo: 'Ativos',
  inativo: 'Inativos',
  alta: 'Alta',
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

export default function PacientesAtivosModal({ onClose }: Props) {
  const { pacientes, atendimentos } = useData();

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const h30DiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Status breakdown para pizza
  const pieData = useMemo(() => {
    const counts = { ativo: 0, inativo: 0, alta: 0 };
    pacientes.forEach(p => { counts[p.status]++; });
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
      value,
      fill: COLORS[key as keyof typeof COLORS],
    }));
  }, [pacientes]);

  // Novos pacientes do mês (cadastrados no mês atual)
  const novosMes = useMemo(() =>
    pacientes.filter(p => new Date(p.createdAt) >= inicioMes),
    [pacientes]
  );

  // Pacientes que se tornaram inativos nos últimos 30 dias
  // (status inativo + nenhum atendimento nos últimos 30 dias + tinham atendimento antes)
  const inativosRecentes = useMemo(() => {
    return pacientes.filter(p => {
      if (p.status !== 'inativo') return false;
      const atendsPac = atendimentos.filter(a => a.pacienteId === p.id);
      if (atendsPac.length === 0) return false;
      const ultimoAtend = new Date(atendsPac[0].dataAtendimento);
      // Consideramos "recentemente inativo" se o último atendimento foi nos últimos 90 dias
      const noventa = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
      return ultimoAtend >= noventa;
    });
  }, [pacientes, atendimentos]);

  const ativos = pacientes.filter(p => p.status === 'ativo').length;
  const totalMesPassado = pacientes.filter(p => {
    const created = new Date(p.createdAt);
    return created < inicioMes;
  }).length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>👥 Pacientes Ativos</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Visão geral da sua carteira
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-pacientes-modal">
            <X size={20} />
          </button>
        </div>

        {/* KPIs rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div style={{
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <UserCheck size={20} color="#34d399" style={{ margin: '0 auto 6px' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{ativos}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ativos</p>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <UserPlus size={20} color="#818cf8" style={{ margin: '0 auto 6px' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>{novosMes.length}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Novos este mês</p>
          </div>
          <div style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <UserX size={20} color="#f87171" style={{ margin: '0 auto 6px' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{inativosRecentes.length}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Inativos recentes</p>
          </div>
        </div>

        {/* Pizza + Listas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Gráfico de pizza */}
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 500 }}>
              DISTRIBUIÇÃO POR STATUS
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Listas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Novos do mês */}
            <div>
              <p style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ✨ Novos este mês
              </p>
              {novosMes.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Nenhum novo cadastro.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {novosMes.slice(0, 5).map(p => (
                    <Link
                      key={p.id}
                      to={`/pacientes/${p.id}`}
                      onClick={onClose}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px',
                        background: 'var(--color-surface-2)',
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: 'var(--color-text)',
                        fontSize: '0.82rem',
                        transition: 'background 0.15s',
                      }}
                      id={`link-novo-pac-${p.id}`}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', flexShrink: 0 }} />
                      {p.nomeExibicao}
                    </Link>
                  ))}
                  {novosMes.length > 5 && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', paddingLeft: 4 }}>
                      +{novosMes.length - 5} mais
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Inativos recentes */}
            <div>
              <p style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ⚠️ Inativos recentes
              </p>
              {inativosRecentes.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Nenhum recente.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {inativosRecentes.slice(0, 5).map(p => (
                    <Link
                      key={p.id}
                      to={`/pacientes/${p.id}`}
                      onClick={onClose}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px',
                        background: 'var(--color-surface-2)',
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: 'var(--color-text)',
                        fontSize: '0.82rem',
                        transition: 'background 0.15s',
                      }}
                      id={`link-inativo-pac-${p.id}`}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                      {p.nomeExibicao}
                    </Link>
                  ))}
                  {inativosRecentes.length > 5 && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', paddingLeft: 4 }}>
                      +{inativosRecentes.length - 5} mais
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
