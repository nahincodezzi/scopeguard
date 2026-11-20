import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { type, corrected_verdict, note } = body;

    const updated = db.updateScopeCheckFeedback(params.id, {
      type: type || "wrong",
      corrected_verdict,
      note,
    });

    if (!updated) {
      return NextResponse.json({ error: "Scope check not found" }, { status: 404 });
    }

    return NextResponse.json({ scopeCheck: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
