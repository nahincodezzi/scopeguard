import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { analyzeScopeMessage } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "") || req.headers.get("x-api-token");
    const profile = db.getProfile();

    if (!token || token !== profile.api_token) {
      return NextResponse.json({ error: "Unauthorized: Invalid API token" }, { status: 401 });
    }

    const body = await req.json();
    const { project_id, message, source = "email" } = body;

    const project = db.getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const contract = db.getContract(project.id);
    if (!contract) {
      return NextResponse.json({ error: "Parse the SOW first for this project." }, { status: 400 });
    }

    const analysis = analyzeScopeMessage({
      message,
      source,
      project,
      contract,
      replyTone: "friendly",
    });

    const check = db.createScopeCheck({
      project_id: project.id,
      ...analysis,
    });

    return NextResponse.json({
      verdict: check.status,
      confidence: check.confidence_score,
      reasoning: check.reasoning,
      line_items: check.line_items,
      estimated_hours: check.estimated_hours,
      suggested_price: check.suggested_price,
      change_order_title: check.change_order_title,
      timeline_impact: check.timeline_impact,
      reply_draft: check.polite_reply_draft,
      check_id: check.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
