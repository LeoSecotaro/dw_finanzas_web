const DICT: Record<string, string> = {
  id: 'ID',
  name: 'Nombre',
  email: 'Email',
  apodo: 'Apodo',
  created_at: 'Creado en',
  updated_at: 'Actualizado en',
  start_time: 'Hora inicio',
  end_time: 'Hora fin',
  end_date: 'Fecha fin',
  active: 'Activo',
  title: 'Título',
  consultorio_id: 'Consultorio Id',
  consultorio: 'Consultorio',
  user_id: 'Usuario Id',
  day_id: 'Día',
  roles: 'Roles',
  hora: 'Hora',
  nombre: 'Nombre',
  obra_social_id: 'Obra social Id',
  obra_socials: 'Obras sociales',
  phone: 'Teléfono',
  address: 'Dirección',
  // faltas / replacements counts (snake_case)
  faltas_count_week: 'Faltas (semana)',
  faltas_count_month: 'Faltas (mes)',
  replacements_count_week: 'Reemplazos (semana)',
  replacements_count_month: 'Reemplazos (mes)',
  // camelCase variants (in case keys come as camelCase)
  faltasCountWeek: 'Faltas (semana)',
  faltasCountMonth: 'Faltas (mes)',
  replacementsCountWeek: 'Reemplazos (semana)',
  replacementsCountMonth: 'Reemplazos (mes)',
  // common schedule/month keys
  month: 'Mes',
  current: 'Actual',
  start_date: 'Fecha inicio',
  horarios: 'Horarios',
  imagenes: 'Imágenes',
  image: 'Imagen',
  __actions: 'Acciones',
  // agrega más traducciones aquí según necesidades
};

export function translateColumn(key: string | undefined | null): string | null {
  if (!key) return null;
  // try direct match
  const lower = key.toLowerCase();
  if (DICT[lower]) return DICT[lower];
  // try direct key (in case DICT contains camelCase entries)
  if ((DICT as any)[key]) return (DICT as any)[key];
  // try strip plural s
  if (lower.endsWith('s') && DICT[lower.slice(0, -1)]) return DICT[lower.slice(0, -1)];
  // fallback: humanize snake_case and camelCase
  return null;
}

export function humanizeKey(key: string): string {
  if (!key) return '';
  // snake_case and camelCase -> Title Case
  const parts = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').split(/\s+/).filter(Boolean);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export default translateColumn;
