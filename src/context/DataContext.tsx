import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import {
  Paciente,
  Atendimento,
  Interacao,
  Tarefa,
  PacienteStatus,
  AtendimentoTipo,
  InteracaoTipo,
  TarefaTipo,
  TarefaPrioridade,
} from '../types';
import {
  criarSeguimento15Dias,
  criarTarefaCrise,
  verificarRetornosPendentes,
  verificarAniversarios,
  verificarReajustes,
  verificarInatividade,
} from '../services/automations';

interface DataContextType {
  pacientes: Paciente[];
  atendimentos: Atendimento[];
  interacoes: Interacao[];
  tarefas: Tarefa[];
  loadingData: boolean;
  inatividadeSugerida: Paciente[];

  // Pacientes
  addPaciente: (data: Omit<Paciente, 'id' | 'ownerId' | 'createdAt' | 'crise'>) => Promise<string>;
  updatePaciente: (id: string, data: Partial<Paciente>) => Promise<void>;
  deletePaciente: (id: string) => Promise<void>;

  // Atendimentos
  addAtendimento: (data: Omit<Atendimento, 'id' | 'ownerId' | 'createdAt'>) => Promise<void>;
  updateAtendimento: (id: string, data: Partial<Atendimento>) => Promise<void>;
  deleteAtendimento: (id: string) => Promise<void>;

  // Interações
  addInteracao: (data: Omit<Interacao, 'id' | 'ownerId' | 'createdAt'>) => Promise<void>;
  updateInteracao: (id: string, data: Partial<Interacao>) => Promise<void>;
  deleteInteracao: (id: string) => Promise<void>;

