import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  const profile = db.getProfile();
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = db.updateProfile(body);
    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
