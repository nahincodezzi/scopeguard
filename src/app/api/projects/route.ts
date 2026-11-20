import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  const projects = db.getProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, client_name, client_email, client_company, hourly_rate, allowed_revisions, revision_scope } = body;

    if (!title || !client_name || !client_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = db.createProject({
      title,
      client_name,
      client_email,
      client_company: client_company || client_name,
      hourly_rate: Number(hourly_rate) || 65,
      rate_source: "default",
      allowed_revisions: Number(allowed_revisions) || 2,
      revision_scope: revision_scope || "home and product page mockups",
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
