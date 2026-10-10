import QRCode from "qrcode";

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const png = await QRCode.toBuffer(`TIRENDERS:${code}`, { width: 360, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}
