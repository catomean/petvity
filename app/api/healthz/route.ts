import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getInstance } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public deploy/uptime healthcheck. (/api/health is the pet health-data API
 * and is auth-gated — this endpoint exists so monitors and the deploy
 * pipeline have something honest to probe.)
 */
export async function GET() {
  try {
    await getInstance().execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: true });
  } catch {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
}
