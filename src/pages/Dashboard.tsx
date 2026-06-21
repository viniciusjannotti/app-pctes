import React, { useMemo, useState } from 'react';
import {
  CheckCircle2, Circle, AlertCircle, TrendingUp, Users, DollarSign,
  MessageSquare, Plus, ChevronRight, Bell, X, Zap,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Tarefa, TarefaPrioridade } from '../types';
import TarefaModal from '../components/Modals/TarefaModal';

const prioridadeOrder: Record<TarefaPrioridade, number> = {
  critica: 4, alta: 3, media: 2, baixa: 1,
};

const prioridadeBadgeClass: Record<TarefaPrioridade, string> = {
  critica: 'badge-critica', alta: 'badge-alta', media: 'badge-media', baixa: 'badge-baixa',
};

const prioridadeLabel: Record<TarefaPrioridade, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa',
};

const tipoLabel: Record<string, string> = {
  seguimento: 'Seguimento',
  retornoPrevisto: 'Retorno',
  aniversario: 'Aniversário',
  cobranca: 'Cobrança',
  reajuste: 'Reajuste',
  crise: 'Crise',
  personalizada: 'Tarefa',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function TaskRow({ tarefa, pacienteNome, onConcluir }: {
  tarefa: Tarefa;
  pacienteNome: string;
  onConcluir: (id: string) => void;
}) {
  const [concluindo, setConcluindo] = useState(false);

  const handleConcluir = async () => {
    setConcluindo(true);
    await onConcluir(tarefa.id);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid var(--color-border)',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <button
        onClick={handleConcluir}
        disabled={concluindo}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: concluindo ? 'var(--color-success)' : 'var(--color-text-muted)', flexShrink: 0 }}
        id={`btn-concluir-${tarefa.id}`}
      >
        {concluindo
          ? <CheckCircle2 size={20} color="var(--color-success)" />
          : <Circle size={20} />
        }
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {pacienteNome && (
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              {pacienteNome}
            </span>
          )}
          <span className={`badge ${prioridadeBadgeClass[tarefa.prioridade]}`}>
            {prioridadeLabel[tarefa.prioridade]}
          </span>
          {tarefa.tipo === 'crise' && (
            <span style={{ fontSize: '0.75rem' }}>🚨</span>
          )}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
          {tipoLabel[tarefa.tipo] || tarefa.titulo} — {tarefa.titulo}
        </p>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          {formatDate(tarefa.dataPrevista)}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { pacientes, atendimentos, tarefas, interacoes, concluirTarefa, updatePaciente, inatividadeSugerida } = useData();
  const [showTarefaModal, setShowTarefaModal] = useState(false);
  const [dismissedInatividade, setDismissedInatividade] = useState<string[]>([]);

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);

  const tarefasHoje = useMemo(() =>
    tarefas
      .filter(t => !t.concluida && new Date(t.dataPrevista) <= hoje && new Date(t.dataPrevista) >= inicioDia)
      .sort((a, b) => prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade]),
    [tarefas]
  );

  const tarefasAtrasadas = useMemo(() =>
    tarefas
      .filter(t => !t.concluida && new Date(t.dataPrevista) < inicioDia)
      .sort((a, b) => new Date(a.dataPrevista).getTime() - new Date(b.dataPrevista).getTime()),
    [tarefas]
  );

  // Indicadores do mês
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const receitaMes = useMemo(() =>
    atendimentos
      .filter(a => new Date(a.dataAtendimento) >= inicioMes)
      .reduce((sum, a) => sum + (a.valorRecebido || 0), 0),
    [atendimentos]
  );

  const pacientesAtivos = pacientes.filter(p => p.status === 'ativo').length;

  const cobrancasPendentes = useMemo(() =>
    atendimentos.reduce((sum, a) => sum + (a.valorPendente || 0), 0),
    [atendimentos]
  );

  const demandasAbertas = useMemo(() =>
    tarefas.filter(t => !t.concluida && ['seguimento', 'retornoPrevisto', 'crise'].includes(t.tipo)).length,
    [tarefas]
  );

  const getPacienteNome = (id: string) =>
    pacientes.find(p => p.id === id)?.nomeExibicao || '';

  const displayName = user?.displayName?.split(' ')[0] || 'Profissional';

  const sugestoesInatividade = inatividadeSugerida.filter(p => !dismissedInatividade.includes(p.id));

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 2 }}>
          Olá, <span className="gradient-text">{displayName}</span> 👋
        </h1>
      </div>

      {/* Sugestões de inatividade */}
      {sugestoesInatividade.length > 0 && (
        <div style={{
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Bell size={16} color="var(--color-warning)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)' }}>
              Sugestão de Inatividade
            </span>
          </div>
          {sugestoesInatividade.slice(0, 3).map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                <strong>{p.nomeExibicao}</strong> sem consultas há mais de 6 meses.
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => updatePaciente(p.id, { status: 'inativo' })}
                  id={`btn-inativar-${p.id}`}
                >
                  Marcar Inativo
                </button>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setDismissedInatividade(d => [...d, p.id])}
                  id={`btn-dismiss-inatividade-${p.id}`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          {
            label: 'Receita do Mês',
            value: `R$ ${receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign, color: '#34d399', bg: 'rgba(52,211,153,0.08)',
          },
          {
            label: 'Pacientes Ativos',
            value: pacientesAtivos.toString(),
            icon: Users, color: '#818cf8', bg: 'rgba(99,102,241,0.08)',
          },
          {
            label: 'Cobranças Pendentes',
            value: `R$ ${cobrancasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: AlertCircle, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',
          },
          {
            label: 'Demandas Abertas',
            value: demandasAbertas.toString(),
            icon: MessageSquare, color: '#f87171', bg: 'rgba(248,113,113,0.08)',
          },
        ].map((card, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={16} color={card.color} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </span>
            </div>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Minha Atenção Hoje */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Minha Atenção Hoje
            </h2>
            {tarefasHoje.length > 0 && (
              <span style={{
                background: 'var(--color-primary)', color: 'white',
                borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600,
              }}>
                {tarefasHoje.length}
              </span>
            )}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowTarefaModal(true)}
            id="btn-nova-tarefa-dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={14} /> Nova
          </button>
        </div>

        {tarefasHoje.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 24px' }}>
            <CheckCircle2 size={40} />
            <p style={{ fontWeight: 600 }}>Tudo em dia! 🎉</p>
            <p style={{ fontSize: '0.85rem' }}>Nenhuma tarefa para hoje.</p>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {tarefasHoje.map(t => (
              <TaskRow
                key={t.id}
                tarefa={t}
                pacienteNome={getPacienteNome(t.pacienteId)}
                onConcluir={concluirTarefa}
              />
            ))}
          </div>
        )}
      </div>

      {/* Atrasadas */}
      {tarefasAtrasadas.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(248,113,113,0.2)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '16px 16px 8px',
          }}>
            <AlertCircle size={18} color="var(--color-danger)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              Atrasadas
            </h2>
            <span style={{
              background: 'rgba(248,113,113,0.2)', color: 'var(--color-danger)',
              borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600,
            }}>
              {tarefasAtrasadas.length}
            </span>
          </div>
          {tarefasAtrasadas.slice(0, 5).map(t => (
            <TaskRow
              key={t.id}
              tarefa={t}
              pacienteNome={getPacienteNome(t.pacienteId)}
              onConcluir={concluirTarefa}
            />
          ))}
          {tarefasAtrasadas.length > 5 && (
            <div style={{ padding: '10px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                +{tarefasAtrasadas.length - 5} mais atrasadas
              </span>
            </div>
          )}
        </div>
      )}

      {/* Link para pacientes */}
      <Link to="/pacientes" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        textDecoration: 'none',
        color: 'var(--color-text)',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={18} color="var(--color-primary)" />
          <span style={{ fontWeight: 500 }}>Ver Carteira de Pacientes</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({pacientes.length} cadastrados)</span>
        </div>
        <ChevronRight size={18} color="var(--color-text-muted)" />
      </Link>

      {showTarefaModal && <TarefaModal onClose={() => setShowTarefaModal(false)} />}
    </div>
  );
}
