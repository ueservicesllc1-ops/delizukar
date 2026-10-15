/**
 * Utilidades del sistema de Pickup (recogida) - lado cliente.
 */

export const getApiBase = () =>
  process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000';

const PICKUP_TEXT = {
  es: {
    optionTitle: 'Cómo quieres recibir tu pedido',
    optionShipping: 'Envío a domicilio',
    optionPickup: 'Recoger en tienda',
    pickupTitle: 'Elige el sábado y la hora de recogida',
    pickupSubtitle: 'Las recogidas son los sábados. Tus galletas se preparan especialmente para ti, por eso necesitamos al menos un par de días.',
    address: 'Dirección de recogida',
    instructions: 'Instrucciones',
    loading: 'Cargando horarios disponibles...',
    loadError: 'No pudimos cargar los horarios. Intenta de nuevo.',
    retry: 'Reintentar',
    noSlots: 'No hay horarios de recogida disponibles por el momento. Elige envío o inténtalo más tarde.',
    selectDate: 'Selecciona un sábado',
    selectTime: 'Selecciona una hora',
    selected: 'Recogida: {date} a las {time}',
    policyTitle: 'Política de recogida',
    policyText: 'Los pedidos con recogida no tienen devolución, ya que las galletas se preparan especialmente para tu pedido.',
    policyCheckbox: 'Entiendo que los pedidos con recogida no tienen devolución, ya que las galletas se preparan especialmente para mi pedido.',
    free: 'Gratis',
    pickupShippingLabel: 'Recogida en tienda',
    missingSlot: 'Elige una fecha y hora de recogida para continuar con el pago.',
    missingPolicy: 'Acepta la política de recogida para continuar con el pago.',
    missingContact: 'Completa tu información de contacto (nombre, correo y teléfono) para continuar con el pago.',
    ticketTitle: 'Tu ticket de recogida',
    ticketCode: 'Código de recogida',
    ticketWhen: 'Fecha y hora',
    ticketWhere: 'Dirección',
    ticketOrder: 'Pedido',
    ticketReminder: 'Presenta este código (o el QR) al recoger tu pedido.',
    ticketEmail: '📧 Te enviamos el ticket a tu correo',
    ticketPrint: 'Imprimir ticket',
    ticketNeedsReschedule: 'Tu horario necesita confirmación. Te contactaremos pronto para coordinar la recogida.',
    faqQuestion: '🏪 ¿Cómo funciona la recogida en tienda?',
    faqAnswer: 'En el checkout elige "Recoger en tienda", selecciona un día y hora disponibles y completa tu pago. Recibirás un ticket con un código (y QR) por correo para presentarlo al recoger. Los pedidos con recogida no tienen devolución, ya que las galletas se preparan especialmente para tu pedido.'
  },
  en: {
    optionTitle: 'How would you like to receive your order',
    optionShipping: 'Home delivery',
    optionPickup: 'Store pickup',
    pickupTitle: 'Choose your pickup Saturday and time',
    pickupSubtitle: 'Pickups are on Saturdays. Your cookies are freshly prepared just for you, so we need a couple of days.',
    address: 'Pickup address',
    instructions: 'Instructions',
    loading: 'Loading available times...',
    loadError: 'We could not load the available times. Please try again.',
    retry: 'Retry',
    noSlots: 'There are no pickup times available right now. Choose shipping or try again later.',
    selectDate: 'Select a Saturday',
    selectTime: 'Select a time',
    selected: 'Pickup: {date} at {time}',
    policyTitle: 'Pickup policy',
    policyText: 'Pickup orders are non-refundable, because the cookies are freshly prepared specifically for your order.',
    policyCheckbox: 'I understand that pickup orders are non-refundable, because the cookies are freshly prepared specifically for my order.',
    free: 'Free',
    pickupShippingLabel: 'Store pickup',
    missingSlot: 'Choose a pickup date and time to continue with payment.',
    missingPolicy: 'Accept the pickup policy to continue with payment.',
    missingContact: 'Complete your contact information (name, email and phone) to continue with payment.',
    ticketTitle: 'Your pickup ticket',
    ticketCode: 'Pickup code',
    ticketWhen: 'Date & time',
    ticketWhere: 'Address',
    ticketOrder: 'Order',
    ticketReminder: 'Show this code (or the QR) when you pick up your order.',
    ticketEmail: '📧 We emailed you the ticket',
    ticketPrint: 'Print ticket',
    ticketNeedsReschedule: 'Your time slot needs confirmation. We will contact you soon to arrange the pickup.',
    faqQuestion: '🏪 How does store pickup work?',
    faqAnswer: 'At checkout choose "Store pickup", pick an available day and time and complete your payment. You will receive a ticket with a code (and QR) by email to show when you pick up. Pickup orders are non-refundable, because the cookies are freshly prepared specifically for your order.'
  }
};

