import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = db.getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const contract = db.getContract(params.id);
  const contractHistory = db.getContractHistory(params.id);
  const scopeChecks = db.getScopeChecks(params.id);
  const changeOrders = db.getChangeOrders(params.id);

  return NextResponse.json({
    project,
    contract,
    contractHistory,
    scopeChecks,
    changeOrders,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = db.updateProject(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
