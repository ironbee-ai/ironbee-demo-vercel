import { ok, jsonError } from "@/lib/api";
import { verifyPromoToken } from "@/lib/promo-token";

export const dynamic = "force-dynamic";

const PROMO_RATE = 0.15;

// Codes already used, so one code gives one discount.
const redeemed = new Set<string>();

export async function POST(req: Request) {
  const body = (await req.json()) as { code?: unknown; subtotal?: unknown };
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!verifyPromoToken(code)) {
    return jsonError(400, "invalid_code", "This code is not valid.");
  }

  const expiresAt = Number(code.split(".")[1]);
  if (expiresAt < Date.now() / 1000) {
    return jsonError(400, "expired", "This first-visit offer has expired.");
  }
  if (redeemed.has(code)) {
    return jsonError(409, "already_redeemed", "This code was already used.");
  }
  redeemed.add(code);

  const subtotal = Number(body.subtotal);
  const discount = Math.round(subtotal * PROMO_RATE * 100) / 100;
  return ok({ code, discount, total: subtotal - discount });
}
