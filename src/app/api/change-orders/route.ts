import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const changeOrders = db.getChangeOrders(projectId || undefined);
  return NextResponse.json({ changeOrders });
}

export async function POST(req: NextRequest) {
  try {
    const profile = db.getProfile();
    // Bug B5: Block sending a change order if agency name is not set
    if (!profile.agency_name || !profile.agency_name.trim()) {
      return NextResponse.json(
        { error: "Agency name is required before creating a change order. Please update your profile in Settings." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      project_id,
      scope_check_id,
      title,
      line_items,
      total_hours,
      total_fee,
      hourly_rate,
      timeline_impact,
      client_request_quote,
      agreement_clause_quote,
      agreement_sow_link,
      payment_terms = "full",
      expiry_days = 14,
      email_client_copy = false,
      apply_revision = false,
    } = body;

    const project = db.getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create change order
    const changeOrder = db.createChangeOrder({
      project_id,
      scope_check_id,
      title: title || `Additional work — ${project.title}`,
      line_items: line_items || [],
      total_hours: Number(total_hours) || 0,
      total_fee: Number(total_fee) || 0,
      hourly_rate: Number(hourly_rate) || project.hourly_rate || 65,
      timeline_impact: timeline_impact || "no schedule change",
      client_request_quote: client_request_quote || "",
      agreement_clause_quote: agreement_clause_quote || "",
      agreement_sow_link: agreement_sow_link,
      payment_terms,
      expiry_days,
    });

    // If apply_revision is true, increment revisions_used
    if (apply_revision) {
      db.updateProject(project.id, {
        revisions_used: (project.revisions_used || 0) + 1,
      });
    }

    // Build real approval link
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const approvalUrl = `${protocol}://${host}/approve/${changeOrder.token}`;

    db.addNotification({
      type: "created",
      title: `Change order ${changeOrder.number} created`,
      message: `${changeOrder.title} for ${project.client_company || project.client_name} ($${changeOrder.total_fee.toLocaleString()}) created.`,
      change_order_id: changeOrder.id,
    });

    return NextResponse.json({
      changeOrder,
      approvalUrl,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
