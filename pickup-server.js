/**
 * Sistema de Pickup (recogida de pedidos) - lógica de servidor.
 *
 * - Disponibilidad de fechas/horas (configurada por el admin en Firestore: settings/pickup)
 * - Reserva de franjas con capacidad (colección pickupSlots)
 * - Código de ticket y correos (ticket al cliente, aviso al admin, "listo para recoger")
 * - Endpoints para que el admin cambie el estado / reprograme / reenvíe el ticket
 *
 * Correos: usa SMTP (Gmail con contraseña de aplicación) si existen SMTP_USER y SMTP_PASS.
 * Si no están configuradas, cae a la plantilla EmailJS existente (texto plano).
 */
const nodeCrypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  runTransaction
} = require('firebase/firestore');

const ADMIN_EMAIL = 'delizukar@gmail.com';
const PICKUP_STATUSES = ['scheduled', 'ready', 'picked_up', 'cancelled', 'no_show'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

const DEFAULT_SETTINGS = {
  enabled: false,
  address: '',
  instructions: '',
  instructionsEn: '',
  timezone: 'America/New_York',
  leadTimeHours: 24,
  maxDaysAhead: 30,
  slotDurationMin: 30,
  capacityPerSlot: 1,
  weeklySchedule: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  blockedDates: [],
  extraDates: []
};

// ==================== TEXTOS ====================
const TEXT = {
  es: {
    ticketSubject: (code) => `🎟️ Tu ticket de recogida ${code} - Delizukar`,
    readySubject: (code) => `🍪 ¡Tu pedido ${code} está listo para recoger! - Delizukar`,
    rescheduledSubject: (code) => `📅 Tu recogida ${code} fue reprogramada - Delizukar`,
    ticketTitle: 'Tu pedido está confirmado',
    readyTitle: '¡Tu pedido está listo para recoger!',
    rescheduledTitle: 'Tu recogida fue reprogramada',
    hello: (name) => `¡Hola ${name}!`,
    ticketIntro: 'Gracias por tu compra. Presenta este código (o el QR) al recoger tu pedido.',
    readyIntro: 'Ya puedes pasar por tu pedido. Presenta este código al recogerlo.',
    rescheduledIntro: 'Cambiamos la fecha/hora de tu recogida. Estos son los nuevos datos:',
    code: 'Código de recogida',
    when: 'Fecha y hora de recogida',
    where: 'Dirección de recogida',
    instructions: 'Instrucciones',
    items: 'Tu pedido',
    total: 'Total pagado',
    order: 'Pedido',
    policyTitle: 'Política de recogida',
    policy: 'Los pedidos con recogida no tienen devolución, ya que las galletas se preparan especialmente para tu pedido.',
    footer: '¿Preguntas? Escríbenos a delizukar@gmail.com',
    pending: 'Por confirmar'
  },
  en: {
    ticketSubject: (code) => `🎟️ Your pickup ticket ${code} - Delizukar`,
    readySubject: (code) => `🍪 Your order ${code} is ready for pickup! - Delizukar`,
    rescheduledSubject: (code) => `📅 Your pickup ${code} was rescheduled - Delizukar`,
    ticketTitle: 'Your order is confirmed',
    readyTitle: 'Your order is ready for pickup!',
    rescheduledTitle: 'Your pickup was rescheduled',
    hello: (name) => `Hi ${name}!`,
    ticketIntro: 'Thank you for your purchase. Show this code (or the QR) when you pick up your order.',
    readyIntro: 'You can now come get your order. Show this code when you pick it up.',
    rescheduledIntro: 'We changed the date/time of your pickup. Here are the new details:',
    code: 'Pickup code',
    when: 'Pickup date & time',
    where: 'Pickup address',
    instructions: 'Instructions',
    items: 'Your order',
    total: 'Total paid',
    order: 'Order',
    policyTitle: 'Pickup policy',
    policy: 'Pickup orders are non-refundable, because the cookies are freshly prepared specifically for your order.',
    footer: 'Questions? Write us at delizukar@gmail.com',
    pending: 'To be confirmed'
  }
};

const getText = (lang) => TEXT[lang === 'en' ? 'en' : 'es'];

// ==================== HELPERS ====================
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const slotId = (date, time) => `${date}_${String(time).replace(':', '')}`;

const timeToMinutes = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
};

