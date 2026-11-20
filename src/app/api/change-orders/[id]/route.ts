import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const changeOrder = db.getChangeOrderById(params.id);
  if (!changeOrder) {
    return NextResponse.json({ error: "Change order not found" }, { status: 404 });
  }

  const project = db.getProject(changeOrder.project_id);
  const events = db.getEvents(changeOrder.id);

  return NextResponse.json({
    changeOrder,
    project,
    events,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const existing = db.getChangeOrderById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 });
    }

    const { action, status, decline_reason } = body;

    let updates: Partial<typeof existing> = {};

    if (action === "mark_paid_manual") {
      updates = {
        status: "PAID",
        paid_at: new Date().toISOString(),
      };
      db.logEvent(existing.id, "paid", { method: "manual" });
      db.addNotification({
        type: "paid",
        title: `${existing.number} marked paid manually`,
        message: `Payment of $${existing.total_fee.toLocaleString()} confirmed manually.`,
        change_order_id: existing.id,
      });
    } else if (action === "withdraw") {
      updates = {
        status: "WITHDRAWN",
      };
      db.logEvent(existing.id, "withdrawn", { by: "agency" });
      db.addNotification({
        type: "withdrawn",
        title: `${existing.number} withdrawn`,
        message: `${existing.number} was withdrawn by agency.`,
        change_order_id: existing.id,
      });
    } else if (action === "resend") {
      updates = {
        reminder_sent_at: new Date().toISOString(),
      };
      db.logEvent(existing.id, "reminded", { type: "resend" });
      db.addNotification({
        type: "reminded",
        title: `Reminder resent for ${existing.number}`,
        message: `Client notification re-dispatched.`,
        change_order_id: existing.id,
      });
    } else if (status) {
      updates = { status };
      if (decline_reason) updates.decline_reason = decline_reason;
    }

    const updated = db.updateChangeOrder(params.id, updates);
    return NextResponse.json({ changeOrder: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
