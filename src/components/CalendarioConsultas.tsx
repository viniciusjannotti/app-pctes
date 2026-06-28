import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface EventoDia {
  pacienteId: string;
  pacienteNome: string;
  tipo: 'consulta' | 'retornoBreve' | 'futuro';
  valor: number;
  label: string;
  atendimentoId: string;
}

export default function CalendarioConsultas() {
  const { atendimentos, pacientes } = useData();
  const hoje = new Date();

  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; eventos: EventoDia[] } | null>(null);

  const getPacienteNome = (id: string) =>
    pacientes.find(p => p.id === id)?.nomeExibicao || 'Paciente';

  // Construir mapa de datas → eventos
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, EventoDia[]>();

    const addEvento = (dateStr: string, evento: EventoDia) => {
      if (!mapa.has(dateStr)) mapa.set(dateStr, []);
      mapa.get(dateStr)!.push(evento);
    };

    atendimentos.forEach(a => {
      // Atendimento passado / presente
      const dataAtend = new Date(a.dataAtendimento);
      const keyAtend = `${dataAtend.getFullYear()}-${dataAtend.getMonth()}-${dataAtend.getDate()}`;
      addEvento(keyAtend, {
        pacienteId: a.pacienteId,
        pacienteNome: getPacienteNome(a.pacienteId),
        tipo: a.tipo === 'consulta' ? 'consulta' : 'retornoBreve',
        valor: a.valorPrevisto,
        label: a.tipo === 'consulta' ? 'Consulta' : 'Retorno',
        atendimentoId: a.id,
      });

      // Próxima consulta prevista (futuro)
      if (a.proximaConsultaPrevista) {
        const dataFut = new Date(a.proximaConsultaPrevista);
        const keyFut = `${dataFut.getFullYear()}-${dataFut.getMonth()}-${dataFut.getDate()}`;
        addEvento(keyFut, {
          pacienteId: a.pacienteId,
          pacienteNome: getPacienteNome(a.pacienteId),
          tipo: 'futuro',
          valor: a.valorPrevisto,
          label: 'Retorno previsto',
          atendimentoId: a.id,
        });
      }
    });

    return mapa;
  }, [atendimentos, pacientes]);

  // Grid de dias do mês
  const diasDoMes = useMemo(() => {
    const primeiroDia = new Date(anoSelecionado, mesSelecionado, 1);
    const ultimoDia = new Date(anoSelecionado, mesSelecionado + 1, 0);
    const diasAntes = primeiroDia.getDay(); // 0=Dom
    const dias: Array<{ dia: number | null; key: string | null }> = [];

    for (let i = 0; i < diasAntes; i++) {
      dias.push({ dia: null, key: null });
    }
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push({
        dia: d,
        key: `${anoSelecionado}-${mesSelecionado}-${d}`,
      });
    }
    // Preencher até completar semanas
    while (dias.length % 7 !== 0) dias.push({ dia: null, key: null });

    return dias;
  }, [mesSelecionado, anoSelecionado]);

  const navegarMes = (delta: number) => {
    let novoMes = mesSelecionado + delta;
    let novoAno = anoSelecionado;
    if (novoMes < 0) { novoMes = 11; novoAno--; }
    if (novoMes > 11) { novoMes = 0; novoAno++; }
    setMesSelecionado(novoMes);
    setAnoSelecionado(novoAno);
    setDiaSelecionado(null);
  };

  const isHoje = (dia: number) =>
    dia === hoje.getDate() &&
    mesSelecionado === hoje.getMonth() &&
    anoSelecionado === hoje.getFullYear();

  const eventosDiaSelecionado = diaSelecionado
    ? (eventosPorDia.get(`${anoSelecionado}-${mesSelecionado}-${diaSelecionado}`) || [])
    : [];

  const handleDiaClick = (dia: number) => {
    setDiaSelecionado(prev => prev === dia ? null : dia);
    setTooltip(null);
  };

  const handleDiaHover = (e: React.MouseEvent, dia: number, key: string) => {
    const eventos = eventosPorDia.get(key);
    if (!eventos || eventos.length === 0) { setTooltip(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = (e.currentTarget.closest('.calendario-container') as HTMLElement)?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
      eventos,
    });
  };

  return (
    <div className="card calendario-container" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Header do calendário */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 14px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Calendário de Consultas</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => navegarMes(-1)}
            id="btn-mes-anterior-cal"
            style={{ padding: 6 }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: 140, textAlign: 'center' }}>
            {MESES_PT[mesSelecionado]} {anoSelecionado}
          </span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => navegarMes(1)}
            id="btn-mes-proximo-cal"
            style={{ padding: 6 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setMesSelecionado(hoje.getMonth());
            setAnoSelecionado(hoje.getFullYear());
            setDiaSelecionado(hoje.getDate());
          }}
          id="btn-hoje-cal"
        >
          Hoje
        </button>
      </div>

      {/* Grade do calendário */}
      <div style={{ padding: '12px 16px' }}>
        {/* Cabeçalho dos dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              padding: '4px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}
          onMouseLeave={() => setTooltip(null)}
        >
          {diasDoMes.map((item, idx) => {
            if (!item.dia || !item.key) {
              return <div key={`empty-${idx}`} />;
            }
            const eventos = eventosPorDia.get(item.key) || [];
            const temConsulta = eventos.some(e => e.tipo === 'consulta');
            const temRetorno = eventos.some(e => e.tipo === 'retornoBreve');
            const temFuturo = eventos.some(e => e.tipo === 'futuro');
            const isSel = diaSelecionado === item.dia;
            const isToday = isHoje(item.dia);

            return (
              <div
                key={item.key}
                onClick={() => item.dia && handleDiaClick(item.dia)}
                onMouseEnter={e => item.dia && item.key && handleDiaHover(e, item.dia, item.key)}
                id={`dia-cal-${item.key}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '6px 4px',
                  borderRadius: 10,
                  cursor: eventos.length > 0 ? 'pointer' : 'default',
                  background: isSel
                    ? 'rgba(99,102,241,0.2)'
                    : isToday
                      ? 'rgba(99,102,241,0.08)'
                      : 'transparent',
                  border: isToday
                    ? '1px solid rgba(99,102,241,0.4)'
                    : isSel
                      ? '1px solid rgba(99,102,241,0.5)'
                      : '1px solid transparent',
                  transition: 'all 0.15s',
                  minHeight: 52,
                }}
                onMouseOver={e => {
                  if (!isSel && !isToday && eventos.length > 0) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseOut={e => {
                  if (!isSel && !isToday) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: isToday ? 800 : isSel ? 700 : 400,
                  color: isToday ? 'var(--color-primary)' : isSel ? 'var(--color-text)' : 'var(--color-text-dim)',
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}>
                  {item.dia}
                </span>
                {/* Dots de eventos */}
                {(temConsulta || temRetorno || temFuturo) && (
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {temConsulta && <div style={{ width: 6, height: 6, borderRadius: 2, background: '#34d399' }} />}
                    {temRetorno && <div style={{ width: 6, height: 6, borderRadius: 2, background: '#818cf8' }} />}
                    {temFuturo && <div style={{ width: 6, height: 6, borderRadius: 2, background: '#fbbf24' }} />}
                  </div>
                )}
                {/* Número de eventos */}
                {eventos.length > 1 && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {eventos.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          {[
            { color: '#34d399', label: 'Consulta realizada' },
            { color: '#818cf8', label: 'Retorno realizado' },
            { color: '#fbbf24', label: 'Retorno previsto' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip de hover */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateX(-50%) translateY(-100%)',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border-hover)',
          borderRadius: 10,
          padding: '10px 14px',
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: 180,
          maxWidth: 250,
        }}>
          {tooltip.eventos.slice(0, 3).map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: i < tooltip.eventos.length - 1 ? 6 : 0 }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)' }}>{ev.pacienteNome}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{ev.label}</p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', flexShrink: 0 }}>
                {formatBRL(ev.valor)}
              </span>
            </div>
          ))}
          {tooltip.eventos.length > 3 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              +{tooltip.eventos.length - 3} mais
            </p>
          )}
        </div>
      )}

      {/* Painel de detalhes do dia selecionado */}
      {diaSelecionado && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              {diaSelecionado} de {MESES_PT[mesSelecionado]}
            </h3>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setDiaSelecionado(null)}
              id="btn-fechar-dia-cal"
              style={{ padding: 4 }}
            >
              <X size={14} />
            </button>
          </div>

          {eventosDiaSelecionado.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Nenhum atendimento registrado neste dia.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eventosDiaSelecionado.map((ev, i) => (
                <Link
                  key={i}
                  to={`/pacientes/${ev.pacienteId}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: 'var(--color-text)',
                    transition: 'all 0.15s',
                    gap: 12,
                  }}
                  id={`link-cal-atend-${ev.atendimentoId}-${i}`}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                      background: ev.tipo === 'consulta' ? '#34d399' : ev.tipo === 'retornoBreve' ? '#818cf8' : '#fbbf24',
                    }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ev.pacienteNome}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{ev.label}</p>
                    </div>
                  </div>
                  <span style={{
                    fontWeight: 700, fontSize: '0.88rem',
                    color: ev.tipo === 'consulta' ? '#34d399' : ev.tipo === 'retornoBreve' ? '#818cf8' : '#fbbf24',
                    flexShrink: 0,
                  }}>
                    {formatBRL(ev.valor)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
