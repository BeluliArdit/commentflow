import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimit(`register:${ip}`, 5, 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({ email, password: hashed, name }).returning();

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
