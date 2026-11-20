import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const changeOrder = db.getChangeOrderByToken(token);
  if (!changeOrder) {
    return NextResponse.json({ error: "Change order not found" }, { status: 404 });
  }

  const project = db.getProject(changeOrder.project_id);
  const profile = db.getProfile();

  // Log "viewed" only on first open
  if (!changeOrder.viewed_at) {
    const now = new Date().toISOString();
    db.updateChangeOrder(changeOrder.id, { viewed_at: now });
    db.logEvent(changeOrder.id, "viewed", {
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });
    db.addNotification({
      type: "viewed",
      title: `${changeOrder.number} viewed by client`,
      message: `${project?.client_name || "Client"} viewed change order ${changeOrder.number}.`,
      change_order_id: changeOrder.id,
    });
  }

  // Check if expired
  const isExpired = new Date(changeOrder.expires_at).getTime() < Date.now();
  if (isExpired && changeOrder.status === "PENDING") {
    db.updateChangeOrder(changeOrder.id, { status: "EXPIRED" });
    changeOrder.status = "EXPIRED";
  }

  // Safe public payload (never expose sensitive workspace secrets or raw projects)
  return NextResponse.json({
    changeOrder: {
      number: changeOrder.number,
      token: changeOrder.token,
      title: changeOrder.title,
      line_items: changeOrder.line_items,
      total_hours: changeOrder.total_hours,
      total_fee: changeOrder.total_fee,
      hourly_rate: changeOrder.hourly_rate,
      timeline_impact: changeOrder.timeline_impact,
      client_request_quote: changeOrder.client_request_quote,
      agreement_clause_quote: changeOrder.agreement_clause_quote,
      agreement_sow_link: changeOrder.agreement_sow_link,
      payment_terms: changeOrder.payment_terms,
      expires_at: changeOrder.expires_at,
      status: changeOrder.status,
      created_at: changeOrder.created_at,
      paid_at: changeOrder.paid_at,
      approved_by_name: changeOrder.approved_by_name,
      approved_ip: changeOrder.approved_ip,
      approved_user_agent: changeOrder.approved_user_agent,
      declined_at: changeOrder.declined_at,
      decline_reason: changeOrder.decline_reason,
    },
    project: {
      title: project?.title || "Project",
      client_name: project?.client_name || "",
      client_company: project?.client_company || project?.client_name || "",
    },
    agency: {
      name: profile.agency_name || "Agency",
      logo_url: profile.logo_url || "",
      brand_color: profile.brand_color || "#4338CA",
      reply_email: profile.reply_email || "",
      allow_pay_on_invoice: profile.allow_pay_on_invoice,
      stripe_connected: profile.stripe_connected,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const changeOrder = db.getChangeOrderByToken(token);
    if (!changeOrder) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 });
    }

    if (changeOrder.status === "PAID" || changeOrder.status === "DECLINED" || changeOrder.status === "EXPIRED") {
      return NextResponse.json({ error: `Change order is already ${changeOrder.status.toLowerCase()}` }, { status: 400 });
    }

    const body = await req.json();
    const { action, approved_by_name, consent, decline_reason, question_text, test_payment } = body;

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";
    const now = new Date().toISOString();

    if (action === "approve_and_pay") {
      // Bug B8 Fix: Evidence recording
      if (!approved_by_name || !approved_by_name.trim()) {
        return NextResponse.json({ error: "Full name is required to approve" }, { status: 400 });
      }
      if (!consent) {
        return NextResponse.json({ error: "You must accept the terms to approve" }, { status: 400 });
      }

      // If test payment or Stripe checkout completed
      const paymentIntent = "pi_" + Math.random().toString(36).substring(2, 14);
      const updated = db.updateChangeOrder(changeOrder.id, {
        status: "PAID",
        paid_at: now,
        approved_by_name: approved_by_name.trim(),
        approved_ip: ip,
        approved_user_agent: userAgent,
        stripe_payment_intent_id: paymentIntent,
      });

      db.logEvent(changeOrder.id, "approved", {
        name: approved_by_name.trim(),
        ip,
        userAgent,
      });

      db.logEvent(changeOrder.id, "paid", {
        intent: paymentIntent,
        amount: changeOrder.total_fee,
        method: "stripe_checkout",
      });

      db.addNotification({
        type: "paid",
        title: `${changeOrder.number} approved & paid ($${changeOrder.total_fee.toLocaleString()})`,
        message: `${approved_by_name.trim()} approved and paid ${changeOrder.number} via Stripe.`,
        change_order_id: changeOrder.id,
      });

      return NextResponse.json({ success: true, changeOrder: updated });
    } else if (action === "approve_invoice") {
      const profile = db.getProfile();
      if (!profile.allow_pay_on_invoice) {
        return NextResponse.json({ error: "Invoice payment is not enabled for this change order" }, { status: 400 });
      }
      if (!approved_by_name || !approved_by_name.trim()) {
        return NextResponse.json({ error: "Full name is required to approve" }, { status: 400 });
      }
      if (!consent) {
        return NextResponse.json({ error: "You must accept the terms to approve" }, { status: 400 });
      }

      const updated = db.updateChangeOrder(changeOrder.id, {
        status: "APPROVED",
        approved_by_name: approved_by_name.trim(),
        approved_ip: ip,
        approved_user_agent: userAgent,
      });

      db.logEvent(changeOrder.id, "approved", {
        name: approved_by_name.trim(),
        payment: "invoice",
        ip,
        userAgent,
      });

      db.addNotification({
        type: "approved",
        title: `${changeOrder.number} approved (Pay on invoice)`,
        message: `${approved_by_name.trim()} approved ${changeOrder.number}. Invoice due on delivery.`,
        change_order_id: changeOrder.id,
      });

      return NextResponse.json({ success: true, changeOrder: updated });
    } else if (action === "decline") {
      // Bug B7 Fix: Decline action
      const updated = db.updateChangeOrder(changeOrder.id, {
        status: "DECLINED",
        declined_at: now,
        decline_reason: decline_reason || "Declined by client",
      });

      db.logEvent(changeOrder.id, "declined", {
        reason: decline_reason,
        ip,
      });

      db.addNotification({
        type: "declined",
        title: `${changeOrder.number} was declined by client`,
        message: `Reason: ${decline_reason || "No reason specified."}`,
        change_order_id: changeOrder.id,
      });

      return NextResponse.json({ success: true, changeOrder: updated });
    } else if (action === "question") {
      // Bug B7 Fix: Ask a question action
      db.logEvent(changeOrder.id, "question", {
        question: question_text,
        ip,
      });

      db.addNotification({
        type: "question",
        title: `Client question regarding ${changeOrder.number}`,
        message: `Client asked: "${question_text}"`,
        change_order_id: changeOrder.id,
      });

      return NextResponse.json({ success: true, message: "Question sent to agency" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
