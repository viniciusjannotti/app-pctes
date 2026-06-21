import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, DollarSign, FileText, Edit2, Zap,
  Calendar, Activity, MessageCircle, Copy, Check, AlertTriangle,
  CheckCircle2, Circle, Trash2, Plus,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Paciente, Atendimento, Interacao, Tarefa, PacienteStatus } from '../types';
import PacienteModal from '../components/Modals/PacienteModal';
import AtendimentoModal from '../components/Modals/AtendimentoModal';
import InteracaoModal from '../components/Modals/InteracaoModal';
import TarefaModal from '../components/Modals/TarefaModal';
import { criarTarefaCrise } from '../services/automations';
import { useAuth } from '../context/AuthContext';

// ─── Mensagens prontas ───────────────────────────────────────────────
const mensagens = {
  seguimento: (nome: string) =>
    `Olá, ${nome}! Passando para ver como você está se sentindo após nossa última conversa. Qualquer coisa, estou por aqui. 😊`,
  retorno: (nome: string) =>
    `Olá, ${nome}! Tudo bem? Gostaríamos de verificar como você está e saber se deseja agendar um retorno. Estamos à disposição!`,
  cobranca: (nome: string) =>
    `Olá, ${nome}! Espero que esteja bem. Passando para informar que há um valor em aberto referente ao atendimento realizado. Por favor, entre em contato para regularizarmos. Obrigado!`,
  aniversario: [
    (nome: string) => `Feliz aniversário, ${nome}! 🎂 Que este novo ciclo seja repleto de saúde, alegria e conquistas. Um abraço especial!`,
    (nome: string) => `${nome}, hoje é o seu dia! 🎉 Desejo a você um aniversário maravilhoso e um ano cheio de realizações. Abraços!`,
    (nome: string) => `Parabéns, ${nome}! 🎈 Que você tenha um dia especial e um ano incrível pela frente. Conte sempre comigo!`,
    (nome: string) => `Muitas felicidades, ${nome}! 🌟 Que cada dia deste novo ciclo seja tão especial quanto você merece. Feliz aniversário!`,
    (nome: string) => `Hoje é o seu dia, ${nome}! 🎊 Desejo muita saúde, paz e momentos felizes. Um abraço cheio de carinho!`,
  ],
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="btn btn-secondary btn-sm"
      style={{ gap: 4 }}
    >
      {copied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
    </button>
  );
}

function MensagemCard({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div style={{
      background: 'var(--color-surface-2)', borderRadius: 10,
      padding: '12px 14px', border: '1px solid var(--color-border)',
    }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {titulo}
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.6, marginBottom: 10 }}>{texto}</p>
      <CopyButton text={texto} />
    </div>
  );
}

const statusBadgeCls: Record<PacienteStatus, string> = {
  ativo: 'badge-ativo', inativo: 'badge-inativo', alta: 'badge-alta-pac',
};
const statusLabel: Record<PacienteStatus, string> = {
  ativo: 'Ativo', inativo: 'Inativo', alta: 'Alta',
};

