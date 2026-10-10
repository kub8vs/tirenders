// Tworzy stanowiska, konto właściciela i przykładowy kod rabatowy.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const sims = [
  ["bmw-m4", "BMW M4 F82", "STANDARD", "ACTIVE", 1],
  ["dof5-a", "Motion 5DOF #1", "MOTION5", "ACTIVE", 2],
  ["dof5-b", "Motion 5DOF #2", "MOTION5", "ACTIVE", 3],
  ["dof6", "Motion 6DOF", "MOTION6", "ACTIVE", 4],
  ["gt3", "GT3 Cockpit", "GT3", "ACTIVE", 5],
  ["nissan-370z", "Nissan 370Z", "STANDARD", "COMING_SOON", 6],
];
for (const [id, name, priceGroup, status, sortOrder] of sims) {
  await prisma.simulator.upsert({ where: { id }, update: { name, priceGroup, status, sortOrder }, create: { id, name, priceGroup, status, sortOrder } });
}
const email = process.env.SEED_OWNER_EMAIL;
const pw = process.env.SEED_OWNER_PASSWORD;
if (email && pw) {
  const passwordHash = await bcrypt.hash(pw, 10);
  await prisma.user.upsert({ where: { email }, update: { role: "OWNER", passwordHash }, create: { email, name: "Właściciel", role: "OWNER", passwordHash } });
  console.log("Konto właściciela:", email);
}
await prisma.discountCode.upsert({ where: { code: "OTWARCIE15" }, update: {}, create: { code: "OTWARCIE15", percent: 15, maxUses: 200 } });
console.log("Seed OK");
await prisma.$disconnect();
