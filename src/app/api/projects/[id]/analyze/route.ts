import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { analyzeScopeMessage } from "@/lib/ai-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = db.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const contract = db.getContract(params.id);
    if (!contract) {
      return NextResponse.json(
        { error: "Parse the SOW first. No active contract found for this project." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { message, source = "email", replyTone = "friendly" } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const analysis = analyzeScopeMessage({
      message,
      source,
      replyTone,
      project,
      contract,
    });

    const scopeCheck = db.createScopeCheck({
      project_id: project.id,
      ...analysis,
    });

    return NextResponse.json({ scopeCheck });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
