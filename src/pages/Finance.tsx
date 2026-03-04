import React from 'react';
import Navbar from '../components/navbar/Navbar';
import UploadModal from '../components/modals/UploadModal';
import CreateChartModal from '../components/modals/CreateChartModal';
import styles from './Finance.module.css';

export default function Finance() {
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const handleCreate = (config: any) => {
    console.log('Crear tarjeta con config', config);
    // Aquí agregaríamos la tarjeta al estado y pediríamos datos al backend
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <Navbar title="Finanzas" />
      <main style={{ paddingTop: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1200, width: '100%', padding: 24, textAlign: 'center' }}>


          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
            <button onClick={() => setUploadOpen(true)} className={`${styles.btn} ${styles.btnSecondary}`}>
              Subir archivos
            </button>
            <button onClick={() => setCreateOpen(true)} className={`${styles.btn} ${styles.btnPrimary}`}>
              Crear gráfico
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', padding: 24, borderRadius: 8, minHeight: 240 }}>
            {/* Aquí irán filtros, charts y tablas */}
            <p style={{ color: '#ddd' }}>Agrega filtros y visualizaciones aquí.</p>
          </div>
        </div>
      </main>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
      <CreateChartModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
