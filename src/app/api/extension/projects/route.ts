import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") || req.nextUrl.searchParams.get("token");
  const profile = db.getProfile();

  if (!token || token !== profile.api_token) {
    return NextResponse.json({ error: "Unauthorized: Invalid API token" }, { status: 401 });
  }

  const emailParam = req.nextUrl.searchParams.get("email")?.toLowerCase();
  const allProjects = db.getProjects();

  let matched = allProjects;
  if (emailParam) {
    matched = allProjects.filter((p) => p.client_email.toLowerCase() === emailParam);
    if (matched.length === 0) {
      matched = allProjects; // fallback
    }
  }

  return NextResponse.json({
    projects: matched.map((p) => ({
      id: p.id,
      title: p.title,
      client_name: p.client_name,
      client_email: p.client_email,
      client_company: p.client_company,
      hourly_rate: p.hourly_rate,
      revisions_used: p.revisions_used,
      allowed_revisions: p.allowed_revisions,
    })),
  });
}