const tipoAtendLabel: Record<string, string> = { consulta: 'Consulta', retornoBreve: 'Retorno Breve' };
const tipoInteracaoLabel: Record<string, string> = {
  duvidaTratamento: 'Dúvida Tratamento', novaDemanda: 'Nova Demanda',
  administrativo: 'Administrativo', outro: 'Outro',
};
const tipoTarefaLabel: Record<string, string> = {
  seguimento: 'Seguimento', retornoPrevisto: 'Retorno', aniversario: 'Aniversário',
  cobranca: 'Cobrança', reajuste: 'Reajuste', crise: 'Crise', personalizada: 'Tarefa',
};

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pacientes, atendimentos, interacoes, tarefas, updatePaciente, concluirTarefa, deleteTarefa, deletePaciente, deleteAtendimento, deleteInteracao } = useData();
  const [tab, setTab] = useState<'timeline' | 'mensagens'>('timeline');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAtendimentoModal, setShowAtendimentoModal] = useState(false);
  const [editingAtendimento, setEditingAtendimento] = useState<Atendimento | undefined>();
  const [showInteracaoModal, setShowInteracaoModal] = useState(false);
  const [editingInteracao, setEditingInteracao] = useState<Interacao | undefined>();
  const [showTarefaModal, setShowTarefaModal] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | undefined>();

  const paciente = pacientes.find(p => p.id === id);
  const pacAtendimentos = atendimentos.filter(a => a.pacienteId === id);
  const pacInteracoes = interacoes.filter(i => i.pacienteId === id);
  const pacTarefas = tarefas.filter(t => t.pacienteId === id);
  const pacTarefasPendentes = pacTarefas.filter(t => !t.concluida);

  // Stats
  const stats = useMemo(() => {
    if (!paciente) return null;
    const sorted = [...pacAtendimentos].sort((a, b) => new Date(a.dataAtendimento).getTime() - new Date(b.dataAtendimento).getTime());
    const ultimoAtend = sorted.at(-1);
    const intervals = sorted.slice(1).map((a, i) => {
      const prev = sorted[i];
      return (new Date(a.dataAtendimento).getTime() - new Date(prev.dataAtendimento).getTime()) / (1000 * 60 * 60 * 24);
    });
    const mediaIntervalo = intervals.length > 0 ? Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length) : null;
    const totalReceita = pacAtendimentos.reduce((s, a) => s + (a.valorRecebido || 0), 0);
    return { sorted, ultimoAtend, mediaIntervalo, totalReceita };
  }, [pacAtendimentos, paciente]);

  // Timeline unificada
  const timeline = useMemo(() => {
    type TL = { date: Date; type: string; data: Atendimento | Interacao | Tarefa };
    const items: TL[] = [
      ...pacAtendimentos.map(a => ({ date: new Date(a.dataAtendimento), type: 'atendimento', data: a })),
      ...pacInteracoes.map(i => ({ date: new Date(i.data), type: 'interacao', data: i })),
      ...pacTarefas.filter(t => t.concluida).map(t => ({ date: new Date(t.concluidaEm || t.dataPrevista), type: 'tarefa', data: t })),
    ];
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [pacAtendimentos, pacInteracoes, pacTarefas]);

  if (!paciente) {
    return (
      <div className="empty-state">
        <p>Paciente não encontrado.</p>
        <button className="btn btn-primary" onClick={() => navigate('/pacientes')}>Voltar</button>
      </div>
    );
  }

  const initials = paciente.nomeExibicao.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  const handleToggleCrise = async () => {
    const novaCrise = !paciente.crise;
    await updatePaciente(paciente.id, { crise: novaCrise });
    if (novaCrise && user) {
      await criarTarefaCrise(user.uid, paciente.id, paciente.nomeExibicao);
    }
  };

  const handleDeletePaciente = async () => {
    if (window.confirm('Tem certeza que deseja excluir este paciente e todos os seus dados? Esta ação não pode ser desfeita.')) {
      await deletePaciente(paciente.id);
      navigate('/pacientes');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/pacientes"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} /> Pacientes
        </Link>
      </div>

      {/* Header do paciente */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          {/* Avatar grande */}
          <div style={{
            width: 60, height: 60, borderRadius: 14, flexShrink: 0,
            background: paciente.crise
              ? 'linear-gradient(135deg, rgba(248,113,113,0.3), rgba(248,113,113,0.1))'
              : 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.1))',
            border: paciente.crise ? '2px solid rgba(248,113,113,0.5)' : '2px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 700,
            color: paciente.crise ? 'var(--color-danger)' : 'var(--color-primary)',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{paciente.nomeExibicao}</h1>
              <span className={`badge ${statusBadgeCls[paciente.status]}`}>{statusLabel[paciente.status]}</span>
              {paciente.crise && <span className="badge badge-crise">🚨 Crise</span>}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {paciente.telefone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={12} /> {paciente.telefone}
                </span>
              )}
              {paciente.dataNascimento && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} />
                  {new Date(paciente.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
              {paciente.valorAtual > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={12} /> R$ {paciente.valorAtual.toFixed(2)}
                </span>
              )}
              {paciente.necessitaNotaFiscal && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={12} /> Nota Fiscal
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${paciente.crise ? 'btn-danger' : 'btn-secondary'}`}
              onClick={handleToggleCrise}
              id="btn-toggle-crise"
              style={{ fontSize: '0.8rem' }}
            >
              {paciente.crise ? '🚨 Desativar Crise' : '⚡ Marcar Crise'}
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setShowEditModal(true)}
              id="btn-editar-paciente"
            >
              <Edit2 size={15} />
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={handleDeletePaciente}
              id="btn-excluir-paciente"
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="divider" style={{ margin: '16px 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
          {[
            { label: 'Consultas', value: pacAtendimentos.length.toString() },
            { label: 'Interações', value: pacInteracoes.length.toString() },
            { label: 'Intervalo Médio', value: stats?.mediaIntervalo ? `${stats.mediaIntervalo}d` : '—' },
            { label: 'Último Reajuste', value: paciente.ultimoReajuste ? new Date(paciente.ultimoReajuste).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' }) : '—' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{s.value}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tarefas pendentes do paciente */}
      {pacTarefasPendentes.length > 0 && (
        <div className="card" style={{ padding: '14px 16px', marginBottom: 20, borderColor: 'rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Zap size={16} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tarefas Pendentes ({pacTarefasPendentes.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pacTarefasPendentes.slice(0, 5).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => concluirTarefa(t.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0 }}
                >
                  <Circle size={16} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.titulo}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(t.dataPrevista).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => deleteTarefa(t.id)}
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--color-text-muted)', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Atendimento', icon: Activity, action: () => { setEditingAtendimento(undefined); setShowAtendimentoModal(true); }, id: 'btn-quick-atendimento' },
          { label: 'Interação', icon: MessageCircle, action: () => { setEditingInteracao(undefined); setShowInteracaoModal(true); }, id: 'btn-quick-interacao' },
          { label: 'Tarefa', icon: Plus, action: () => { setEditingTarefa(undefined); setShowTarefaModal(true); }, id: 'btn-quick-tarefa' },
        ].map(a => (
          <button key={a.id} id={a.id} className="btn btn-secondary btn-sm" onClick={a.action} style={{ gap: 5 }}>
            <a.icon size={14} /> {a.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-nav" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${tab === 'timeline' ? 'active' : ''}`} onClick={() => setTab('timeline')} id="tab-timeline">
          Linha do Tempo
        </button>
        <button className={`tab-btn ${tab === 'mensagens' ? 'active' : ''}`} onClick={() => setTab('mensagens')} id="tab-mensagens">
          Mensagens Prontas
        </button>
      </div>

      {/* Tab: Timeline */}
      {tab === 'timeline' && (
        <div>
          {timeline.length === 0 ? (
            <div className="empty-state">
              <Activity size={40} />
              <p style={{ fontWeight: 600 }}>Nenhum registro ainda</p>
              <p style={{ fontSize: '0.85rem' }}>Registre o primeiro atendimento ou interação.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {/* Linha vertical */}
              <div style={{
                position: 'absolute', left: 4, top: 8, bottom: 8,
                width: 2, background: 'var(--color-border)', borderRadius: 2,
              }} />

              {timeline.map((item, idx) => {
                const dotColor =
                  item.type === 'atendimento' ? '#6366f1'
                  : item.type === 'interacao' ? '#34d399'
                  : '#94a3b8';

                return (
                  <div key={idx} style={{ display: 'flex', gap: 12, paddingBottom: 20, position: 'relative' }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', left: -20,
                      width: 10, height: 10, borderRadius: '50%',
                      background: dotColor, top: 6,
                      border: '2px solid var(--color-bg)',
                      zIndex: 1,
                    }} />

                    <div style={{
                      flex: 1,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12, padding: '12px 14px',
                    }}>
                      {item.type === 'atendimento' && (() => {
                        const a = item.data as Atendimento;
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8' }}>
                                Consulta — {tipoAtendLabel[a.tipo]}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  {item.date.toLocaleDateString('pt-BR')}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={() => { setEditingAtendimento(a); setShowAtendimentoModal(true); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                    title="Editar atendimento"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Excluir este atendimento?')) deleteAtendimento(a.id);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                    title="Excluir atendimento"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>
                              <span>💰 R$ {a.valorRecebido.toFixed(2)} recebidos</span>
                              {a.valorPendente > 0 && <span style={{ color: 'var(--color-warning)' }}>⚠ R$ {a.valorPendente.toFixed(2)} pendente</span>}
                              {a.proximaConsultaPrevista && (
                                <span>📅 Próximo: {new Date(a.proximaConsultaPrevista).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </>
                        );
                      })()}

                      {item.type === 'interacao' && (() => {
                        const i = item.data as Interacao;
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                                Interação — {tipoInteracaoLabel[i.tipo]}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  {item.date.toLocaleDateString('pt-BR')}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={() => { setEditingInteracao(i); setShowInteracaoModal(true); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                    title="Editar interação"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Excluir esta interação?')) deleteInteracao(i.id);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                    title="Excluir interação"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{i.observacao}</p>
                          </>
                        );
                      })()}

                      {item.type === 'tarefa' && (() => {
                        const t = item.data as Tarefa;
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={12} color="#34d399" /> {tipoTarefaLabel[t.tipo]} — Concluída
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  {item.date.toLocaleDateString('pt-BR')}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={() => { setEditingTarefa(t); setShowTarefaModal(true); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                    title="Editar tarefa"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Excluir esta tarefa?')) deleteTarefa(t.id);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                    title="Excluir tarefa"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t.titulo}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Mensagens Prontas */}
      {tab === 'mensagens' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MensagemCard titulo="Seguimento" texto={mensagens.seguimento(paciente.nomeExibicao)} />
          <MensagemCard titulo="Retorno" texto={mensagens.retorno(paciente.nomeExibicao)} />
          <MensagemCard titulo="Cobrança" texto={mensagens.cobranca(paciente.nomeExibicao)} />
          <div className="divider" />
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mensagens de Aniversário
          </p>
          {mensagens.aniversario.map((fn, i) => (
            <MensagemCard key={i} titulo={`Aniversário ${i + 1}`} texto={fn(paciente.nomeExibicao)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showEditModal && <PacienteModal onClose={() => setShowEditModal(false)} editingPaciente={paciente} />}
      {showAtendimentoModal && <AtendimentoModal onClose={() => { setShowAtendimentoModal(false); setEditingAtendimento(undefined); }} preSelectedPacienteId={id} editingAtendimento={editingAtendimento} />}
      {showInteracaoModal && <InteracaoModal onClose={() => { setShowInteracaoModal(false); setEditingInteracao(undefined); }} preSelectedPacienteId={id} editingInteracao={editingInteracao} />}
      {showTarefaModal && <TarefaModal onClose={() => { setShowTarefaModal(false); setEditingTarefa(undefined); }} preSelectedPacienteId={id} editingTarefa={editingTarefa} />}
    </div>
  );
}
