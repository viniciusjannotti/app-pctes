// src/utils/agendamento.ts
// Cálculo puro (sem React/Firestore) de horários livres considerando
// as Disponibilidades configuradas e os Agendamentos já confirmados.

import { Disponibilidade, Agendamento } from '../types';

export const PASSO_MINUTOS_PADRAO = 30;

export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minutosParaHora(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function agruparPorDia<T extends { data: string }>(items: T[]): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  items.forEach(item => {
    const d = new Date(item.data);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key)!.push(item);
  });
  return mapa;
}

// Pra cada janela de Disponibilidade, subtrai os intervalos já ocupados
// (mesclando sobreposições) e gera horários candidatos a cada `passoMinutos`,
// só aceitando os que cabem inteiros dentro do intervalo livre resultante.
export function calcularHorariosLivres(
  disponibilidadesDoDia: Disponibilidade[],
  agendamentosDoDia: Agendamento[],
  duracaoMinutos: number,
  passoMinutos: number = PASSO_MINUTOS_PADRAO,
): string[] {
  const busyRaw = agendamentosDoDia
    .map(a => [horaParaMinutos(a.horaInicio), horaParaMinutos(a.horaFim)] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  const busy: [number, number][] = [];
  for (const [s, e] of busyRaw) {
    const last = busy[busy.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else busy.push([s, e]);
  }

  const candidatos = new Set<number>();
  for (const disp of disponibilidadesDoDia) {
    const wStart = horaParaMinutos(disp.horaInicio);
    const wEnd = horaParaMinutos(disp.horaFim);
    const busyNaJanela = busy
      .map(([s, e]) => [Math.max(s, wStart), Math.min(e, wEnd)] as [number, number])
      .filter(([s, e]) => s < e);

    let cursor = wStart;
    const livres: [number, number][] = [];
    for (const [s, e] of busyNaJanela) {
      if (s > cursor) livres.push([cursor, s]);
      cursor = Math.max(cursor, e);
    }
    if (cursor < wEnd) livres.push([cursor, wEnd]);

    for (const [subStart, subEnd] of livres) {
      for (let t = subStart; t + duracaoMinutos <= subEnd; t += passoMinutos) {
        candidatos.add(t);
      }
    }
  }
  return Array.from(candidatos).sort((a, b) => a - b).map(minutosParaHora);
}

export interface DiaComHorariosLivres {
  dateKey: string; // `${ano}-${mes}-${dia}`
  data: Date; // meio-dia
  horarios: string[];
}

// Percorre os próximos `rangeDias` dias corridos, pulando os que não têm
// nenhuma Disponibilidade configurada, e devolve só os dias com pelo menos
// 1 horário livre (hoje só oferece horários que ainda não passaram).
export function calcularProximosDiasComHorarios(
  disponibilidades: Disponibilidade[],
  agendamentos: Agendamento[],
  duracaoMinutos: number,
  rangeDias: 30 | 60 | 90,
  agora: Date = new Date(),
  passoMinutos: number = PASSO_MINUTOS_PADRAO,
): DiaComHorariosLivres[] {
  const dispPorDia = agruparPorDia(disponibilidades);
  const agendPorDia = agruparPorDia(agendamentos);
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12, 0, 0);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const resultado: DiaComHorariosLivres[] = [];
  for (let i = 0; i < rangeDias; i++) {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    const key = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
    const dispDoDia = dispPorDia.get(key);
    if (!dispDoDia || dispDoDia.length === 0) continue;

    let horarios = calcularHorariosLivres(dispDoDia, agendPorDia.get(key) || [], duracaoMinutos, passoMinutos);
    if (i === 0) horarios = horarios.filter(h => horaParaMinutos(h) >= minutosAgora);
    if (horarios.length === 0) continue;

    resultado.push({ dateKey: key, data, horarios });
  }
  return resultado;
}
