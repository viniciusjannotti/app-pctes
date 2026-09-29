import React, { useState } from 'react';
import CalendarioConsultas from '../components/CalendarioConsultas';
import { useData } from '../context/DataContext';

function parseDataKey(key: string): Date {
  const [ano, mes, dia] = key.split('-').map(Number);
  return new Date(ano, mes, dia, 12, 0, 0);
}

export default function Agenda() {
  const { addDisponibilidade } = useData();
  const [modoSelecao, setModoSelecao] = useState(false);
  const [datasSelecionadas, setDatasSelecionadas] = useState<Set<string>>(new Set());
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('12:00');
  const [salvando, setSalvando] = useState(false);

  const horarioValido = horaFim > horaInicio;

  const handleToggleModo = () => {
    setModoSelecao(v => !v);
    setDatasSelecionadas(new Set());
  };

  const handleToggleData = (dateKey: string) => {
    setDatasSelecionadas(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const handleConcluir = () => {
    setModoSelecao(false);
    setDatasSelecionadas(new Set());
  };

  const handleSalvar = async () => {
    if (datasSelecionadas.size === 0 || !horarioValido) return;
    setSalvando(true);
    try {
      await Promise.all(
        Array.from(datasSelecionadas).map(key =>
          addDisponibilidade({
            data: parseDataKey(key).toISOString(),
            horaInicio,
            horaFim,
          })
        )
      );
      setDatasSelecionadas(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Agenda</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
          Visão completa das suas consultas
        </p>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', width: 'fit-content' }}>
          <input
            type="checkbox"
            className="checkbox-custom"
            checked={modoSelecao}
            onChange={handleToggleModo}
            id="check-datas-agendamento"
          />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Datas de Agendamento</span>
        </label>
      </div>

      {modoSelecao && (
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
            Clique nas datas do calendário abaixo em que você irá atender. Depois defina o horário e salve.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-media">
              {datasSelecionadas.size} {datasSelecionadas.size === 1 ? 'data selecionada' : 'datas selecionadas'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Horário de Início</label>
              <input
                className="input"
                type="time"
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                id="input-hora-inicio-disponibilidade"
              />
            </div>
            <div>
              <label className="label">Horário de Fim</label>
              <input
                className="input"
                type="time"
                value={horaFim}
                onChange={e => setHoraFim(e.target.value)}
                id="input-hora-fim-disponibilidade"
              />
            </div>
          </div>
          {!horarioValido && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>
              O horário de fim precisa ser depois do horário de início.
            </p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleSalvar}
              disabled={datasSelecionadas.size === 0 || !horarioValido || salvando}
              id="btn-salvar-disponibilidade"
            >
              {salvando ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : 'Salvar Disponibilidade'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleConcluir}
              id="btn-concluir-disponibilidade"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      <CalendarioConsultas
        modoSelecaoDisponibilidade={modoSelecao}
        datasSelecionadas={datasSelecionadas}
        onToggleDataSelecionada={handleToggleData}
      />
    </div>
  );
}
