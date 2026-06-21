import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Tarefa, TarefaTipo, TarefaPrioridade } from '../../types';

interface Props {
  onClose: () => void;
  preSelectedPacienteId?: string;
  editingTarefa?: Tarefa;
}

const tipoLabels: Record<TarefaTipo, string> = {
  seguimento: 'Seguimento',
  retornoPrevisto: 'Retorno Previsto',
  aniversario: 'Aniversário',
  cobranca: 'Cobrança',
  reajuste: 'Reajuste',
  crise: 'Crise',
  personalizada: 'Personalizada',
};

const prioridadeLabels: Record<TarefaPrioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export default function TarefaModal({ onClose, preSelectedPacienteId, editingTarefa }: Props) {
  const { pacientes, addTarefa, updateTarefa } = useData();
  const [pacienteId, setPacienteId] = useState(editingTarefa?.pacienteId || preSelectedPacienteId || '');
  const [titulo, setTitulo] = useState(editingTarefa?.titulo || '');
  const [descricao, setDescricao] = useState(editingTarefa?.descricao || '');
  const [tipo, setTipo] = useState<TarefaTipo>(editingTarefa?.tipo || 'personalizada');
  const [prioridade, setPrioridade] = useState<TarefaPrioridade>(editingTarefa?.prioridade || 'media');
  const [dataPrevista, setDataPrevista] = useState(
    editingTarefa?.dataPrevista
      ? new Date(editingTarefa.dataPrevista).toISOString().split('T')[0]
      : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !dataPrevista) return;
    setSaving(true);
    try {
      const payload = {
        pacienteId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tipo,
        prioridade,
        dataPrevista: new Date(dataPrevista + 'T12:00:00').toISOString(),
      };
      if (editingTarefa) {
        await updateTarefa(editingTarefa.id, payload);
      } else {
        await addTarefa({
          ...payload,
          concluida: false,
          concluidaEm: null,
          recorrente: false,
        });
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-fechar-tarefa"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Paciente (opcional) */}
          <div>
            <label className="label">Paciente (opcional)</label>
            <select
              className="input"
              value={pacienteId}
              onChange={e => setPacienteId(e.target.value)}
              id="select-paciente-tarefa"
              style={{ background: 'var(--color-surface-2)' }}
            >
              <option value="">— Sem paciente específico —</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nomeExibicao}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="label">Título *</label>
            <input
              className="input"
              placeholder="Descreva a tarefa..."
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              autoFocus
              id="input-titulo-tarefa"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Detalhes opcionais..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              style={{ resize: 'vertical' }}
              id="textarea-descricao-tarefa"
            />
          </div>

          {/* Tipo e Prioridade */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={tipo} onChange={e => setTipo(e.target.value as TarefaTipo)} id="select-tipo-tarefa" style={{ background: 'var(--color-surface-2)' }}>
                {(Object.entries(tipoLabels) as [TarefaTipo, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select className="input" value={prioridade} onChange={e => setPrioridade(e.target.value as TarefaPrioridade)} id="select-prioridade-tarefa" style={{ background: 'var(--color-surface-2)' }}>
                {(Object.entries(prioridadeLabels) as [TarefaPrioridade, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="label">Data Prevista *</label>
            <input className="input" type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} id="input-data-tarefa" />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!titulo.trim() || !dataPrevista || saving}
            id="btn-salvar-tarefa"
          >
            {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : editingTarefa ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        </form>
      </div>
    </div>
  );
}
