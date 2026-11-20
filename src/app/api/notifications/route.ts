import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  const notifications = db.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === "mark_all_read") {
      db.markAllNotificationsRead();
    } else if (id) {
      db.markNotificationAsRead(id);
    }

    const notifications = db.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
