/**
 * Email templates — inline HTML, no external engine dependency.
 *
 * Design choices:
 *  - Inline styles only (email clients strip <style> blocks)
 *  - Max-width 600px (standard email width)
 *  - All prices in paise → converted to ₹ with toFixed(2)
 *  - Short order IDs shown as first 8 chars uppercase
 */

const fmt  = (paise)   => `₹${(paise / 100).toFixed(2)}`;
const oid  = (orderId) => `#${orderId.slice(0, 8).toUpperCase()}`;

// ── Shared layout wrapper ──────────────────────────────────────────────────

const wrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:-0.5px;">🛍 ShopStack</span>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              © ${new Date().getFullYear()} ShopStack &nbsp;·&nbsp; This is an automated email, please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// ── Shared sub-components ──────────────────────────────────────────────────

const infoBox = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:20px 0;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;width:40%;">${label}</td>
        <td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:500;">${value}</td>
      </tr>
    `).join('')}
  </table>
`;

const itemsTable = (items) => `
  <table width="100%" cellpadding="0" cellspacing="0"
         style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
    <tr style="background:#f3f4f6;">
      <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Product</th>
      <th style="padding:10px 16px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Qty</th>
      <th style="padding:10px 16px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Price</th>
    </tr>
    ${items.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding:12px 16px;font-size:14px;color:#111827;">${item.name}</td>
        <td style="padding:12px 16px;font-size:14px;color:#374151;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:500;text-align:right;">${fmt(item.price * item.quantity)}</td>
      </tr>
    `).join('')}
  </table>
`;

const divider = `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">`;

// ── 1. Welcome email — triggered on user.registered ───────────────────────

export const welcomeTemplate = ({ email, name, role }) => {
  const displayName = name?.trim() || email.split('@')[0];
  const roleLabel   = role === 'seller' ? 'Seller' : 'Customer';

  return {
    subject: `Welcome to ShopStack, ${displayName}! 🎉`,
    html: wrap(`
      <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Welcome aboard, ${displayName}! 👋</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
        Your ShopStack <strong style="color:#4f46e5;">${roleLabel}</strong> account is ready.
      </p>

      ${infoBox([
        ['Email',      email],
        ['Account type', roleLabel],
      ])}

      ${role === 'seller' ? `
        <p style="font-size:14px;color:#374151;">As a seller you can:</p>
        <ul style="font-size:14px;color:#374151;padding-left:20px;line-height:2;">
          <li>List and manage your products</li>
          <li>Track your orders</li>
          <li>Monitor inventory levels</li>
        </ul>
      ` : `
        <p style="font-size:14px;color:#374151;">As a customer you can:</p>
        <ul style="font-size:14px;color:#374151;padding-left:20px;line-height:2;">
          <li>Browse thousands of products</li>
          <li>Save delivery addresses</li>
          <li>Track your orders</li>
        </ul>
      `}

      ${divider}
      <p style="font-size:13px;color:#9ca3af;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    `),
  };
};

// ── 2. Order confirmed ─────────────────────────────────────────────────────

export const orderConfirmationTemplate = ({ orderId, userEmail, items, total, shippingAddress }) => ({
  subject: `Order Confirmed — ${oid(orderId)}`,
  html: wrap(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Order Confirmed! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      We've received your order and it's being processed.
    </p>

    ${infoBox([
      ['Order ID', oid(orderId)],
      ['Order Total', fmt(total)],
    ])}

    <h3 style="font-size:14px;font-weight:600;color:#374151;margin:24px 0 0;text-transform:uppercase;letter-spacing:0.05em;">Items Ordered</h3>
    ${itemsTable(items)}

    <h3 style="font-size:14px;font-weight:600;color:#374151;margin:24px 0 0;text-transform:uppercase;letter-spacing:0.05em;">Shipping To</h3>
    ${infoBox([
      ['Name',    shippingAddress.full_name],
      ['Address', `${shippingAddress.line1}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}`],
      ['City',    `${shippingAddress.city}, ${shippingAddress.state} — ${shippingAddress.pincode}`],
    ])}

    <p style="font-size:14px;color:#374151;">
      You'll get another email as soon as your order ships.
    </p>
  `),
});

// ── 3. Order cancelled ─────────────────────────────────────────────────────

export const orderCancelledTemplate = ({ orderId, userEmail, items, total, cancelledReason }) => ({
  subject: `Order Cancelled — ${oid(orderId)}`,
  html: wrap(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Order Cancelled</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Your order ${oid(orderId)} has been cancelled.
      ${cancelledReason ? `Reason: <em>${cancelledReason}</em>` : ''}
    </p>

    ${infoBox([
      ['Order ID',  oid(orderId)],
      ['Refund',    total > 0 ? `${fmt(total)} will be refunded to your original payment method within 5–7 business days.` : 'No charge was made.'],
    ])}

    ${items && items.length > 0 ? `
      <h3 style="font-size:14px;font-weight:600;color:#374151;margin:24px 0 0;text-transform:uppercase;letter-spacing:0.05em;">Cancelled Items</h3>
      ${itemsTable(items)}
    ` : ''}

    <p style="font-size:14px;color:#374151;">
      If you have questions, please contact our support team.
    </p>
  `),
});

// ── 4. Payment successful ──────────────────────────────────────────────────

export const paymentSuccessTemplate = ({ orderId, amount, paymentId }) => ({
  subject: `Payment Received — ${fmt(amount)}`,
  html: wrap(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Payment Successful ✅</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      We've received your payment. Your order is now being processed.
    </p>

    ${infoBox([
      ['Order ID',   oid(orderId)],
      ['Payment ID', paymentId],
      ['Amount Paid', fmt(amount)],
    ])}

    <p style="font-size:14px;color:#374151;">
      You'll receive a shipping confirmation once your order is dispatched.
    </p>
  `),
});

// ── 5. Order shipped ───────────────────────────────────────────────────────

export const orderShippedTemplate = ({ orderId, trackingId, estimatedDelivery }) => ({
  subject: `Your Order ${oid(orderId)} is on its way! 📦`,
  html: wrap(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Your order has shipped! 📦</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Great news — your order is on its way to you.
    </p>

    ${infoBox([
      ['Order ID',           oid(orderId)],
      ['Tracking ID',        trackingId || 'N/A'],
      ['Estimated Delivery', estimatedDelivery || 'Check with carrier'],
    ])}

    <p style="font-size:14px;color:#374151;">
      Use your tracking ID to follow your package's journey.
    </p>
  `),
});
