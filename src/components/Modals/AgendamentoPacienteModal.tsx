import React, { useState, useMemo } from 'react';
import { X, Trash2, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calcularProximosDiasComHorarios, horaParaMinutos, minutosParaHora } from '../../utils/agendamento';

interface Props {
  onClose: () => void;
  pacienteId: string;
}

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDiaLabel(data: Date): string {
  return `${DIAS_SEMANA_ABREV[data.getDay()]}, ${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
}

export default function AgendamentoPacienteModal({ onClose, pacienteId }: Props) {
  const { pacientes, disponibilidades, agendamentos, addAgendamento, deleteAgendamento } = useData();
  const [rangeDias, setRangeDias] = useState<30 | 60 | 90>(30);
  const [bookingKey, setBookingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const paciente = pacientes.find(p => p.id === pacienteId);

  const agendamentosDoPaciente = useMemo(() =>
    agendamentos
      .filter(a => a.pacienteId === pacienteId)
      .sort((a, b) =>
        new Date(a.data).getTime() - new Date(b.data).getTime() ||
        horaParaMinutos(a.horaInicio) - horaParaMinutos(b.horaInicio)
      ),
    [agendamentos, pacienteId]
  );

  const dias = useMemo(() => {
    if (!paciente?.duracaoConsulta) return [];
    return calcularProximosDiasComHorarios(disponibilidades, agendamentos, paciente.duracaoConsulta, rangeDias);
  }, [disponibilidades, agendamentos, paciente?.duracaoConsulta, rangeDias]);

  if (!paciente) return null;

  const handleBook = async (dateKey: string, data: Date, horaInicio: string) => {
    if (!paciente.duracaoConsulta) return;
    const key = `${dateKey}__${horaInicio}`;
    setError('');
    setBookingKey(key);
    try {
      const horaFim = minutosParaHora(horaParaMinutos(horaInicio) + paciente.duracaoConsulta);
      await addAgendamento({ pacienteId, data: data.toISOString(), horaInicio, horaFim });
      setSuccessMsg(`Agendamento confirmado para ${data.toLocaleDateString('pt-BR')} às ${horaInicio}.`);
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.error(err);
      setError('Não foi possível confirmar o agendamento.');
    } finally {
      setBookingKey(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Cancelar este agendamento?')) return;
    try {
      await deleteAgendamento(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Agendar — {paciente.nomeExibicao}</h2>
            {paciente.duracaoConsulta && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Consultas de {paciente.duracaoConsulta} min
              </p>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-agendamento-modal">
            <X size={20} />
          </button>
        </div>

        {!paciente.duracaoConsulta ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
            Defina a duração da consulta deste paciente (30/60/90 min, no topo do perfil) antes de agendar.
          </p>
        ) : (
          <>
            {/* Agendamentos existentes */}
            {agendamentosDoPaciente.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p className="label" style={{ marginBottom: 8 }}>Agendamentos deste paciente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {agendamentosDoPaciente.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                    }}>
                      <span style={{ fontSize: '0.85rem' }}>
                        {new Date(a.data).toLocaleDateString('pt-BR')} — {a.horaInicio}–{a.horaFim}
                      </span>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleDelete(a.id)}
                        style={{ padding: 4 }}
                        id={`btn-cancelar-agendamento-${a.id}`}
                      >
                        <Trash2 size={14} color="var(--color-danger)" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seletor de intervalo */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {([30, 60, 90] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRangeDias(r)}
                  id={`btn-range-${r}`}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 20,
                    border: `1px solid ${rangeDias === r ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: rangeDias === r ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: rangeDias === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {r} dias
                </button>
              ))}
            </div>

            {successMsg && (
              <div style={{
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                fontSize: '0.85rem', color: 'var(--color-success)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}
            {error && (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-danger)', marginBottom: 12 }}>{error}</p>
            )}

            {/* Lista de dias com horários */}
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dias.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p style={{ fontWeight: 600 }}>Nenhum horário livre</p>
                  <p style={{ fontSize: '0.85rem' }}>
                    Configure dias de atendimento em Agenda → "Datas de Agendamento".
                  </p>
                </div>
              ) : (
                dias.map(dia => (
                  <div key={dia.dateKey}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: 6 }}>
                      {formatDiaLabel(dia.data)}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {dia.horarios.map(h => {
                        const key = `${dia.dateKey}__${h}`;
                        const isBooking = bookingKey === key;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => handleBook(dia.dateKey, dia.data, h)}
                            disabled={bookingKey !== null}
                            id={`btn-slot-${key}`}
                            className="btn btn-secondary btn-sm"
                            style={{ minWidth: 56 }}
                          >
                            {isBooking ? <div className="spinner" style={{ width: 14, height: 14 }} /> : h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
