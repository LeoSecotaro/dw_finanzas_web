import React from 'react';
import apiClient from '../../api/apiClient';
import styles from './RolePermissions.module.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useCurrentUser from '../../hooks/useCurrentUser';

export default function RolePermissions() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | string | null>(null);
  const [activePerms, setActivePerms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const navigate = useNavigate();
  const { refetch } = useCurrentUser();

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
        // Use role show endpoint which returns the role with permissions in the response
        const resp = await apiClient.get(`/roles/${selectedRoleId}`).catch(() => ({ data: {} }));
        if (!mounted) return;
        const role = resp.data || {};
        // support different backend keys (permissions, role_permissions, assigned_permissions)
        const perms = role.permissions ?? role.role_permissions ?? role.assigned_permissions ?? [];
        setActivePerms(perms || []);
      } catch (e) {
        setActivePerms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedRoleId]);

  // helper to extract permission name/id
  const permName = React.useCallback((p: any) => (p && (p.name ?? p.permission_name ?? p.title)) ?? String(p), []);
  const permId = React.useCallback((p: any) => (p && (p.id ?? p.permission_id)) ?? null, []);

  // active names set
  const activeNames = React.useMemo(() => new Set((activePerms || []).map(permName)), [activePerms, permName]);

  // available permissions are those in global list whose name is not active
  const availablePerms = React.useMemo(() => (permissions || []).filter((p:any) => !activeNames.has(permName(p))), [permissions, activeNames, permName]);

  const handleAdd = async (perm: any) => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const name = permName(perm);
      // POST expects permission_name
      await apiClient.post(`/roles/${selectedRoleId}/permissions`, { permission_name: name });
      // optimistic update: append the permission object (prefer full object from permissions list)
      const full = (permissions || []).find((x:any) => permName(x) === name) || { name };
      setActivePerms((s) => [...(s || []), full]);
      toast.success('Permiso agregado', { autoClose: 1200 });
      // refresh current user so permission changes take effect immediately
      try {
        if (typeof refetch === 'function') await refetch();
      } catch (e) {
        // ignore
      }
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
      // need permission id to delete; try to get id from perm, otherwise try to find by name in global list
      const id = permId(perm) ?? permId((permissions || []).find((x:any) => permName(x) === permName(perm)));
      if (!id) throw new Error('permission id not found');
      await apiClient.delete(`/roles/${selectedRoleId}/permissions/${id}`);
      setActivePerms((s) => (s || []).filter((p:any) => permName(p) !== permName(perm)));
      toast.success('Permiso eliminado', { autoClose: 1200 });
      // refresh current user so permission changes take effect immediately
      try {
        if (typeof refetch === 'function') await refetch();
      } catch (e) {
        // ignore
      }
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
              <div key={p.id || p.permission_id || p.name} className={styles.item}>
                <div className={styles.itemLabel}>{p.name || p.title || String(p)}</div>
                <button className={styles.addBtn} onClick={() => handleAdd(p)} disabled={saving}>Agregar</button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.colRight}>
          <div className={styles.colTitle}>Permisos activos</div>
          <div className={styles.listRight}>
            {activePerms.length === 0 && <div className={styles.empty}>No hay permisos activos</div>}
            {activePerms.map((p:any) => (
              <div key={permId(p) || permName(p)} className={styles.activeItem}>
                <div>
                  <div className={styles.itemLabel}>{permName(p)}</div>
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
