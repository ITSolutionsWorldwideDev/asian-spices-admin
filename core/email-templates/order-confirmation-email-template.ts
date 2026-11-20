import { pool } from "../db";
import { sendEmail } from "../email";

// Map delivery expectations contextually
const DELIVERY_DAYS_MAP: Record<string, string> = {
  "Standard Shipping": "3 - 5 business days",
  "Express Shipping": "1 - 2 business days",
  "Overnight Shipping": "Next business day",
};

export async function sendOrderConfirmationEmail(orderId: string) {
  try {
    // 1️⃣ Fetch complete payload variables for the email
    const orderQuery = await pool.query(
      `SELECT order_number, customer_email, total_amount, shipping_provider, shipping_city 
       FROM store_orders WHERE id = $1`,
      [orderId],
    );

    if (orderQuery.rowCount === 0)
      return { success: false, error: "Order context missing" };

    const order = orderQuery.rows[0];
    const deliveryWindow =
      DELIVERY_DAYS_MAP[order.shipping_provider] || "3 - 5 business days";

    // 2️⃣ Build modern HTML Email Structure
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 20px; border-radius: 12px;">
        <h2 style="color: #ea580c; text-align: center;">Your Flavorful Journey Begins!</h2>
        <p>Hello,</p>
        <p>Thank you for shopping with <strong>Asian Spices</strong>. We are thrilled to confirm that your payment has been processed and your order is officially locked in.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> ${order.order_number}</p>
          <p style="margin: 0 0 8px 0;"><strong>Amount Paid:</strong> €${Number(order.total_amount).toFixed(2)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Shipping Choice:</strong> ${order.shipping_provider}</p>
          <p style="margin: 0;"><strong>Estimated Delivery:</strong> ${deliveryWindow}</p>
        </div>

        <p>Our team is currently preparing your parcel for selection and dynamic routing. Once your tracking code registers out of the hub for delivery to <strong>${order.shipping_city}</strong>, we'll send a follow-up link immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          © 2026 Asian Spices Online. All rights reserved.<br>
          Need support? Reply directly to this thread or contact us via support@asianspices.online
        </p>
      </div>
    `;

    // 3️⃣ Dispatch
    await sendEmail({
      to: order.customer_email,
      cc: ["cheila.lopes@itsolutionshub2010.com", "ahmed.mehmood@itsolutionshub2010.com", "zraja@itsolutionsworldwide.com", "sdevi@itsolutionsworldwide.com"],
      subject: `Order Confirmed! 🎉 (Ref: ${order.order_number})`,
      html: emailHtml,
      fromAccount: "order",
    });

    return { success: true };
  } catch (error) {
    console.error(
      "Error generating or dispatching order email template:",
      error,
    );
    return { success: false, error };
  }
}
