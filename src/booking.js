// Fecha local (YYYY-MM-DD). toISOString() devuelve UTC: en Argentina, después de las
// 21:00 ya da el día siguiente.
export function localYMD(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Reservas viejas o cargadas a mano pueden venir sin algunos arrays; las pantallas
// asumen que existen, y si no, quedaban en blanco.
export function normalizeBooking(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return d
  return {
    ...d,
    destinos: Array.isArray(d.destinos) ? d.destinos : [],
    items: (Array.isArray(d.items) ? d.items : []).map(it => ({
      ...it,
      pagos: Array.isArray(it?.pagos) ? it.pagos : [],
    })),
  }
}
