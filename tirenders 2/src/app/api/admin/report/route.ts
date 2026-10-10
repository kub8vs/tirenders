import { NextResponse } from "next/server";
import { staffUser } from "@/lib/auth";
import { buildWorkbook, dayRange, monthRange } from "@/lib/report";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await staffUser("reports"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const u = new URL(req.url);
  const type = u.searchParams.get("type");
  let range, title, file;
  if (type === "month") {
    const m = u.searchParams.get("month") ?? ""; // YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(m)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const [y, mm] = m.split("-").map(Number);
    range = monthRange(y, mm);
    title = `Raport miesięczny ${m}`;
    file = `tirenders-raport-${m}.xlsx`;
  } else {
    const d = u.searchParams.get("date") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    range = dayRange(d);
    title = `Raport dzienny ${d}`;
    file = `tirenders-raport-${d}.xlsx`;
  }
  const { buffer } = await buildWorkbook(range, title);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}
