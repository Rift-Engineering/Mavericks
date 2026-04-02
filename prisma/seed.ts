import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

function hash(p: string) {
  return hashSync(p, 12);
}

async function main() {
  const password = hash("mavericks123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@mavericks.com" },
    update: {},
    create: {
      email: "admin@mavericks.com",
      name: "Admin Maverick",
      passwordHash: password,
      role: "ADMIN",
    },
  });

  const players = [
    { email: "yuki.tanaka@mavericks.com", name: "Yuki Tanaka" },
    { email: "kenji.sato@mavericks.com", name: "Kenji Sato" },
    { email: "haruka.watanabe@mavericks.com", name: "Haruka Watanabe" },
    { email: "takeshi.nakamura@mavericks.com", name: "Takeshi Nakamura" },
    { email: "mei.suzuki@mavericks.com", name: "Mei Suzuki" },
    { email: "ryo.kobayashi@mavericks.com", name: "Ryo Kobayashi" },
  ];

  const userRecords = [admin];
  for (const p of players) {
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        passwordHash: password,
        role: "PLAYER",
      },
    });
    userRecords.push(u);
  }

  const now = new Date();
  const inDays = (n: number) => new Date(now.getTime() + n * 86400000);

  const session1 = await prisma.session.upsert({
    where: { id: "seed-session-1" },
    update: {},
    create: {
      id: "seed-session-1",
      name: "Weekly training — Yoyogi",
      date: inDays(5),
      locationName: "Yoyogi Park Field",
      locationLat: 35.6695,
      locationLng: 139.7024,
      rsvpDeadline: inDays(4),
      status: "OPEN",
    },
  });

  const session2 = await prisma.session.upsert({
    where: { id: "seed-session-2" },
    update: {},
    create: {
      id: "seed-session-2",
      name: "Throwing practice — Komazawa",
      date: inDays(12),
      locationName: "Komazawa Olympic Park",
      locationLat: 35.6254,
      locationLng: 139.6533,
      rsvpDeadline: inDays(10),
      status: "OPEN",
    },
  });

  // Yuki: driving, Shinjuku station
  await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: userRecords[1].id, sessionId: session1.id },
    },
    update: {},
    create: {
      userId: userRecords[1].id,
      sessionId: session1.id,
      attending: true,
      needsCarpool: false,
      isDriver: true,
      pickupStation: "Shinjuku Station",
      pickupLat: 35.6896,
      pickupLng: 139.7006,
      availableSeats: 3,
    },
  });

  // Kenji: needs ride, start Shibuya
  await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: userRecords[2].id, sessionId: session1.id },
    },
    update: {},
    create: {
      userId: userRecords[2].id,
      sessionId: session1.id,
      attending: true,
      needsCarpool: true,
      isDriver: false,
      startLocation: "Shibuya Station",
      startLat: 35.658,
      startLng: 139.7016,
    },
  });

  // Haruka: own way, PT
  await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: userRecords[3].id, sessionId: session1.id },
    },
    update: {},
    create: {
      userId: userRecords[3].id,
      sessionId: session1.id,
      attending: true,
      needsCarpool: false,
      isDriver: false,
      transportMode: "PUBLIC_TRANSPORT",
      startLocation: "Ebisu",
      startLat: 35.6467,
      startLng: 139.7102,
    },
  });

  // Takeshi: not attending
  await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: userRecords[4].id, sessionId: session1.id },
    },
    update: {},
    create: {
      userId: userRecords[4].id,
      sessionId: session1.id,
      attending: false,
      needsCarpool: false,
      isDriver: false,
    },
  });

  // Admin + Mei on session2
  await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: admin.id, sessionId: session2.id },
    },
    update: {},
    create: {
      userId: admin.id,
      sessionId: session2.id,
      attending: true,
      needsCarpool: false,
      isDriver: true,
      pickupStation: "Meguro Station",
      pickupLat: 35.6339,
      pickupLng: 139.7156,
      availableSeats: 2,
    },
  });

  await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: userRecords[5].id, sessionId: session2.id },
    },
    update: {},
    create: {
      userId: userRecords[5].id,
      sessionId: session2.id,
      attending: true,
      needsCarpool: true,
      isDriver: false,
      startLocation: "Gotanda",
      startLat: 35.6264,
      startLng: 139.7233,
    },
  });

  console.log("Seed complete:", { users: userRecords.length, sessions: 2 });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
