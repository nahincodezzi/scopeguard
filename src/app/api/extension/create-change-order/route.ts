import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "") || req.headers.get("x-api-token");
    const profile = db.getProfile();

    if (!token || token !== profile.api_token) {
      return NextResponse.json({ error: "Unauthorized: Invalid API token" }, { status: 401 });
    }

    if (!profile.agency_name) {
      return NextResponse.json({ error: "Agency name is required" }, { status: 400 });
    }

    const body = await req.json();
    const {
      project_id,
      title,
      line_items,
      total_hours,
      total_fee,
      reply_draft,
    } = body;

    const project = db.getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const changeOrder = db.createChangeOrder({
      project_id,
      title: title || `Additional work — ${project.title}`,
      line_items: line_items || [],
      total_hours: Number(total_hours) || 0,
      total_fee: Number(total_fee) || 0,
      hourly_rate: project.hourly_rate || 65,
      timeline_impact: "adds 1 week",
      client_request_quote: title || "",
      agreement_clause_quote: "Clause §3 Exclusions",
      payment_terms: "full",
      expiry_days: 14,
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const approvalUrl = `${protocol}://${host}/approve/${changeOrder.token}`;

    const finalReply = (reply_draft || "").replace(/\{\{APPROVAL_LINK\}\}/g, approvalUrl);

    return NextResponse.json({
      changeOrder,
      approvalUrl,
      finalReply,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
