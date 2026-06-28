import React, { useState, useMemo } from 'react';
import { Search, Plus, Users, Phone, DollarSign, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Paciente, PacienteStatus } from '../types';
import PacienteModal from '../components/Modals/PacienteModal';

const statusBadge: Record<PacienteStatus, { label: string; cls: string }> = {
  ativo:   { label: 'Ativo',   cls: 'badge-ativo' },
  inativo: { label: 'Inativo', cls: 'badge-inativo' },
  alta:    { label: 'Alta',    cls: 'badge-alta-pac' },
};

const FAIXAS_DE_PRECO = [
  { label: 'Gratuito / Até R$ 50', match: (v: number) => v <= 50 },
  { label: 'R$ 51 a R$ 100', match: (v: number) => v > 50 && v <= 100 },
  { label: 'R$ 101 a R$ 150', match: (v: number) => v > 100 && v <= 150 },
  { label: 'R$ 151 a R$ 200', match: (v: number) => v > 150 && v <= 200 },
  { label: 'R$ 201 a R$ 250', match: (v: number) => v > 200 && v <= 250 },
  { label: 'Acima de R$ 250', match: (v: number) => v > 250 },
];

function PacienteCard({ paciente }: { paciente: Paciente }) {
  const initials = paciente.nomeExibicao
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <Link
      to={`/pacientes/${paciente.id}`}
      style={{ textDecoration: 'none' }}
      id={`link-paciente-${paciente.id}`}
    >
      <div className="card" style={{
        padding: 16,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: paciente.crise
              ? 'linear-gradient(135deg, rgba(248,113,113,0.3), rgba(248,113,113,0.1))'
              : 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.1))',
            border: paciente.crise ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', fontWeight: 700,
            color: paciente.crise ? 'var(--color-danger)' : 'var(--color-primary)',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{paciente.nomeExibicao}</span>
              <span className={`badge ${statusBadge[paciente.status].cls}`}>
                {statusBadge[paciente.status].label}
              </span>
              {paciente.crise && <span className="badge badge-crise">🚨 Crise</span>}
            </div>
            {paciente.telefone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Phone size={11} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{paciente.telefone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Valor */}
        {paciente.valorAtual > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--color-surface-2)', borderRadius: 8,
            padding: '6px 10px',
          }}>
            <DollarSign size={12} color="var(--color-success)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
              R$ {paciente.valorAtual.toFixed(2)}
              {paciente.ultimoReajuste && (
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginLeft: 6 }}>
                  (Reajuste: {new Date(paciente.ultimoReajuste).toLocaleDateString('pt-BR')})
                </span>
              )}
              {paciente.necessitaNotaFiscal && <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>• NF</span>}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Patients() {
  const { pacientes, loadingData } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PacienteStatus | 'todos' | 'valores'>('todos');
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    return pacientes.filter(p => {
      const matchSearch = p.nomeExibicao.toLowerCase().includes(search.toLowerCase()) ||
        p.telefone?.includes(search);
      const matchStatus = filterStatus === 'todos' || filterStatus === 'valores' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [pacientes, search, filterStatus]);

  const pacientesEmCrise = pacientes.filter(p => p.crise);

  if (loadingData) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Carregando pacientes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Carteira de Pacientes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            {pacientes.filter(p => p.status === 'ativo').length} ativos de {pacientes.length} cadastrados
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          id="btn-novo-paciente"
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      {/* Alerta de crise */}
      {pacientesEmCrise.length > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 12, padding: '12px 16px',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertTriangle size={18} color="var(--color-danger)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-danger)', fontWeight: 500 }}>
            {pacientesEmCrise.length} paciente{pacientesEmCrise.length > 1 ? 's' : ''} em estado de crise:
            {' '}{pacientesEmCrise.map(p => p.nomeExibicao).join(', ')}
          </span>
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="input-buscar-pacientes"
          />
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {(['todos', 'ativo', 'inativo', 'alta', 'valores'] as const).map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(s)}
              id={`btn-filtro-${s}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {s === 'todos' ? 'Todos' : s === 'valores' ? 'Faixas de Valores' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de pacientes ou Kanban de Valores */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p style={{ fontWeight: 600 }}>Nenhum paciente encontrado</p>
          <p style={{ fontSize: '0.85rem' }}>
            {search ? 'Tente uma busca diferente.' : 'Cadastre seu primeiro paciente!'}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-novo-paciente-empty">
              <Plus size={16} /> Cadastrar Paciente
            </button>
          )}
        </div>
      ) : filterStatus === 'valores' ? (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {FAIXAS_DE_PRECO.map(faixa => {
            const pacientesDaFaixa = filtered
              .filter(p => faixa.match(p.valorAtual))
              .sort((a, b) => {
                // Ordenar pelo reajuste mais antigo primeiro (null/undefined são considerados mais antigos)
                const dateA = a.ultimoReajuste ? new Date(a.ultimoReajuste).getTime() : 0;
                const dateB = b.ultimoReajuste ? new Date(b.ultimoReajuste).getTime() : 0;
                return dateA - dateB;
              });

            if (pacientesDaFaixa.length === 0) return null;

            return (
              <div key={faixa.label} style={{
                minWidth: 300,
                width: 300,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {faixa.label}
                  </h3>
                  <span className="badge badge-media">{pacientesDaFaixa.length}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pacientesDaFaixa.map(p => (
                    <PacienteCard key={p.id} paciente={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(p => <PacienteCard key={p.id} paciente={p} />)}
        </div>
      )}

      {showModal && <PacienteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
