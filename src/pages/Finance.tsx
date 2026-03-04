import React from 'react';
import Navbar from '../components/navbar/Navbar';

export default function Finance() {
  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <Navbar title="Finanzas" />
      <main style={{ paddingTop: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1200, width: '100%', padding: 24, textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: 24 }}>Panel de Finanzas (esqueleto)</h2>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: 24, borderRadius: 8, minHeight: 240 }}>
            {/* Aquí irán filtros, charts y tablas */}
            <p style={{ color: '#ddd' }}>Agrega filtros y visualizaciones aquí.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
