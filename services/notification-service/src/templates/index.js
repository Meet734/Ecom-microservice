// Simple string templates — no template engine dependency.
// In production you'd use Handlebars or MJML for responsive emails.
// For this project, clean inline HTML is fine and interviewers won't care.

export const orderConfirmationTemplate = ({ orderId, userEmail, items, total, shippingAddress }) => ({
  subject: `Order Confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Order Confirmed! 🎉</h2>
      <p>Hi, your order has been confirmed.</p>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}<br/>
        <strong>Total:</strong> ₹${(total / 100).toFixed(2)}
      </div>

      <h3>Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #333; color: white;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: right;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">${item.name}</td>
              <td style="padding: 8px; text-align: right;">${item.quantity}</td>
              <td style="padding: 8px; text-align: right;">₹${(item.price / 100).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <strong>Shipping to:</strong><br/>
        ${shippingAddress.full_name}<br/>
        ${shippingAddress.line1}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}<br/>
        ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}
      </div>

      <p style="margin-top: 20px; color: #888; font-size: 12px;">
        This is an automated email. Please do not reply.
      </p>
    </div>
  `,
});

export const paymentSuccessTemplate = ({ orderId, amount, paymentId }) => ({
  subject: `Payment Received — ₹${(amount / 100).toFixed(2)}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #27ae60;">Payment Successful ✅</h2>
      <p>We've received your payment successfully.</p>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Order ID:</strong>   #${orderId.slice(0, 8).toUpperCase()}<br/>
        <strong>Payment ID:</strong> ${paymentId}<br/>
        <strong>Amount:</strong>     ₹${(amount / 100).toFixed(2)}
      </div>

      <p>Your order is now being processed and will be shipped soon.</p>
    </div>
  `,
});

export const orderShippedTemplate = ({ orderId, trackingId, estimatedDelivery }) => ({
  subject: `Your Order #${orderId.slice(0, 8).toUpperCase()} has shipped!`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2980b9;">Your Order is on its way 📦</h2>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Order ID:</strong>           #${orderId.slice(0, 8).toUpperCase()}<br/>
        <strong>Tracking ID:</strong>        ${trackingId}<br/>
        <strong>Estimated Delivery:</strong> ${estimatedDelivery}
      </div>
    </div>
  `,
});