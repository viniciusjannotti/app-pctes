// src/services/automations.ts
// Lógica de automação client-side para geração automática de tarefas

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Paciente, Atendimento, Tarefa, TarefaTipo } from '../types';

const colTarefas = 'tarefas';

function toISO(date: Date): string {
  return date.toISOString();
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function tarefaExiste(
  ownerId: string,
  pacienteId: string,
  tipo: TarefaTipo,
  afterDate?: Date
): Promise<boolean> {
  const q = query(
    collection(db, colTarefas),
    where('ownerId', '==', ownerId),
    where('pacienteId', '==', pacienteId),
    where('tipo', '==', tipo),
    where('concluida', '==', false)
  );
  const snap = await getDocs(q);
  if (afterDate) {
    return snap.docs.some(doc => {
      const t = doc.data() as Tarefa;
      return new Date(t.dataPrevista) >= afterDate;
    });
  }
  return !snap.empty;
}

// ────────────────────────────────────────────
// 1. Seguimento 15 dias após atendimento
// ────────────────────────────────────────────
export async function criarSeguimento15Dias(
  atendimento: Atendimento,
  pacienteNome: string
): Promise<void> {
  if (!atendimento.criarSeguimento15Dias) return;
  const dataPrevista = addDays(new Date(atendimento.dataAtendimento), 15);
  await addDoc(collection(db, colTarefas), {
    ownerId: atendimento.ownerId,
    pacienteId: atendimento.pacienteId,
    titulo: `Seguimento: ${pacienteNome}`,
    descricao: 'Entrar em contato para acompanhar o progresso após a última sessão.',
    tipo: 'seguimento',
    prioridade: 'media',
    dataPrevista: toISO(dataPrevista),
    concluida: false,
    concluidaEm: null,
    recorrente: false,
    metaData: { atendimentoId: atendimento.id },
    createdAt: toISO(new Date()),
  });
}

// ────────────────────────────────────────────
// 2. Tarefa de Crise (48h recorrente)
// ────────────────────────────────────────────
export async function criarTarefaCrise(
  ownerId: string,
  pacienteId: string,
  pacienteNome: string
): Promise<void> {
  const dataPrevista = addHours(new Date(), 48);
  await addDoc(collection(db, colTarefas), {
    ownerId,
    pacienteId,
    titulo: `🚨 Acompanhamento em Crise: ${pacienteNome}`,
    descricao: 'Paciente marcado em estado de crise. Verificar status e bem-estar.',
    tipo: 'crise',
    prioridade: 'critica',
    dataPrevista: toISO(dataPrevista),
    concluida: false,
    concluidaEm: null,
    recorrente: true,
    createdAt: toISO(new Date()),
  });
}

// ────────────────────────────────────────────
// 3. Retorno Previsto (verificar na abertura do Dashboard)
// ────────────────────────────────────────────
export async function verificarRetornosPendentes(
  pacientes: Paciente[],
  ownerId: string,
  atendimentos: Atendimento[]
): Promise<void> {
  const hoje = startOfDay(new Date());

  for (const paciente of pacientes) {
    if (paciente.status !== 'ativo') continue;

    // Pega todos atendimentos do paciente com proxima consulta prevista no passado
    const atendimentosComRetorno = atendimentos.filter(
      a =>
        a.pacienteId === paciente.id &&
        a.proximaConsultaPrevista &&
        new Date(a.proximaConsultaPrevista) < hoje
    );

    for (const at of atendimentosComRetorno) {
      const dataRetorno = new Date(at.proximaConsultaPrevista!);

      // Verifica se houve atendimento posterior ao retorno previsto
      const houvePosterior = atendimentos.some(
        a =>
          a.pacienteId === paciente.id &&
          new Date(a.dataAtendimento) >= dataRetorno
      );

      if (houvePosterior) continue;

      // Verifica se já existe tarefa de retorno para este paciente
      const existe = await tarefaExiste(ownerId, paciente.id, 'retornoPrevisto');
      if (existe) continue;

      await addDoc(collection(db, colTarefas), {
        ownerId,
        pacienteId: paciente.id,
        titulo: `Retorno Previsto: ${paciente.nomeExibicao}`,
        descricao: `Paciente sem agendamento após retorno previsto em ${dataRetorno.toLocaleDateString('pt-BR')}.`,
        tipo: 'retornoPrevisto',
        prioridade: 'alta',
        dataPrevista: toISO(hoje),
        concluida: false,
        concluidaEm: null,
        recorrente: false,
        metaData: { atendimentoId: at.id },
        createdAt: toISO(new Date()),
      });
    }
  }
}

// ────────────────────────────────────────────
// 4. Aniversários (verificar na abertura do Dashboard)
// ────────────────────────────────────────────
export async function verificarAniversarios(
  pacientes: Paciente[],
  ownerId: string
): Promise<void> {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth() + 1;
  const anoHoje = hoje.getFullYear();

  for (const paciente of pacientes) {
    if (!paciente.dataNascimento) continue;
    const [, mesNasc, diaNasc] = paciente.dataNascimento.split('-').map(Number);
    if (diaNasc !== diaHoje || mesNasc !== mesHoje) continue;

    // Verificar se já existe tarefa de aniversário para este ano
    const q = query(
      collection(db, colTarefas),
      where('ownerId', '==', ownerId),
      where('pacienteId', '==', paciente.id),
      where('tipo', '==', 'aniversario')
    );
    const snap = await getDocs(q);
    const jaExisteEsteAno = snap.docs.some(doc => {
      const t = doc.data() as Tarefa;
      return new Date(t.dataPrevista).getFullYear() === anoHoje;
    });
    if (jaExisteEsteAno) continue;

    await addDoc(collection(db, colTarefas), {
      ownerId,
      pacienteId: paciente.id,
      titulo: `🎂 Aniversário: ${paciente.nomeExibicao}`,
      descricao: `Hoje é aniversário de ${paciente.nomeExibicao}! Envie uma mensagem especial.`,
      tipo: 'aniversario',
      prioridade: 'baixa',
      dataPrevista: toISO(startOfDay(hoje)),
      concluida: false,
      concluidaEm: null,
      recorrente: false,
      metaData: { ano: anoHoje },
      createdAt: toISO(new Date()),
    });
  }
}

// ────────────────────────────────────────────
// 5. Reajuste anual
// ────────────────────────────────────────────
export async function verificarReajustes(
  pacientes: Paciente[],
  ownerId: string
): Promise<void> {
  const hoje = new Date();
  const umAnoAtras = new Date(hoje);
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);

  for (const paciente of pacientes) {
    if (paciente.status !== 'ativo') continue;
    const dataRef = paciente.ultimoReajuste
      ? new Date(paciente.ultimoReajuste)
      : new Date(paciente.createdAt);
    if (dataRef > umAnoAtras) continue;

    const existe = await tarefaExiste(ownerId, paciente.id, 'reajuste');
    if (existe) continue;

    await addDoc(collection(db, colTarefas), {
      ownerId,
      pacienteId: paciente.id,
      titulo: `Reajuste Anual: ${paciente.nomeExibicao}`,
      descricao: `Paciente sem reajuste há mais de 12 meses. Valor atual: R$ ${paciente.valorAtual.toFixed(2)}.`,
      tipo: 'reajuste',
      prioridade: 'media',
      dataPrevista: toISO(startOfDay(hoje)),
      concluida: false,
      concluidaEm: null,
      recorrente: false,
      createdAt: toISO(new Date()),
    });
  }
}

// ────────────────────────────────────────────
// 6. Sugestão de inatividade (retorna lista de pacientes sugeridos)
// ────────────────────────────────────────────
export function verificarInatividade(
  pacientes: Paciente[],
  atendimentos: Atendimento[]
): Paciente[] {
  const hoje = new Date();
  const seiseMesesAtras = new Date(hoje);
  seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 6);

  return pacientes.filter(paciente => {
    if (paciente.status !== 'ativo') return false;
    const ultimoAtendimento = atendimentos
      .filter(a => a.pacienteId === paciente.id)
      .sort((a, b) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())[0];

    if (!ultimoAtendimento) {
      return new Date(paciente.createdAt) < seiseMesesAtras;
    }
    return new Date(ultimoAtendimento.dataAtendimento) < seiseMesesAtras;
  });
}
