export type PacienteStatus = 'ativo' | 'inativo' | 'alta';

export interface User {
  id: string;
  nome: string;
  email: string;
  createdAt: string;
}

export interface Paciente {
  id: string;
  ownerId: string;
  nomeExibicao: string;
  telefone: string;
  dataNascimento: string; // ISO date string YYYY-MM-DD
  valorAtual: number;
  ultimoReajuste: string | null; // ISO date string
  necessitaNotaFiscal: boolean;
  status: PacienteStatus;
  crise: boolean;
  createdAt: string;
}

export type AtendimentoTipo = 'consulta' | 'retornoBreve';

export interface Atendimento {
  id: string;
  ownerId: string;
  pacienteId: string;
  dataAtendimento: string; // ISO date string
  tipo: AtendimentoTipo;
  valorPrevisto: number;
  valorRecebido: number;
  valorPendente: number;
  proximaConsultaPrevista: string | null; // ISO date string
  criarSeguimento15Dias: boolean;
  marcarCrise: boolean;
  createdAt: string;
}

export type InteracaoTipo = 'duvidaTratamento' | 'novaDemanda' | 'administrativo' | 'outro';

export interface Interacao {
  id: string;
  ownerId: string;
  pacienteId: string;
  data: string; // ISO date string
  tipo: InteracaoTipo;
  observacao: string;
  createdAt: string;
}

export type TarefaTipo =
  | 'seguimento'
  | 'retornoPrevisto'
  | 'aniversario'
  | 'cobranca'
  | 'reajuste'
  | 'crise'
  | 'personalizada';

export type TarefaPrioridade = 'baixa' | 'media' | 'alta' | 'critica';

export interface Tarefa {
  id: string;
  ownerId: string;
  pacienteId: string;
  titulo: string;
  descricao: string;
  tipo: TarefaTipo;
  prioridade: TarefaPrioridade;
  dataPrevista: string; // ISO date string
  concluida: boolean;
  concluidaEm: string | null;
  recorrente: boolean;
  metaData?: Record<string, unknown>;
  createdAt: string;
}

// For timeline view — unified entry
export type TimelineItemType = 'atendimento' | 'interacao' | 'tarefa';

export interface TimelineItem {
  id: string;
  date: string;
  type: TimelineItemType;
  data: Atendimento | Interacao | Tarefa;
}
