import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { parseSOWText } from "@/lib/ai-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = db.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { raw_text, file_name } = body;

    if (!raw_text) {
      return NextResponse.json({ error: "No SOW text provided" }, { status: 400 });
    }

    const parsedContractData = parseSOWText(raw_text);

    const contract = db.saveContract(params.id, {
      ...parsedContractData,
      file_name: file_name || "Uploaded_SOW.txt",
    });

    return NextResponse.json({
      contract,
      project: db.getProject(params.id),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