const minutesToTime = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const slotToMs = (date, time) => {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm);
};

/** "Ahora" en la zona horaria de la tienda, expresado como ms UTC "de pared". */
const nowInTimezone = (timezone) => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  } catch (error) {
    console.warn('⚠️ [Pickup] Zona horaria inválida, usando hora UTC:', timezone);
    return Date.now();
  }
};

const formatDate = (dateStr, lang) => {
  if (!dateStr || !DATE_RE.test(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

const formatTime = (timeStr) => {
  if (!timeStr || !TIME_RE.test(timeStr)) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += chars[nodeCrypto.randomInt(chars.length)];
  }
  return `DLZ-${out}`;
};

// ==================== SERVICIO ====================
module.exports = function createPickupService({ db, sendEmailViaEmailJS }) {
  // ---------- Configuración ----------
  async function getSettings() {
    const snap = await getDoc(doc(db, 'settings', 'pickup'));
    const data = snap.exists() ? snap.data() : {};
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      weeklySchedule: { ...DEFAULT_SETTINGS.weeklySchedule, ...(data.weeklySchedule || {}) },
      blockedDates: Array.isArray(data.blockedDates) ? data.blockedDates : [],
      extraDates: Array.isArray(data.extraDates) ? data.extraDates : []
    };
  }

  /**
   * Sábado de recogida automático (solo 1 sábado disponible).
   * - Pedidos de hasta el día jueves al medio día (12:00 PM en hora de la tienda): sábado que sigue (este sábado).
   * - Pedidos que se generen después de esto: pasan al siguiente sábado.
   */
  function getPickupSaturdays(nowMs) {
    const today = new Date(nowMs);
    const dow = today.getUTCDay(); // 0=dom, 1=lun, 2=mar, 3=mié, 4=jue, 5=vie, 6=sáb (en hora de la tienda)
    const hours = today.getUTCHours();
    const minutes = today.getUTCMinutes();

    // Hasta el jueves a las 12:00 PM (inclusive)
    const isUpToThursdayNoon = dow < 4 || (dow === 4 && (hours < 12 || (hours === 12 && minutes === 0)));
    const daysToUpcomingSaturday = (6 - dow + 7) % 7;

    // Si es hasta el jueves al mediodía: sábado que sigue (este sábado)
    // Si es después del jueves al mediodía: pasa al siguiente sábado (+7 días)
    const offset = isUpToThursdayNoon ? daysToUpcomingSaturday : daysToUpcomingSaturday + 7;

    const targetDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset));
    return [targetDate.toISOString().slice(0, 10)];
  }

  /** Genera todas las franjas válidas según horario semanal, fechas bloqueadas y extra. */
  function buildSlots(settings, nowMs, { ignoreLeadTime = false } = {}) {
    const slots = [];
    const seen = new Set();
    const leadMs = ignoreLeadTime ? 0 : Math.max(0, Number(settings.leadTimeHours) || 0) * 3600000;
    const earliest = nowMs + leadMs;
    const duration = Math.max(5, Number(settings.slotDurationMin) || 30);
    const maxDays = Math.max(0, Number(settings.maxDaysAhead) || 30);
    const today = new Date(nowMs); // los campos UTC representan la fecha local de la tienda

    for (let i = 0; i <= maxDays; i += 1) {
      const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
      const dateStr = day.toISOString().slice(0, 10);
      if (settings.blockedDates.includes(dateStr)) continue;

      const ranges = [...(settings.weeklySchedule[DAY_KEYS[day.getUTCDay()]] || [])];
      settings.extraDates
        .filter((extra) => extra && extra.date === dateStr)
        .forEach((extra) => ranges.push({ start: extra.start, end: extra.end }));

      ranges.forEach((range) => {
        if (!range || !TIME_RE.test(range.start || '') || !TIME_RE.test(range.end || '')) return;
        const endMin = timeToMinutes(range.end);
        for (let m = timeToMinutes(range.start); m + duration <= endMin; m += duration) {
          const time = minutesToTime(m);
          const key = slotId(dateStr, time);
          if (seen.has(key)) continue;
          if (slotToMs(dateStr, time) < earliest) continue;
          seen.add(key);
          slots.push({ date: dateStr, time });
        }
      });
    }
    return slots;
  }

  async function getSlotCounts(fromDate) {
    const counts = {};
    const snap = await getDocs(query(collection(db, 'pickupSlots'), where('date', '>=', fromDate)));
    snap.forEach((d) => {
      counts[d.id] = d.data().count || 0;
    });
    return counts;
  }

  async function reserveSlot(date, time) {
    const ref = doc(db, 'pickupSlots', slotId(date, time));
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const count = (snap.exists() ? snap.data().count || 0 : 0) + 1;
      tx.set(ref, { date, time, count, updatedAt: new Date() }, { merge: true });
      return count;
    });
  }

  async function releaseSlot(date, time) {
    if (!date || !time) return;
    const ref = doc(db, 'pickupSlots', slotId(date, time));
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      tx.set(ref, { count: Math.max(0, (snap.data().count || 0) - 1), updatedAt: new Date() }, { merge: true });
    });
  }

  /**
   * Crea el registro de pickup de una orden: valida la franja, reserva capacidad y genera el código.
   * Nunca lanza error por una franja inválida/llena: el pago ya se realizó, así que se marca
   * `needsReschedule` para que el admin lo gestione.
   */
  async function createPickupRecord(input = {}) {
    const settings = await getSettings();
    const nowMs = nowInTimezone(settings.timezone);
    const [autoSaturday] = getPickupSaturdays(nowMs);
    const date = input?.date || autoSaturday;
    const time = input?.time || null;

    const record = {
      date,
      time,
      slotId: date && time ? slotId(date, time) : null,
      code: generateCode(),
      status: 'scheduled',
      address: settings.address || '',
      instructions: settings.instructions || '',
      instructionsEn: settings.instructionsEn || '',
      timezone: settings.timezone,
      slotReserved: false,
      overbooked: false,
      needsReschedule: false,
      createdAt: new Date()
    };

    if (!date || !time || !DATE_RE.test(date) || !TIME_RE.test(time)) {
      record.needsReschedule = true;
      return record;
    }

    const valid = buildSlots(settings, nowMs, { ignoreLeadTime: true }).some(
      (s) => s.date === date && s.time === time
    );
    if (!valid) {
      record.needsReschedule = true;
      return record;
    }

    try {
      const capacity = Math.max(1, Number(settings.capacityPerSlot) || 1);
      const count = await reserveSlot(date, time);
      record.slotReserved = true;
      if (count > capacity) {
        record.overbooked = true;
        record.needsReschedule = true;
      }
    } catch (error) {
      console.error('❌ [Pickup] Error reservando franja:', error.message);
      record.needsReschedule = true;
    }
    return record;
  }

  // ---------- Correos ----------
  let transporter = null;
  function getTransporter() {
    if (transporter) return transporter;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) return null;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: String(process.env.SMTP_SECURE ?? 'true') !== 'false',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    return transporter;
  }

  const customerNameOf = (order) =>
    `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Cliente';

  const itemsOf = (order) => Array.isArray(order.cartItems) ? order.cartItems : [];

  const itemLine = (item) => {
    const extra = item.description_extra ? ` (${item.description_extra})` : '';
    return `${item.quantity}x ${item.name}${extra} - $${(parseFloat(item.price) * item.quantity).toFixed(2)}`;
  };

  async function sendMail({ to, subject, html, text, order, orderId }) {
    const tr = getTransporter();
    if (tr) {
      await tr.sendMail({
        from: `"Delizukar" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text
      });
      return 'smtp';
    }

    // Fallback: plantilla EmailJS existente (solo texto, sin QR ni diseño)
    const total = parseFloat(order.total) || 0;
    await sendEmailViaEmailJS({
      to_email: to,
      to_name: customerNameOf(order),
      order_id: orderId,
      customer_name: customerNameOf(order),
      customer_email: order.customerInfo?.email || '',
      customer_phone: order.customerInfo?.phone || 'N/A',
      customer_address: `PICKUP - ${order.pickup?.address || ''}`,
      order_total: `$${total.toFixed(2)}`,
      shipping_cost: '$0.00',
      subtotal: `$${total.toFixed(2)}`,
      items_count: String(itemsOf(order).length),
      items_list: itemsOf(order).map(itemLine).join('\n'),
      payment_method: 'PayPal',
      payment_id: order.paymentIntentId || order.sessionId || 'N/A',
      order_date: new Date().toLocaleString('es-ES'),
      subject,
      message: text,
      tracking_code: order.pickup?.code || '',
      tracking_url: '',
      label_url: ''
    });
    return 'emailjs';
  }

  function buildCustomerEmail(order, orderId, variant = 'ticket') {
    const lang = order.language === 'en' ? 'en' : 'es';
    const t = getText(lang);
    const pickup = order.pickup || {};
    const name = customerNameOf(order);
    const whenText = pickup.date && pickup.time
      ? `${formatDate(pickup.date, lang)} - ${formatTime(pickup.time)}`
      : t.pending;
    const instructions = (lang === 'en' ? pickup.instructionsEn || pickup.instructions : pickup.instructions) || '';
    const total = (parseFloat(order.total) || 0).toFixed(2);

    const title = variant === 'ready' ? t.readyTitle : variant === 'rescheduled' ? t.rescheduledTitle : t.ticketTitle;
    const intro = variant === 'ready' ? t.readyIntro : variant === 'rescheduled' ? t.rescheduledIntro : t.ticketIntro;
    const subject = variant === 'ready'
      ? t.readySubject(pickup.code)
      : variant === 'rescheduled'
        ? t.rescheduledSubject(pickup.code)
        : t.ticketSubject(pickup.code);

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&margin=6&data=${encodeURIComponent(pickup.code || '')}`;
    const itemsHtml = itemsOf(order)
      .map((item) => `
        <tr>
          <td style="padding:6px 0;color:#444;font-size:14px;">${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}${item.description_extra ? ` <span style="color:#888;">(${escapeHtml(item.description_extra)})</span>` : ''}</td>
          <td style="padding:6px 0;color:#444;font-size:14px;text-align:right;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
        </tr>`)
      .join('');

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#fbf3f1;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f1;padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.08);">
        <tr><td style="background:#c8626d;padding:22px 28px;color:#fff;">
          <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:.9;">Delizukar</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px;">${escapeHtml(title)}</div>
        </td></tr>
        <tr><td style="padding:24px 28px 8px 28px;">
          <p style="margin:0 0 6px 0;font-size:16px;color:#333;"><strong>${escapeHtml(t.hello(name))}</strong></p>
          <p style="margin:0;font-size:14px;color:#666;line-height:1.5;">${escapeHtml(intro)}</p>
        </td></tr>
        <tr><td align="center" style="padding:18px 28px;">
          <div style="border:2px dashed #c8626d;border-radius:14px;padding:18px;">
            <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1.5px;">${escapeHtml(t.code)}</div>
            <div style="font-size:32px;font-weight:800;color:#c8626d;letter-spacing:3px;margin:6px 0 12px 0;">${escapeHtml(pickup.code)}</div>
            <img src="${qrUrl}" width="170" height="170" alt="QR ${escapeHtml(pickup.code)}" style="display:block;margin:0 auto;" />
          </div>
        </td></tr>
        <tr><td style="padding:0 28px 8px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5f4;border-radius:12px;">
            <tr><td style="padding:14px 18px;">
              <div style="font-size:12px;color:#888;text-transform:uppercase;">${escapeHtml(t.when)}</div>
              <div style="font-size:16px;color:#333;font-weight:700;margin:2px 0 12px 0;">${escapeHtml(whenText)}</div>
              <div style="font-size:12px;color:#888;text-transform:uppercase;">${escapeHtml(t.where)}</div>
              <div style="font-size:15px;color:#333;margin:2px 0 ${instructions ? '12px' : '0'} 0;">${escapeHtml(pickup.address || '')}</div>
              ${instructions ? `<div style="font-size:12px;color:#888;text-transform:uppercase;">${escapeHtml(t.instructions)}</div>
              <div style="font-size:14px;color:#555;margin-top:2px;">${escapeHtml(instructions)}</div>` : ''}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:14px 28px 4px 28px;">
          <div style="font-size:13px;color:#888;text-transform:uppercase;margin-bottom:4px;">${escapeHtml(t.items)} · ${escapeHtml(t.order)} #${escapeHtml(orderId)}</div>
          <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}
            <tr><td colspan="2" style="border-top:1px solid #eee;padding-top:8px;"></td></tr>
            <tr>
              <td style="font-size:15px;color:#333;font-weight:700;">${escapeHtml(t.total)}</td>
              <td style="font-size:15px;color:#c8626d;font-weight:700;text-align:right;">$${total}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px;">
          <div style="background:#fff4e5;border-left:4px solid #f0a030;border-radius:8px;padding:12px 14px;">
            <div style="font-size:13px;font-weight:700;color:#8a5a00;">${escapeHtml(t.policyTitle)}</div>
            <div style="font-size:13px;color:#8a5a00;line-height:1.5;margin-top:2px;">${escapeHtml(t.policy)}</div>
          </div>
        </td></tr>
        <tr><td style="padding:6px 28px 24px 28px;text-align:center;font-size:12px;color:#999;">${escapeHtml(t.footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = [
      `${title}`,
      '',
      t.hello(name),
      intro,
      '',
      `${t.code}: ${pickup.code}`,
      `${t.when}: ${whenText}`,
      `${t.where}: ${pickup.address || ''}`,
      instructions ? `${t.instructions}: ${instructions}` : '',
      '',
      `${t.items} (${t.order} #${orderId}):`,
      ...itemsOf(order).map(itemLine),
      `${t.total}: $${total}`,
      '',
      `${t.policyTitle}: ${t.policy}`
    ].filter((line) => line !== undefined).join('\n');

    return { subject, html, text };
  }

  function buildAdminEmail(order, orderId) {
    const pickup = order.pickup || {};
    const name = customerNameOf(order);
    const whenText = pickup.date && pickup.time
      ? `${formatDate(pickup.date, 'es')} - ${formatTime(pickup.time)}`
      : 'SIN FECHA (requiere reprogramar)';
    const total = (parseFloat(order.total) || 0).toFixed(2);
    const alertLine = pickup.needsReschedule
      ? '⚠️ ATENCIÓN: la franja elegida no estaba disponible o está sobrecupada. Reprograma la recogida desde "Órdenes de Pickup".'
      : '';

    const subject = `🎟️ Nueva orden de PICKUP ${pickup.code} - ${whenText}`;
    const text = [
      `Nueva orden de recogida (pickup) - Pedido #${orderId}`,
      alertLine,
      '',
      `Código: ${pickup.code}`,
      `Fecha y hora: ${whenText}`,
      '',
      `Cliente: ${name}`,
      `Email: ${order.customerInfo?.email || ''}`,
      `Teléfono: ${order.customerInfo?.phone || 'No proporcionado'}`,
      '',
      'Productos:',
      ...itemsOf(order).map(itemLine),
      `Total: $${total}`,
      '',
      'Gestiona la orden en el panel de administración → Órdenes de Pickup.'
    ].filter((line) => line !== undefined).join('\n');

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;padding:18px;color:#333;">
      <h2 style="color:#c8626d;margin:0 0 8px 0;">Nueva orden de PICKUP</h2>
      ${alertLine ? `<p style="background:#fdecea;border-left:4px solid #d32f2f;padding:10px;border-radius:6px;color:#b71c1c;">${escapeHtml(alertLine)}</p>` : ''}
      <p style="font-size:26px;font-weight:800;color:#c8626d;letter-spacing:2px;margin:6px 0;">${escapeHtml(pickup.code)}</p>
      <p><strong>Fecha y hora:</strong> ${escapeHtml(whenText)}</p>
      <p><strong>Cliente:</strong> ${escapeHtml(name)}<br/>
         <strong>Email:</strong> ${escapeHtml(order.customerInfo?.email || '')}<br/>
         <strong>Teléfono:</strong> ${escapeHtml(order.customerInfo?.phone || 'No proporcionado')}</p>
      <p><strong>Productos:</strong><br/>${itemsOf(order).map((i) => escapeHtml(itemLine(i))).join('<br/>')}</p>
      <p style="font-size:16px;"><strong>Total:</strong> $${total}</p>
      <p style="color:#888;font-size:12px;">Pedido #${escapeHtml(orderId)} · Gestiona la orden en Admin → Órdenes de Pickup.</p>
    </div>`;

    return { subject, html, text };
  }

  async function sendPickupOrderEmails(order, orderId) {
    const customerEmail = order.customerInfo?.email;
    const customerMail = buildCustomerEmail(order, orderId, 'ticket');
    const adminMail = buildAdminEmail(order, orderId);

    const results = await Promise.allSettled([
      customerEmail
        ? sendMail({ to: customerEmail, ...customerMail, order, orderId })
        : Promise.reject(new Error('Sin email de cliente')),
      sendMail({ to: ADMIN_EMAIL, ...adminMail, order, orderId })
    ]);

    const describe = (r) => (r.status === 'fulfilled'
      ? { sent: true, via: r.value, error: null }
      : { sent: false, via: null, error: r.reason?.message || String(r.reason) });

    const status = { customer: describe(results[0]), admin: describe(results[1]) };
    console.log('📧 [Pickup] Resultado correos:', JSON.stringify(status));
    return status;
  }

  async function sendCustomerVariant(order, orderId, variant) {
    const customerEmail = order.customerInfo?.email;
    if (!customerEmail) throw new Error('La orden no tiene email de cliente');
    const mail = buildCustomerEmail(order, orderId, variant);
    return sendMail({ to: customerEmail, ...mail, order, orderId });
  }

  // ---------- Rutas ----------
  function registerRoutes(app) {
    // Disponibilidad pública (cliente) / completa (admin con ?admin=1)
    app.get('/api/pickup/availability', async (req, res) => {
      try {
        const isAdmin = req.query.admin === '1';
        const settings = await getSettings();

        if (!settings.enabled && !isAdmin) {
          return res.json({ enabled: false, slots: [] });
        }

        const nowMs = nowInTimezone(settings.timezone);
        const todayStr = new Date(nowMs).toISOString().slice(0, 10);
        const slots = buildSlots(settings, nowMs, { ignoreLeadTime: true });
        const counts = await getSlotCounts(todayStr);
        const capacity = Math.max(1, Number(settings.capacityPerSlot) || 1);

        const saturdays = isAdmin ? null : getPickupSaturdays(nowMs);

        const available = slots
          .filter((s) => isAdmin || saturdays.includes(s.date))
          .map((s) => {
            const used = counts[slotId(s.date, s.time)] || 0;
            return { ...s, remaining: Math.max(0, capacity - used) };
          })
          .filter((s) => isAdmin || s.remaining > 0);

        res.json({
          enabled: !!settings.enabled,
          address: settings.address,
          instructions: settings.instructions,
          instructionsEn: settings.instructionsEn,
          timezone: settings.timezone,
          leadTimeHours: settings.leadTimeHours,
          slots: available
        });
      } catch (error) {
        console.error('❌ [Pickup] Error en disponibilidad:', error);
        res.status(500).json({ enabled: false, slots: [], error: error.message });
      }
    });

    // Cambiar estado de una orden de pickup
    app.post('/api/pickup/orders/:orderId/status', async (req, res) => {
      try {
        const { orderId } = req.params;
        const { status } = req.body || {};
        if (!PICKUP_STATUSES.includes(status)) {
          return res.status(400).json({ error: 'Estado inválido' });
        }

        const ref = doc(db, 'orders', orderId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return res.status(404).json({ error: 'Orden no encontrada' });
        const order = snap.data();
        if (order.fulfillmentType !== 'pickup') {
          return res.status(400).json({ error: 'La orden no es de pickup' });
        }

        const previous = order.pickup?.status;
        const updates = {
          'pickup.status': status,
          'pickup.updatedAt': new Date(),
          updatedAt: new Date()
        };
        if (status === 'scheduled') updates.status = 'pending';
        if (status === 'ready') updates.status = 'processing';
        if (status === 'picked_up') {
          updates.status = 'completed';
          updates['pickup.pickedUpAt'] = new Date();
        }
        if (status === 'cancelled') updates.status = 'cancelled';

        if (status === 'cancelled' && previous !== 'cancelled' && order.pickup?.slotReserved) {
          try {
            await releaseSlot(order.pickup.date, order.pickup.time);
            updates['pickup.slotReserved'] = false;
          } catch (error) {
            console.error('⚠️ [Pickup] No se pudo liberar la franja:', error.message);
          }
        }

        await updateDoc(ref, updates);

        let emailSent = null;
        let emailError = null;
        if (status === 'ready' && previous !== 'ready') {
          try {
            await sendCustomerVariant({ ...order, pickup: { ...order.pickup, status } }, orderId, 'ready');
            emailSent = true;
          } catch (error) {
            emailSent = false;
            emailError = error.message;
            console.error('❌ [Pickup] Error enviando correo de "listo":', error.message);
          }
        }

        res.json({ success: true, status, emailSent, emailError });
      } catch (error) {
        console.error('❌ [Pickup] Error actualizando estado:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Reprogramar recogida
    app.post('/api/pickup/orders/:orderId/reschedule', async (req, res) => {
      try {
        const { orderId } = req.params;
        const { date, time } = req.body || {};
        if (!DATE_RE.test(date || '') || !TIME_RE.test(time || '')) {
          return res.status(400).json({ error: 'Fecha u hora inválida' });
        }

        const ref = doc(db, 'orders', orderId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return res.status(404).json({ error: 'Orden no encontrada' });
        const order = snap.data();
        if (order.fulfillmentType !== 'pickup') {
          return res.status(400).json({ error: 'La orden no es de pickup' });
        }

        const settings = await getSettings();
        const nowMs = nowInTimezone(settings.timezone);
        const valid = buildSlots(settings, nowMs, { ignoreLeadTime: true }).some(
          (s) => s.date === date && s.time === time
        );
        if (!valid) {
          return res.status(400).json({ error: 'La franja no está dentro del horario configurado' });
        }

        if (order.pickup?.slotReserved && order.pickup?.date && order.pickup?.time) {
          await releaseSlot(order.pickup.date, order.pickup.time);
        }
        const capacity = Math.max(1, Number(settings.capacityPerSlot) || 1);
        const count = await reserveSlot(date, time);

        const newPickup = {
          ...order.pickup,
          date,
          time,
          slotId: slotId(date, time),
          slotReserved: true,
          overbooked: count > capacity,
          needsReschedule: false,
          status: order.pickup?.status === 'cancelled' ? 'cancelled' : 'scheduled',
          rescheduledAt: new Date()
        };

        await updateDoc(ref, {
          'pickup.date': date,
          'pickup.time': time,
          'pickup.slotId': newPickup.slotId,
          'pickup.slotReserved': true,
          'pickup.overbooked': newPickup.overbooked,
          'pickup.needsReschedule': false,
          'pickup.status': newPickup.status,
          'pickup.rescheduledAt': newPickup.rescheduledAt,
          updatedAt: new Date()
        });

        let emailSent = false;
        let emailError = null;
        try {
          await sendCustomerVariant({ ...order, pickup: newPickup }, orderId, 'rescheduled');
          emailSent = true;
        } catch (error) {
          emailError = error.message;
        }

        res.json({ success: true, emailSent, emailError, overbooked: newPickup.overbooked });
      } catch (error) {
        console.error('❌ [Pickup] Error reprogramando:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Reenviar ticket al cliente
    app.post('/api/pickup/orders/:orderId/resend', async (req, res) => {
      try {
        const { orderId } = req.params;
        const snap = await getDoc(doc(db, 'orders', orderId));
        if (!snap.exists()) return res.status(404).json({ error: 'Orden no encontrada' });
        const order = snap.data();
        if (order.fulfillmentType !== 'pickup') {
          return res.status(400).json({ error: 'La orden no es de pickup' });
        }
        const via = await sendCustomerVariant(order, orderId, 'ticket');
        res.json({ success: true, via });
      } catch (error) {
        console.error('❌ [Pickup] Error reenviando ticket:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  return { registerRoutes, createPickupRecord, sendPickupOrderEmails };
};
