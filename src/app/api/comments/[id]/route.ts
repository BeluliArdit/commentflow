import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await req.json();

    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, params.id), eq(comments.userId, session.user.id)));

    if (!comment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status) updateData.status = body.status;
    if (body.generatedText) updateData.generatedText = body.generatedText;

    const [updated] = await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}
