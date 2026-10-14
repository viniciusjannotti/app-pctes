import React, { useMemo } from 'react';
import { Cake, Gift, ChevronRight } from 'lucide-react';
import { Paciente } from '../types';
import { Link } from 'react-router-dom';

interface AniversariantesPanelProps {
  pacientes: Paciente[];
}

interface Aniversariante {
  paciente: Paciente;
  dia: number;
  mesOriginal: number; // 0-indexed month of their birthday
  proximoAniversario: Date;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function calcularIdade(dataNascimento: string): number {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNasc = nascimento.getMonth();
  if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

function getProximoAniversario(dataNascimento: string): Date {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const anoAtual = hoje.getFullYear();

  // Aniversário neste ano
  const anivEsteAno = new Date(anoAtual, nascimento.getMonth(), nascimento.getDate());
  anivEsteAno.setHours(0, 0, 0, 0);

  if (anivEsteAno >= hoje) {
    return anivEsteAno;
  }
  // Já passou, próximo ano
  return new Date(anoAtual + 1, nascimento.getMonth(), nascimento.getDate());
}

function isHoje(data: Date): boolean {
  const hoje = new Date();
  return data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear();
}

export default function AniversariantesPanel({ pacientes }: AniversariantesPanelProps) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Gera aniversariantes (apenas pacientes ativos com data de nascimento válida)
  const todosAniversariantes = useMemo<Aniversariante[]>(() => {
    return pacientes
      .filter(p => p.status === 'ativo' && p.dataNascimento)
      .map(p => {
        const nascimento = new Date(p.dataNascimento);
        const prox = getProximoAniversario(p.dataNascimento);
        return {
          paciente: p,
          dia: nascimento.getDate(),
          mesOriginal: nascimento.getMonth(),
          proximoAniversario: prox,
        };
      })
      .sort((a, b) => a.proximoAniversario.getTime() - b.proximoAniversario.getTime());
  }, [pacientes]);

  // Agrupa por mês (relativo ao mês atual, cobrindo 12 meses)
  const grupos = useMemo(() => {
    const map = new Map<string, { mes: number; ano: number; label: string; aniversariantes: Aniversariante[] }>();

    for (let i = 0; i < 12; i++) {
      const mes = (mesAtual + i) % 12;
      const ano = mesAtual + i >= 12 ? anoAtual + 1 : anoAtual;
      const key = `${ano}-${mes}`;
      map.set(key, {
        mes,
        ano,
        label: NOMES_MESES[mes],
        aniversariantes: [],
      });
    }

    for (const aniv of todosAniversariantes) {
      const proxMes = aniv.proximoAniversario.getMonth();
      const proxAno = aniv.proximoAniversario.getFullYear();
      const key = `${proxAno}-${proxMes}`;
      if (map.has(key)) {
        map.get(key)!.aniversariantes.push(aniv);
      }
    }

    return Array.from(map.values());
  }, [todosAniversariantes, mesAtual, anoAtual]);

  const grupoMesAtual = grupos[0]; // primeiro grupo = mês corrente
  const gruposSubsequentes = grupos.slice(1).filter(g => g.aniversariantes.length > 0);

  return (
    <div className="aniversariantes-panel" id="aniversariantes-panel">
      {/* ─── Mês Atual — Destaque ─── */}
      <div className="aniv-mes-destaque">
        <div className="aniv-header-destaque">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="aniv-icon-wrapper">
              <Cake size={18} />
            </div>
            <div>
              <h3 className="aniv-titulo-destaque">Aniversariantes</h3>
              <span className="aniv-subtitulo-destaque">{NOMES_MESES[mesAtual]}</span>
            </div>
          </div>
          {grupoMesAtual.aniversariantes.length > 0 && (
            <span className="aniv-count-badge">
              {grupoMesAtual.aniversariantes.length}
            </span>
          )}
        </div>

        {grupoMesAtual.aniversariantes.length === 0 ? (
          <div className="aniv-empty">
            <Gift size={28} style={{ opacity: 0.3 }} />
            <p>Nenhum aniversariante este mês</p>
          </div>
        ) : (
          <div className="aniv-lista-destaque">
            {grupoMesAtual.aniversariantes.map(aniv => {
              const ehHoje = isHoje(aniv.proximoAniversario);
              const idade = calcularIdade(aniv.paciente.dataNascimento);
              const idadeProx = ehHoje ? idade : idade + 1;

              return (
                <Link
                  key={aniv.paciente.id}
                  to={`/pacientes/${aniv.paciente.id}`}
                  className={`aniv-item-destaque ${ehHoje ? 'aniv-hoje' : ''}`}
                  id={`aniv-item-${aniv.paciente.id}`}
                >
                  <div className="aniv-item-esquerda">
                    <div className={`aniv-dia-badge ${ehHoje ? 'aniv-dia-hoje' : ''}`}>
                      {aniv.dia}
                    </div>
                    <div>
                      <span className="aniv-nome">{aniv.paciente.nomeExibicao}</span>
                      <span className="aniv-idade">
                        {ehHoje ? '🎂 ' : ''}{idadeProx} anos
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="aniv-chevron" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Meses Subsequentes — Compacto com Scroll ─── */}
      {gruposSubsequentes.length > 0 && (
        <div className="aniv-subsequentes">
          <p className="aniv-prox-titulo">Próximos meses</p>
          <div className="aniv-scroll-container">
            {gruposSubsequentes.map(grupo => (
              <div key={`${grupo.ano}-${grupo.mes}`} className="aniv-grupo-compacto">
                <div className="aniv-grupo-header">
                  <span className="aniv-grupo-mes">{grupo.label}</span>
                  <span className="aniv-grupo-count">{grupo.aniversariantes.length}</span>
                </div>
                <div className="aniv-grupo-lista">
                  {grupo.aniversariantes.map(aniv => (
                    <Link
                      key={aniv.paciente.id}
                      to={`/pacientes/${aniv.paciente.id}`}
                      className="aniv-item-compacto"
                      id={`aniv-compact-${aniv.paciente.id}`}
                    >
                      <span className="aniv-dia-compacto">{String(aniv.dia).padStart(2, '0')}</span>
                      <span className="aniv-nome-compacto">{aniv.paciente.nomeExibicao}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
