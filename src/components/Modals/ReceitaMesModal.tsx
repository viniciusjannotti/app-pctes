import React, { useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart, Cell,
} from 'recharts';
import { useData } from '../../context/DataContext';

interface Props {
  onClose: () => void;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--color-text)' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ fontSize: '0.85rem', color: p.color }}>
            {p.name}: {formatBRL(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReceitaMesModal({ onClose }: Props) {
  const { atendimentos } = useData();

  const hoje = new Date();

  const dadosMeses = useMemo(() => {
    const resultado = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59);
      const doMes = atendimentos.filter(a => {
        const d = new Date(a.dataAtendimento);
        return d >= data && d <= fimMes;
      });
      const recebido = doMes.reduce((s, a) => s + (a.valorRecebido || 0), 0);
      const pendente = doMes.reduce((s, a) => s + (a.valorPendente || 0), 0);
      const consultas = doMes
        .filter(a => a.tipo === 'consulta')
        .reduce((s, a) => s + (a.valorRecebido || 0), 0);
      const retornos = doMes
        .filter(a => a.tipo === 'retornoBreve')
        .reduce((s, a) => s + (a.valorRecebido || 0), 0);
      resultado.push({
        mes: MESES[data.getMonth()],
        recebido,
        pendente,
        total: recebido + pendente,
        consultas,
        retornos,
        isCurrent: i === 0,
      });
    }
    return resultado;
  }, [atendimentos]);

  const [mesSelecionadoIdx, setMesSelecionadoIdx] = useState(dadosMeses.length - 1);
  const mesSelecionado = dadosMeses[mesSelecionadoIdx] || dadosMeses[dadosMeses.length - 1];

  const mesAtual = dadosMeses[dadosMeses.length - 1];
  const mesAnterior = dadosMeses[dadosMeses.length - 2];
  const variacao = mesAnterior.recebido > 0
    ? ((mesAtual.recebido - mesAnterior.recebido) / mesAnterior.recebido) * 100
    : 0;

  const totalSemestre = dadosMeses.reduce((s, d) => s + d.recebido, 0);
  const mediaMensal = totalSemestre / 6;

  const TrendIcon = variacao > 0 ? TrendingUp : variacao < 0 ? TrendingDown : Minus;
  const trendColor = variacao > 0 ? '#34d399' : variacao < 0 ? '#f87171' : '#94a3b8';

  // Por tipo no mês selecionado (padrão: mês atual)
  const porTipo = { consultas: mesSelecionado.consultas, retornos: mesSelecionado.retornos };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📊 Receita do Mês</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Comparativo dos últimos 6 meses
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-receita-modal">
            <X size={20} />
          </button>
        </div>

        {/* KPIs rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div style={{
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mês Atual</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>{formatBRL(mesAtual.recebido)}</p>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Média Mensal</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#818cf8' }}>{formatBRL(mediaMensal)}</p>
          </div>
          <div style={{
            background: `rgba(${variacao >= 0 ? '52,211,153' : '248,113,113'},0.08)`,
            border: `1px solid rgba(${variacao >= 0 ? '52,211,153' : '248,113,113'},0.2)`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Vs. Mês Anterior</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendIcon size={16} color={trendColor} />
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: trendColor }}>
                {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 500 }}>
            EVOLUÇÃO MENSAL — ÚLTIMOS 6 MESES <span style={{ opacity: 0.7, fontWeight: 400 }}>(clique numa coluna para ver o breakdown)</span>
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={dadosMeses} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="recebido"
                name="Recebido"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(_, index) => setMesSelecionadoIdx(index)}
              >
                {dadosMeses.map((_, index) => (
                  <Cell
                    key={`recebido-${index}`}
                    fill="#34d399"
                    opacity={index === mesSelecionadoIdx ? 1 : 0.55}
                    stroke={index === mesSelecionadoIdx ? '#34d399' : 'none'}
                    strokeWidth={index === mesSelecionadoIdx ? 2 : 0}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="pendente"
                name="Pendente"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(_, index) => setMesSelecionadoIdx(index)}
              >
                {dadosMeses.map((_, index) => (
                  <Cell
                    key={`pendente-${index}`}
                    fill="#fbbf24"
                    opacity={index === mesSelecionadoIdx ? 0.8 : 0.4}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="recebido"
                name="Tendência"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown por tipo no mês selecionado */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12, fontWeight: 500 }}>
            BREAKDOWN DO MÊS — POR TIPO
            <span style={{ color: mesSelecionadoIdx === dadosMeses.length - 1 ? 'var(--color-text-muted)' : '#818cf8', fontWeight: 700 }}>
              {' '}({mesSelecionado.mes}{mesSelecionadoIdx !== dadosMeses.length - 1 ? ' — selecionado' : ' — atual'})
            </span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Consultas', value: porTipo.consultas, color: '#34d399' },
              { label: 'Retornos', value: porTipo.retornos, color: '#818cf8' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--color-surface-2)',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>{item.label}</span>
                </div>
                <span style={{ fontWeight: 700, color: item.color, fontSize: '0.95rem' }}>
                  {formatBRL(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
