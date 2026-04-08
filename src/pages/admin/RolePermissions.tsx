import React from 'react';
import apiClient from '../../api/apiClient';
import styles from './RolePermissions.module.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function RolePermissions() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | string | null>(null);
  const [activePerms, setActivePerms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [rRoles, rPerms] = await Promise.all([
          apiClient.get('/roles').catch(() => ({ data: [] })),
          apiClient.get('/permissions').catch(() => ({ data: [] })),
        ]);
        if (!mounted) return;
        setRoles(rRoles.data || []);
        setPermissions(rPerms.data || []);
        // select first role if any
        const first = (rRoles.data || [])[0];
        if (first) setSelectedRoleId(first.id || first);
      } catch (e) {
        // keep silent
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (!selectedRoleId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await apiClient.get(`/roles/${selectedRoleId}/permissions`).catch(() => ({ data: [] }));
        if (!mounted) return;
        // keep raw response (could be array of ids or objects)
        setActivePerms(resp.data || []);
      } catch (e) {
        setActivePerms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedRoleId]);

  // helper to extract an identifier from a permission value (object or primitive)
  const getPermId = React.useCallback((p: any) => (p && (p.id ?? p.permission_id ?? p.name)) ?? p, []);

  // set of active permission ids/names for quick filtering
  const activePermIds = React.useMemo(() => new Set((activePerms || []).map(getPermId)), [activePerms, getPermId]);

  // derive display objects for active permissions: prefer full permission obj from `permissions` list
  const activePermObjects = React.useMemo(() => {
    return (activePerms || []).map((p: any) => {
      const pid = getPermId(p);
      if (!pid) return null;
      // try to find full permission object from global permissions list
      const found = (permissions || []).find((x: any) => String(getPermId(x)) === String(pid));
      if (found) return found;
      // if original `p` already looks like an object with a name/description, use it
      if (p && typeof p === 'object' && (p.name || p.title)) return p;
      // fallback: construct minimal object
      return { id: pid, name: String(pid) } as any;
    }).filter(Boolean);
  }, [activePerms, permissions, getPermId]);

  const availablePerms = React.useMemo(() => {
    return (permissions || []).filter((p:any) => !activePermIds.has(getPermId(p)));
  }, [permissions, activePerms]);

  const handleAdd = async (perm: any) => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      // try POST /roles/:id/permissions { permission_id }
      const pid = getPermId(perm);
      await apiClient.post(`/roles/${selectedRoleId}/permissions`, { permission_id: pid });
      // optimistic update: append the permission id (or object) as returned by client
      setActivePerms((s) => [...s, perm]);
      toast.success('Permiso agregado', { autoClose: 1200 });
    } catch (e) {
      toast.error('No se pudo agregar permiso', { autoClose: 1400 });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (perm: any) => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      // try DELETE /roles/:id/permissions/:perm_id
      const pid = getPermId(perm);
      await apiClient.delete(`/roles/${selectedRoleId}/permissions/${pid}`);
      setActivePerms((s) => (s || []).filter((p:any) => String(getPermId(p)) !== String(pid)));
      toast.success('Permiso eliminado', { autoClose: 1200 });
    } catch (e) {
      toast.error('No se pudo eliminar permiso', { autoClose: 1400 });
    } finally {
      setSaving(false);
    }
  };

  if (!selectedRoleId && loading) return <div className={styles.container}><div>Cargando...</div></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gestión de permisos por rol</h2>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => navigate('/admin')} className={styles.backButton}>Volver</button>
        </div>
      </div>

      <div className={styles.controls}>
        <label>Rol</label>
        <select value={selectedRoleId ?? ''} onChange={(e) => setSelectedRoleId(e.target.value || null)}>
          <option value="">-- Seleccionar rol --</option>
          {roles.map((r:any) => <option key={r.id || r} value={r.id || r}>{r.name || r.title || String(r)}</option>)}
        </select>
      </div>

      <div className={styles.columns}>
        <div className={styles.colLeft}>
          <div className={styles.colTitle}>Permisos disponibles</div>
          <div className={styles.list}>
            {availablePerms.length === 0 && <div className={styles.empty}>No hay permisos para agregar</div>}
            {availablePerms.map((p:any) => (
              <div key={p.id || p.permission_id || p} className={styles.item}>
                <div className={styles.itemLabel}>{p.name || p.title || String(p)}</div>
                <button className={styles.addBtn} onClick={() => handleAdd(p)} disabled={saving}>Agregar</button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.colRight}>
          <div className={styles.colTitle}>Permisos activos</div>
          <div className={styles.listRight}>
            {activePermObjects.length === 0 && <div className={styles.empty}>No hay permisos activos</div>}
            {activePermObjects.map((p:any) => (
              <div key={p.id || p.permission_id || p.name} className={styles.activeItem}>
                <div>
                  <div className={styles.itemLabel}>{p.name || p.title || String(p)}</div>
                  <div className={styles.itemDesc}>{p.description || p.desc || ''}</div>
                </div>
                <button className={styles.removeBtn} onClick={() => handleRemove(p)} disabled={saving}>Quitar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