export const getPickupText = (language) => PICKUP_TEXT[language === 'en' ? 'en' : 'es'];

export const getLocale = (language) => (language === 'en' ? 'en-US' : 'es-ES');

export const formatPickupDate = (dateStr, language, options) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(getLocale(language), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
    timeZone: 'UTC'
  });
};

export const formatPickupTime = (timeStr) => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

/** Código de respaldo (solo se usa si el backend no respondió y se guarda la orden directo en Firestore). */
export const generatePickupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint32Array(6);
  (window.crypto || window.msCrypto).getRandomValues(values);
  return `DLZ-${Array.from(values, (v) => chars[v % chars.length]).join('')}`;
};

export const getPickupQrUrl = (code, size = 170) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=6&data=${encodeURIComponent(code || '')}`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Abre una ventana con el ticket listo para imprimir / guardar como PDF. */
export const printPickupTicket = ({ order, orderId, language }) => {
  const text = getPickupText(language);
  const pickup = order?.pickup || {};
  const when = pickup.date && pickup.time
    ? `${formatPickupDate(pickup.date, language)} - ${formatPickupTime(pickup.time)}`
    : '';
  const items = (order?.cartItems || [])
    .map((item) => `<li>${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}</li>`)
    .join('');

  const win = window.open('', '_blank', 'width=480,height=720');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(text.ticketTitle)} ${escapeHtml(pickup.code)}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;color:#333;}
      .ticket{max-width:380px;margin:auto;border:2px dashed #c8626d;border-radius:16px;padding:22px;text-align:center;}
      h1{color:#c8626d;font-size:20px;margin:0 0 4px 0;}
      .code{font-size:30px;font-weight:800;letter-spacing:3px;color:#c8626d;margin:10px 0;}
      .label{font-size:11px;text-transform:uppercase;color:#888;letter-spacing:1px;margin-top:14px;}
      .value{font-size:15px;font-weight:600;margin-top:2px;}
      ul{list-style:none;padding:0;margin:6px 0 0 0;font-size:14px;}
      .note{font-size:12px;color:#8a5a00;background:#fff4e5;border-radius:8px;padding:10px;margin-top:16px;}
    </style></head><body>
    <div class="ticket">
      <h1>Delizukar</h1>
      <div>${escapeHtml(text.ticketTitle)}</div>
      <div class="label">${escapeHtml(text.ticketCode)}</div>
      <div class="code">${escapeHtml(pickup.code)}</div>
      <img src="${getPickupQrUrl(pickup.code, 170)}" width="170" height="170" alt="QR" />
      <div class="label">${escapeHtml(text.ticketWhen)}</div>
      <div class="value">${escapeHtml(when)}</div>
      <div class="label">${escapeHtml(text.ticketWhere)}</div>
      <div class="value">${escapeHtml(pickup.address || '')}</div>
      <div class="label">${escapeHtml(text.ticketOrder)} #${escapeHtml(orderId || '')}</div>
      <ul>${items}</ul>
      <div class="note">${escapeHtml(text.policyText)}</div>
    </div>
    <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
    </body></html>`);
  win.document.close();
};
