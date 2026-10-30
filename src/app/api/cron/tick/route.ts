import { NextResponse } from "next/server";
import { alarm } from "@/lib/alarm";
import { cronAuthorized, tick } from "@/lib/cron";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await tick());
  } catch (e) {
    await alarm("przypomnienia i zwalnianie terminów (cron)", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
