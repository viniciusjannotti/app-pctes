import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Atendimento, AtendimentoTipo } from '../../types';

interface Props {
  onClose: () => void;
  preSelectedPacienteId?: string;
  editingAtendimento?: Atendimento;
}

export default function AtendimentoModal({ onClose, preSelectedPacienteId, editingAtendimento }: Props) {
  const { pacientes, addAtendimento, updateAtendimento } = useData();
  const [pacienteId, setPacienteId] = useState(editingAtendimento?.pacienteId || preSelectedPacienteId || '');
  const [dataAtendimento, setDataAtendimento] = useState(
    editingAtendimento?.dataAtendimento 
      ? new Date(editingAtendimento.dataAtendimento).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [tipo, setTipo] = useState<AtendimentoTipo>(editingAtendimento?.tipo || 'consulta');
  const [valorPrevisto, setValorPrevisto] = useState(editingAtendimento?.valorPrevisto?.toString() || '');
  const [valorRecebido, setValorRecebido] = useState(editingAtendimento?.valorRecebido?.toString() || '');
  const [proximaConsulta, setProximaConsulta] = useState(
    editingAtendimento?.proximaConsultaPrevista
      ? new Date(editingAtendimento.proximaConsultaPrevista).toISOString().split('T')[0]
      : ''
  );
  const [seguimento, setSeguimento] = useState(editingAtendimento ? false : true); // don't re-create if editing
  const [crise, setCrise] = useState(editingAtendimento?.marcarCrise || false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(!preSelectedPacienteId && !editingAtendimento);

  const pacientesAtivos = pacientes.filter(p =>
    p.status === 'ativo' &&
    p.nomeExibicao.toLowerCase().includes(search.toLowerCase())
  );

  const pacienteSelecionado = pacientes.find(p => p.id === pacienteId);

  const valorPendente =
    (parseFloat(valorPrevisto) || 0) - (parseFloat(valorRecebido) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;
    setSaving(true);
    try {
      const payload = {
        pacienteId,
        dataAtendimento: new Date(dataAtendimento + 'T12:00:00').toISOString(),
        tipo,
        valorPrevisto: parseFloat(valorPrevisto) || 0,
        valorRecebido: parseFloat(valorRecebido) || 0,
        valorPendente: valorPendente < 0 ? 0 : valorPendente,
        proximaConsultaPrevista: proximaConsulta ? new Date(proximaConsulta + 'T12:00:00').toISOString() : null,
        criarSeguimento15Dias: seguimento,
        marcarCrise: crise,
      };
      if (editingAtendimento) {
        await updateAtendimento(editingAtendimento.id, payload);
      } else {
        await addAtendimento(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {editingAtendimento ? 'Editar Atendimento' : 'Registrar Atendimento'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {editingAtendimento ? 'Edite as informações do atendimento' : 'Preencha em menos de 30 segundos'}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-atendimento">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Paciente */}
          {!pacienteSelecionado || showSearch ? (
            <div>
              <label className="label">Paciente *</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 34 }}
                  placeholder="Buscar paciente..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  id="input-buscar-paciente-atendimento"
                />
              </div>
              {search && (
                <div style={{
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: 'auto',
                }}>
                  {pacientesAtivos.slice(0, 8).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setPacienteId(p.id); setSearch(p.nomeExibicao); setShowSearch(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text)', fontSize: '0.9rem',
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {p.nomeExibicao}
                    </button>
                  ))}
                  {pacientesAtivos.length === 0 && (
                    <p style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      Nenhum paciente encontrado
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label className="label">Paciente</label>
                <p style={{ fontWeight: 600 }}>{pacienteSelecionado.nomeExibicao}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowSearch(true); setPacienteId(''); setSearch(''); }}>
                Trocar
              </button>
            </div>
          )}

          {/* Tipo e Data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Data</label>
              <input
                className="input"
                type="date"
                value={dataAtendimento}
                onChange={e => setDataAtendimento(e.target.value)}
                id="input-data-atendimento"
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['consulta', 'retornoBreve'] as AtendimentoTipo[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid',
                      fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                      borderColor: tipo === t ? 'var(--color-primary)' : 'var(--color-border)',
                      background: tipo === t ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-2)',
                      color: tipo === t ? 'var(--color-primary)' : 'var(--color-text-dim)',
                    }}
                    id={`btn-tipo-${t}`}
                  >
                    {t === 'consulta' ? 'Consulta' : 'Retorno Breve'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Valores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Valor Previsto (R$)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder={pacienteSelecionado?.valorAtual?.toString() || '0,00'}
                value={valorPrevisto}
                onChange={e => { setValorPrevisto(e.target.value); if (!valorRecebido) setValorRecebido(e.target.value); }}
                id="input-valor-previsto"
              />
            </div>
            <div>
              <label className="label">Valor Recebido (R$)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={valorRecebido}
                onChange={e => setValorRecebido(e.target.value)}
                id="input-valor-recebido"
              />
            </div>
          </div>
          {valorPendente > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>
              ⚠ Pendente: R$ {valorPendente.toFixed(2)}
            </p>
          )}

          {/* Próxima consulta */}
          <div>
            <label className="label">Próxima Consulta Prevista</label>
            <input
              className="input"
              type="date"
              value={proximaConsulta}
              onChange={e => setProximaConsulta(e.target.value)}
              id="input-proxima-consulta"
            />
          </div>

          <div className="divider" />

          {/* Opções */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="checkbox-custom"
                checked={seguimento}
                onChange={e => setSeguimento(e.target.checked)}
                id="check-seguimento"
              />
              <span style={{ fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 500 }}>Criar seguimento</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> — lembrete em 15 dias</span>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="checkbox-custom"
                checked={crise}
                onChange={e => setCrise(e.target.checked)}
                id="check-crise"
                style={{ accentColor: 'var(--color-danger)' }}
              />
              <span style={{ fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 500, color: crise ? 'var(--color-danger)' : 'inherit' }}>
                  🚨 Marcar paciente em crise
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> — lembretes a cada 48h</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!pacienteId || saving}
            style={{ marginTop: 4 }}
            id="btn-salvar-atendimento"
          >
            {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : editingAtendimento ? 'Salvar Alterações' : 'Salvar Atendimento'}
          </button>
        </form>
      </div>
    </div>
  );
}
