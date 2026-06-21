import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Paciente, PacienteStatus } from '../../types';

interface Props {
  onClose: () => void;
  editingPaciente?: Paciente;
}

export default function PacienteModal({ onClose, editingPaciente }: Props) {
  const { addPaciente, updatePaciente } = useData();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [valorAtual, setValorAtual] = useState('');
  const [ultimoReajuste, setUltimoReajuste] = useState('');
  const [necessitaNotaFiscal, setNecessitaNotaFiscal] = useState(false);
  const [status, setStatus] = useState<PacienteStatus>('ativo');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPaciente) {
      setNome(editingPaciente.nomeExibicao);
      setTelefone(editingPaciente.telefone || '');
      setDataNascimento(editingPaciente.dataNascimento || '');
      setValorAtual(editingPaciente.valorAtual?.toString() || '');
      setUltimoReajuste(
        editingPaciente.ultimoReajuste
          ? new Date(editingPaciente.ultimoReajuste).toISOString().split('T')[0]
          : ''
      );
      setNecessitaNotaFiscal(editingPaciente.necessitaNotaFiscal || false);
      setStatus(editingPaciente.status);
    }
  }, [editingPaciente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    try {
      const data = {
        nomeExibicao: nome.trim(),
        telefone: telefone.trim(),
        dataNascimento,
        valorAtual: parseFloat(valorAtual) || 0,
        ultimoReajuste: ultimoReajuste ? new Date(ultimoReajuste).toISOString() : null,
        necessitaNotaFiscal,
        status,
      };
      if (editingPaciente) {
        await updatePaciente(editingPaciente.id, data);
      } else {
        await addPaciente(data);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: { value: PacienteStatus; label: string }[] = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'alta', label: 'Alta' },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {editingPaciente ? 'Editar Paciente' : 'Novo Paciente'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-paciente"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Nome de Exibição *</label>
            <input className="input" placeholder="Como o paciente é chamado..." value={nome} onChange={e => setNome(e.target.value)} autoFocus id="input-nome-paciente" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Telefone</label>
              <input className="input" placeholder="(11) 99999-8888" value={telefone} onChange={e => setTelefone(e.target.value)} id="input-telefone-paciente" />
            </div>
            <div>
              <label className="label">Data de Nascimento</label>
              <input className="input" type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} id="input-nascimento-paciente" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Valor Atual (R$)</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={valorAtual} onChange={e => setValorAtual(e.target.value)} id="input-valor-paciente" />
            </div>
            <div>
              <label className="label">Último Reajuste</label>
              <input className="input" type="date" value={ultimoReajuste} onChange={e => setUltimoReajuste(e.target.value)} id="input-reajuste-paciente" />
            </div>
          </div>

          {editingPaciente && (
            <div>
              <label className="label">Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid',
                      fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                      borderColor: status === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
                      background: status === opt.value ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-2)',
                      color: status === opt.value ? 'var(--color-primary)' : 'var(--color-text-dim)',
                    }}
                    id={`btn-status-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="checkbox-custom"
              checked={necessitaNotaFiscal}
              onChange={e => setNecessitaNotaFiscal(e.target.checked)}
              id="check-nota-fiscal"
            />
            <span style={{ fontSize: '0.9rem' }}>Necessita Nota Fiscal</span>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!nome.trim() || saving}
            id="btn-salvar-paciente"
          >
            {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : editingPaciente ? 'Salvar Alterações' : 'Cadastrar Paciente'}
          </button>
        </form>
      </div>
    </div>
  );
}
