import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const session = await requireSession();
    const token = randomBytes(32).toString("hex");

    await db.update(users)
      .set({ extensionToken: token, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET(req: Request) {
  const token = req.headers.get("x-extension-token");
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const { success } = rateLimit(`ext:${token}`, 30, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.extensionToken, token));

  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
