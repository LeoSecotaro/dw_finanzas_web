import React from 'react';
import Navbar from '../components/navbar/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The parent `Admin` component renders the fixed sidebar so this layout must not render it again.
  // Keep left padding to account for the sidebar width (260px).
  return (
    <div>
      <Navbar title="Administrador" />
      <div style={{ display: 'flex', marginTop: 18 }}>
        <main style={{ flex: 1, padding: 18, paddingLeft: 260, boxSizing: 'border-box', overflowX: 'auto', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
