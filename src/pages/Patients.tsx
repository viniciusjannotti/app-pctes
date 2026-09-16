import React, { useState, useMemo } from 'react';
import { Search, Plus, Users, Phone, DollarSign, AlertTriangle, SlidersHorizontal, X as XIcon } from 'lucide-react';
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
  { key: 'cortesia', label: 'Cortesia (R$ 0 a R$ 99)', match: (v: number) => v >= 0 && v <= 99 },
  { key: '100-199', label: 'R$ 100 a R$ 199', match: (v: number) => v >= 100 && v <= 199 },
  { key: '200-299', label: 'R$ 200 a R$ 299', match: (v: number) => v >= 200 && v <= 299 },
  { key: '300-399', label: 'R$ 300 a R$ 399', match: (v: number) => v >= 300 && v <= 399 },
  { key: '400-499', label: 'R$ 400 a R$ 499', match: (v: number) => v >= 400 && v <= 499 },
  { key: '500+', label: 'R$ 500 +', match: (v: number) => v >= 500 },
];

const COR_FAIXA_BAIXA = '#B8A1FF'; // lavanda — faixas abaixo de R$ 300
const COR_FAIXA_ALTA = '#F2C14E'; // dourado — faixas de R$ 300 em diante

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getCorFaixa(valor: number): string {
  return valor >= 300 ? COR_FAIXA_ALTA : COR_FAIXA_BAIXA;
}

function PacienteCard({ paciente }: { paciente: Paciente }) {
  const initials = paciente.nomeExibicao
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const corFaixa = getCorFaixa(paciente.valorAtual);

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
              : `linear-gradient(135deg, ${hexToRgba(corFaixa, 0.35)}, ${hexToRgba(corFaixa, 0.12)})`,
            border: paciente.crise ? '1px solid rgba(248,113,113,0.4)' : `1px solid ${hexToRgba(corFaixa, 0.4)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', fontWeight: 700,
            color: paciente.crise ? 'var(--color-danger)' : corFaixa,
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
  const [showFiltros, setShowFiltros] = useState(false);
  const [statusFiltros, setStatusFiltros] = useState<PacienteStatus[]>([]);
  const [faixaFiltros, setFaixaFiltros] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const toggleStatusFiltro = (s: PacienteStatus) =>
    setStatusFiltros(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleFaixaFiltro = (key: string) =>
    setFaixaFiltros(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);

  const limparFiltros = () => { setStatusFiltros([]); setFaixaFiltros([]); };

  const totalFiltrosAtivos = statusFiltros.length + faixaFiltros.length;

  const filtered = useMemo(() => {
    return pacientes.filter(p => {
      const matchSearch = p.nomeExibicao.toLowerCase().includes(search.toLowerCase()) ||
        p.telefone?.includes(search);
      const matchStatus = statusFiltros.length === 0 || statusFiltros.includes(p.status);
      const matchFaixa = faixaFiltros.length === 0 ||
        FAIXAS_DE_PRECO.some(f => faixaFiltros.includes(f.key) && f.match(p.valorAtual));
      return matchSearch && matchStatus && matchFaixa;
    });
  }, [pacientes, search, statusFiltros, faixaFiltros]);

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
      <div style={{ display: 'flex', gap: 10, marginBottom: showFiltros ? 12 : 20, flexWrap: 'wrap' }}>
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
        <button
          className={`btn btn-sm ${showFiltros || totalFiltrosAtivos > 0 ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFiltros(v => !v)}
          id="btn-abrir-filtros"
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <SlidersHorizontal size={14} />
          Filtros{totalFiltrosAtivos > 0 ? ` (${totalFiltrosAtivos})` : ''}
        </button>
      </div>

      {showFiltros && (
        <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>Filtros</span>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowFiltros(false)} id="btn-fechar-filtros">
              <XIcon size={16} />
            </button>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Status
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {(['ativo', 'inativo', 'alta'] as PacienteStatus[]).map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={statusFiltros.includes(s)}
                    onChange={() => toggleStatusFiltro(s)}
                    id={`chk-status-${s}`}
                  />
                  {statusBadge[s].label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Faixas de Valores
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAIXAS_DE_PRECO.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={faixaFiltros.includes(f.key)}
                    onChange={() => toggleFaixaFiltro(f.key)}
                    id={`chk-faixa-${f.key}`}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {totalFiltrosAtivos > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={limparFiltros} id="btn-limpar-filtros" style={{ alignSelf: 'flex-start' }}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

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
      ) : faixaFiltros.length > 0 ? (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {FAIXAS_DE_PRECO.filter(f => faixaFiltros.includes(f.key)).map(faixa => {
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
