import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { InteracaoTipo } from '../../types';

interface Props {
  onClose: () => void;
  preSelectedPacienteId?: string;
}

const tipoLabels: Record<InteracaoTipo, string> = {
  duvidaTratamento: 'Dúvida Tratamento',
  novaDemanda: 'Nova Demanda',
  administrativo: 'Administrativo',
  outro: 'Outro',
};

export default function InteracaoModal({ onClose, preSelectedPacienteId }: Props) {
  const { pacientes, addInteracao } = useData();
  const [pacienteId, setPacienteId] = useState(preSelectedPacienteId || '');
  const [tipo, setTipo] = useState<InteracaoTipo>('duvidaTratamento');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(!preSelectedPacienteId);

  const pacientesFiltrados = pacientes.filter(p =>
    p.nomeExibicao.toLowerCase().includes(search.toLowerCase())
  );
  const pacienteSelecionado = pacientes.find(p => p.id === pacienteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId || !observacao.trim()) return;
    setSaving(true);
    try {
      await addInteracao({
        pacienteId,
        data: new Date().toISOString(),
        tipo,
        observacao: observacao.trim(),
      });
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registrar Interação</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Trabalho clínico relevante fora da consulta
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-interacao">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  id="input-buscar-paciente-interacao"
                />
              </div>
              {search && (
                <div style={{
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  borderRadius: 10, marginTop: 4, maxHeight: 180, overflowY: 'auto',
                }}>
                  {pacientesFiltrados.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setPacienteId(p.id); setSearch(p.nomeExibicao); setShowSearch(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text)', fontSize: '0.9rem',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {p.nomeExibicao}
                    </button>
                  ))}
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

          {/* Tipo */}
          <div>
            <label className="label">Tipo</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(Object.entries(tipoLabels) as [InteracaoTipo, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTipo(key)}
                  style={{
                    padding: '8px 0', borderRadius: 8, border: '1px solid',
                    fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: tipo === key ? 'var(--color-primary)' : 'var(--color-border)',
                    background: tipo === key ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-2)',
                    color: tipo === key ? 'var(--color-primary)' : 'var(--color-text-dim)',
                  }}
                  id={`btn-tipo-interacao-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="label">Observação *</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Descreva brevemente a interação..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              style={{ resize: 'vertical', minHeight: 80 }}
              id="textarea-observacao"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!pacienteId || !observacao.trim() || saving}
            id="btn-salvar-interacao"
          >
            {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : 'Salvar Interação'}
          </button>
        </form>
      </div>
    </div>
  );
}
