import React from 'react';
import CalendarioConsultas from '../components/CalendarioConsultas';

export default function Agenda() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Agenda</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
          Visão completa das suas consultas
        </p>
      </div>

      <CalendarioConsultas />
    </div>
  );
}
