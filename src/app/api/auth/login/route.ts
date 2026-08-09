import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, signSession, setSessionCookie, DASHBOARD_ROUTES } from "@/lib/auth";
import { checkLoginRateLimit, recordLoginAttempt, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
    }

    const ip = getClientIp(req.headers);
    const identifier = parsed.data.username.toLowerCase().trim();

    const rl = await checkLoginRateLimit(ip, identifier);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "محاولات كثيرة، يرجى المحاولة بعد قليل" },
        { status: 429 }
      );
    }

    const user = await authenticate(parsed.data.username, parsed.data.password);
    await recordLoginAttempt(ip, identifier, !!user);

    if (!user) {
      return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const token = await signSession(user);
    await setSessionCookie(token);

    const redirectTo = user.mustChangePassword ? "/change-password" : DASHBOARD_ROUTES[user.role];
    return NextResponse.json({ ok: true, redirectTo });
  } catch {
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
