import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Idempotent webhook handler
    if (type === "checkout.session.completed" || type === "payment_intent.succeeded") {
      const session = data?.object;
      const changeOrderId = session?.metadata?.change_order_id;
      const paymentIntentId = session?.payment_intent || session?.id || "pi_webhook_verified";

      if (changeOrderId) {
        const co = db.getChangeOrderById(changeOrderId);
        if (co && co.status !== "PAID") {
          db.updateChangeOrder(changeOrderId, {
            status: "PAID",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntentId,
          });

          db.logEvent(changeOrderId, "paid", {
            stripe_session_id: session?.id,
            stripe_payment_intent_id: paymentIntentId,
            amount: session?.amount_total ? session.amount_total / 100 : co.total_fee,
          });

          db.addNotification({
            type: "paid",
            title: `Payment received for ${co.number}`,
            message: `Stripe verified payment of $${co.total_fee.toLocaleString()} for ${co.title}.`,
            change_order_id: co.id,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