  // Tarefas
  addTarefa: (data: Omit<Tarefa, 'id' | 'ownerId' | 'createdAt'>) => Promise<void>;
  concluirTarefa: (id: string) => Promise<void>;
  deleteTarefa: (id: string) => Promise<void>;
  updateTarefa: (id: string, data: Partial<Tarefa>) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function tsToISO(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function mapDoc<T>(d: { id: string; data: () => Record<string, unknown> }): T {
  const raw = d.data();
  const mapped: Record<string, unknown> = { id: d.id };
  for (const [k, v] of Object.entries(raw)) {
    mapped[k] = v instanceof Timestamp ? v.toDate().toISOString() : v;
  }
  return mapped as T;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [inatividadeSugerida, setInatividadeSugerida] = useState<Paciente[]>([]);
  const [automationsRan, setAutomationsRan] = useState(false);

  useEffect(() => {
    if (!user) {
      setPacientes([]); setAtendimentos([]); setInteracoes([]); setTarefas([]);
      setLoadingData(false);
      setAutomationsRan(false);
      return;
    }

    setLoadingData(true);
    const uid = user.uid;
    const subs: (() => void)[] = [];

    const qPac = query(collection(db, 'pacientes'), where('ownerId', '==', uid), orderBy('nomeExibicao'));
    subs.push(onSnapshot(qPac, snap => {
      setPacientes(snap.docs.map(d => mapDoc<Paciente>(d)));
    }));

    const qAte = query(collection(db, 'atendimentos'), where('ownerId', '==', uid), orderBy('dataAtendimento', 'desc'));
    subs.push(onSnapshot(qAte, snap => {
      setAtendimentos(snap.docs.map(d => mapDoc<Atendimento>(d)));
    }));

    const qInt = query(collection(db, 'interacoes'), where('ownerId', '==', uid), orderBy('data', 'desc'));
    subs.push(onSnapshot(qInt, snap => {
      setInteracoes(snap.docs.map(d => mapDoc<Interacao>(d)));
    }));

    const qTar = query(collection(db, 'tarefas'), where('ownerId', '==', uid), orderBy('dataPrevista'));
    subs.push(onSnapshot(qTar, snap => {
      setTarefas(snap.docs.map(d => mapDoc<Tarefa>(d)));
      setLoadingData(false);
    }));

    return () => subs.forEach(u => u());
  }, [user]);

  // Run automations once per session after data is loaded
  useEffect(() => {
    if (!user || loadingData || automationsRan || pacientes.length === 0) return;

    const uid = user.uid;
    setAutomationsRan(true);

    (async () => {
      try {
        await verificarAniversarios(pacientes, uid);
        await verificarReajustes(pacientes, uid);
        await verificarRetornosPendentes(pacientes, uid, atendimentos);
        const sugeridos = verificarInatividade(pacientes, atendimentos);
        setInatividadeSugerida(sugeridos);
      } catch (e) {
        console.error('Automations error:', e);
      }
    })();
  }, [user, loadingData, automationsRan, pacientes, atendimentos]);

  // ─── Pacientes ───
  const addPaciente = useCallback(async (data: Omit<Paciente, 'id' | 'ownerId' | 'createdAt' | 'crise'>): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ref = await addDoc(collection(db, 'pacientes'), {
      ...data,
      ownerId: user.uid,
      crise: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }, [user]);

  const updatePaciente = useCallback(async (id: string, data: Partial<Paciente>) => {
    await updateDoc(doc(db, 'pacientes', id), data);
  }, []);

  const deletePaciente = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'pacientes', id));
  }, []);

  // ─── Atendimentos ───
  const addAtendimento = useCallback(async (data: Omit<Atendimento, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const ref = await addDoc(collection(db, 'atendimentos'), {
      ...data,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
    const atendimento: Atendimento = {
      ...data,
      id: ref.id,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
    };
    const paciente = pacientes.find(p => p.id === data.pacienteId);
    if (!paciente) return;

    // Automações
    if (data.criarSeguimento15Dias) {
      await criarSeguimento15Dias(atendimento, paciente.nomeExibicao);
    }
    if (data.marcarCrise) {
      await updatePaciente(paciente.id, { crise: true });
      await criarTarefaCrise(user.uid, paciente.id, paciente.nomeExibicao);
    }
  }, [user, pacientes, updatePaciente]);

  const updateAtendimento = useCallback(async (id: string, data: Partial<Atendimento>) => {
    await updateDoc(doc(db, 'atendimentos', id), data);
  }, []);

  const deleteAtendimento = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'atendimentos', id));
  }, []);

  // ─── Interações ───
  const addInteracao = useCallback(async (data: Omit<Interacao, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(db, 'interacoes'), {
      ...data,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const updateInteracao = useCallback(async (id: string, data: Partial<Interacao>) => {
    await updateDoc(doc(db, 'interacoes', id), data);
  }, []);

  const deleteInteracao = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'interacoes', id));
  }, []);

  // ─── Tarefas ───
  const addTarefa = useCallback(async (data: Omit<Tarefa, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(db, 'tarefas'), {
      ...data,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;
    await updateDoc(doc(db, 'tarefas', id), {
      concluida: true,
      concluidaEm: new Date().toISOString(),
    });
    // Se crise recorrente, gera próxima tarefa se paciente ainda em crise
    if (tarefa.tipo === 'crise' && tarefa.recorrente) {
      const paciente = pacientes.find(p => p.id === tarefa.pacienteId);
      if (paciente?.crise) {
        await criarTarefaCrise(tarefa.ownerId, tarefa.pacienteId, paciente.nomeExibicao);
      }
    }
  }, [tarefas, pacientes]);

  const deleteTarefa = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'tarefas', id));
  }, []);

  const updateTarefa = useCallback(async (id: string, data: Partial<Tarefa>) => {
    await updateDoc(doc(db, 'tarefas', id), data);
  }, []);

  return (
    <DataContext.Provider value={{
      pacientes, atendimentos, interacoes, tarefas, loadingData, inatividadeSugerida,
      addPaciente, updatePaciente, deletePaciente,
      addAtendimento, updateAtendimento, deleteAtendimento,
      addInteracao, updateInteracao, deleteInteracao,
      addTarefa, concluirTarefa, deleteTarefa, updateTarefa,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
