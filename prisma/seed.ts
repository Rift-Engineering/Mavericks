import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

function hash(p: string) {
  return hashSync(p, 12);
}

/** Home base for each seed user (1–20): consistent start / pickup locations */
const USER_HOMES: {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "PLAYER";
  homeName: string;
  lat: number;
  lng: number;
}[] = [
  {
    id: "seed-user-1",
    email: "admin@mavericks.com",
    name: "Admin Maverick",
    role: "ADMIN",
    homeName: "Meguro Station",
    lat: 35.6339,
    lng: 139.7156,
  },
  {
    id: "seed-user-2",
    email: "yuki.tanaka@mavericks.com",
    name: "Yuki Tanaka",
    role: "PLAYER",
    homeName: "Shinjuku Station",
    lat: 35.6896,
    lng: 139.7006,
  },
  {
    id: "seed-user-3",
    email: "kenji.sato@mavericks.com",
    name: "Kenji Sato",
    role: "PLAYER",
    homeName: "Shibuya Station",
    lat: 35.658,
    lng: 139.7016,
  },
  {
    id: "seed-user-4",
    email: "haruka.watanabe@mavericks.com",
    name: "Haruka Watanabe",
    role: "PLAYER",
    homeName: "Ebisu",
    lat: 35.6467,
    lng: 139.7102,
  },
  {
    id: "seed-user-5",
    email: "takeshi.nakamura@mavericks.com",
    name: "Takeshi Nakamura",
    role: "PLAYER",
    homeName: "Roppongi",
    lat: 35.6627,
    lng: 139.7314,
  },
  {
    id: "seed-user-6",
    email: "mei.suzuki@mavericks.com",
    name: "Mei Suzuki",
    role: "PLAYER",
    homeName: "Ikebukuro Station",
    lat: 35.7289,
    lng: 139.7104,
  },
  {
    id: "seed-user-7",
    email: "ryo.kobayashi@mavericks.com",
    name: "Ryo Kobayashi",
    role: "PLAYER",
    homeName: "Nakameguro",
    lat: 35.6442,
    lng: 139.6982,
  },
  {
    id: "seed-user-8",
    email: "daiki.yamamoto@mavericks.com",
    name: "Daiki Yamamoto",
    role: "PLAYER",
    homeName: "Aoyama-Itchome",
    lat: 35.6652,
    lng: 139.7129,
  },
  {
    id: "seed-user-9",
    email: "sakura.ito@mavericks.com",
    name: "Sakura Ito",
    role: "PLAYER",
    homeName: "Shimokitazawa",
    lat: 35.6618,
    lng: 139.6672,
  },
  {
    id: "seed-user-10",
    email: "hiroshi.fujita@mavericks.com",
    name: "Hiroshi Fujita",
    role: "PLAYER",
    homeName: "Setagaya-Daita",
    lat: 35.6464,
    lng: 139.6532,
  },
  {
    id: "seed-user-11",
    email: "aiko.matsumoto@mavericks.com",
    name: "Aiko Matsumoto",
    role: "PLAYER",
    homeName: "Sangenjaya",
    lat: 35.6436,
    lng: 139.6683,
  },
  {
    id: "seed-user-12",
    email: "kenta.inoue@mavericks.com",
    name: "Kenta Inoue",
    role: "PLAYER",
    homeName: "Jiyugaoka",
    lat: 35.6074,
    lng: 139.6686,
  },
  {
    id: "seed-user-13",
    email: "mio.hayashi@mavericks.com",
    name: "Mio Hayashi",
    role: "PLAYER",
    homeName: "Kichijoji",
    lat: 35.7031,
    lng: 139.5795,
  },
  {
    id: "seed-user-14",
    email: "tomoki.shimizu@mavericks.com",
    name: "Tomoki Shimizu",
    role: "PLAYER",
    homeName: "Akihabara",
    lat: 35.6984,
    lng: 139.7731,
  },
  {
    id: "seed-user-15",
    email: "yui.okada@mavericks.com",
    name: "Yui Okada",
    role: "PLAYER",
    homeName: "Ueno",
    lat: 35.7142,
    lng: 139.7774,
  },
  {
    id: "seed-user-16",
    email: "kazuki.mori@mavericks.com",
    name: "Kazuki Mori",
    role: "PLAYER",
    homeName: "Harajuku",
    lat: 35.6702,
    lng: 139.7027,
  },
  {
    id: "seed-user-17",
    email: "rena.arai@mavericks.com",
    name: "Rena Arai",
    role: "PLAYER",
    homeName: "Hachioji",
    lat: 35.6556,
    lng: 139.3239,
  },
  {
    id: "seed-user-18",
    email: "sho.kondo@mavericks.com",
    name: "Sho Kondo",
    role: "PLAYER",
    homeName: "Mitaka",
    lat: 35.6834,
    lng: 139.5597,
  },
  {
    id: "seed-user-19",
    email: "nana.ishikawa@mavericks.com",
    name: "Nana Ishikawa",
    role: "PLAYER",
    homeName: "Yoga",
    lat: 35.6264,
    lng: 139.6526,
  },
  {
    id: "seed-user-20",
    email: "tsubasa.endo@mavericks.com",
    name: "Tsubasa Endo",
    role: "PLAYER",
    homeName: "Futako-Tamagawa",
    lat: 35.6114,
    lng: 139.6272,
  },
];

type SessionStatus = "OPEN" | "CLOSED" | "OPTIMISED" | "PUBLISHED";

const SESSIONS: {
  id: string;
  name: string;
  locationName: string;
  locationLat: number;
  locationLng: number;
  /** Session kickoff time (can be days in the future). */
  daysFromNow: number;
  /** RSVP deadline: negative = already passed (so session can move past OPEN / be optimised). */
  rsvpDeadlineDaysFromNow: number;
  status: SessionStatus;
  /** 1-based user numbers (1–20) who do NOT attend */
  notAttending: number[];
}[] = [
  {
    id: "seed-session-1",
    name: "Weekly Training — Yoyogi",
    locationName: "Yoyogi Park Second Field",
    locationLat: 35.6681,
    locationLng: 139.6992,
    daysFromNow: 14,
    rsvpDeadlineDaysFromNow: -5,
    status: "CLOSED",
    notAttending: [17, 18, 19, 20],
  },
  {
    id: "seed-session-2",
    name: "Throwing Practice — Komazawa",
    locationName: "Komazawa Olympic Park",
    locationLat: 35.6254,
    locationLng: 139.6533,
    daysFromNow: 21,
    rsvpDeadlineDaysFromNow: -3,
    status: "CLOSED",
    notAttending: [1, 2, 3, 4],
  },
  {
    id: "seed-session-3",
    name: "League Game — Chofu",
    locationName: "Ajinomoto Stadium Athletic Track",
    locationLat: 35.6644,
    locationLng: 139.527,
    daysFromNow: 28,
    rsvpDeadlineDaysFromNow: 5,
    status: "OPEN",
    notAttending: [5, 6, 7, 8],
  },
  {
    id: "seed-session-4",
    name: "Scrimmage — Kasai",
    locationName: "Kasai Rinkai Park Sports Ground",
    locationLat: 35.6411,
    locationLng: 139.8738,
    daysFromNow: 35,
    rsvpDeadlineDaysFromNow: 12,
    status: "PUBLISHED",
    notAttending: [9, 10, 11, 12],
  },
  {
    id: "seed-session-5",
    name: "Sprint Drills — Nishigaoka",
    locationName: "Nishigaoka Athletic Stadium",
    locationLat: 35.7644,
    locationLng: 139.6883,
    daysFromNow: 42,
    rsvpDeadlineDaysFromNow: 19,
    status: "OPTIMISED",
    notAttending: [13, 14, 15, 16],
  },
  {
    id: "seed-session-6",
    name: "End-of-Season — Komaba",
    locationName: "Komaba Athletic Field",
    locationLat: 35.6575,
    locationLng: 139.6817,
    daysFromNow: 49,
    rsvpDeadlineDaysFromNow: 26,
    status: "OPEN",
    notAttending: [17, 18, 19, 20],
  },
];

function sortedAttending(notAttending: Set<number>): number[] {
  const out: number[] = [];
  for (let n = 1; n <= 20; n++) {
    if (!notAttending.has(n)) out.push(n);
  }
  return out;
}

async function main() {
  const password = hash("mavericks123");
  const now = new Date();
  const inDays = (n: number) => new Date(now.getTime() + n * 86400000);

  /** Resolved DB ids (order matches USER_HOMES 1–20). Upsert by email so existing DB rows without seed ids still work. */
  const userIds: string[] = [];

  for (const u of USER_HOMES) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash: password,
        role: u.role,
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        passwordHash: password,
        role: u.role,
      },
    });
    userIds.push(row.id);
  }

  const userIdByNum = (n: number) => userIds[n - 1];

  const sessionRows: { id: string }[] = [];
  for (const s of SESSIONS) {
    const row = await prisma.session.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        date: inDays(s.daysFromNow),
        locationName: s.locationName,
        locationLat: s.locationLat,
        locationLng: s.locationLng,
        rsvpDeadline: inDays(s.rsvpDeadlineDaysFromNow),
        status: s.status,
      },
      create: {
        id: s.id,
        name: s.name,
        date: inDays(s.daysFromNow),
        locationName: s.locationName,
        locationLat: s.locationLat,
        locationLng: s.locationLng,
        rsvpDeadline: inDays(s.rsvpDeadlineDaysFromNow),
        status: s.status,
      },
    });
    sessionRows.push(row);
  }

  const sessionIds = SESSIONS.map((s) => s.id);
  await prisma.rSVP.updateMany({
    where: { sessionId: { in: sessionIds } },
    data: {
      carpoolGroupId: null,
      calcDepartureTime: null,
      calcDriveToVenueMin: null,
      transitToPickupMin: null,
      travelTimeMin: null,
    },
  });
  await prisma.carpoolGroup.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.optimisationSnapshot.deleteMany({ where: { sessionId: { in: sessionIds } } });

  let rsvpCount = 0;
  let seatRot = 0;

  for (const s of SESSIONS) {
    const notSet = new Set(s.notAttending);
    const attending = sortedAttending(notSet);
    // 16 attending: first 4 drivers, next 7 riders, last 5 public transport
    const drivers = attending.slice(0, 4);
    const riders = attending.slice(4, 11);
    const ptUsers = attending.slice(11, 16);

    for (let num = 1; num <= 20; num++) {
      const uid = userIdByNum(num);
      const home = USER_HOMES[num - 1];

      if (notSet.has(num)) {
        await prisma.rSVP.upsert({
          where: { userId_sessionId: { userId: uid, sessionId: s.id } },
          update: {
            attending: false,
            transportMode: null,
            needsCarpool: false,
            isDriver: false,
            pickupStation: null,
            pickupLat: null,
            pickupLng: null,
            availableSeats: null,
            startLocation: null,
            startLat: null,
            startLng: null,
          },
          create: {
            userId: uid,
            sessionId: s.id,
            attending: false,
            needsCarpool: false,
            isDriver: false,
          },
        });
        rsvpCount++;
        continue;
      }

      if (drivers.includes(num)) {
        const seats = 2 + (seatRot++ % 3);
        await prisma.rSVP.upsert({
          where: { userId_sessionId: { userId: uid, sessionId: s.id } },
          update: {
            attending: true,
            transportMode: null,
            needsCarpool: false,
            isDriver: true,
            startLocation: `${home.homeName} (home)`,
            startLat: home.lat,
            startLng: home.lng,
            pickupStation: home.homeName,
            pickupLat: home.lat,
            pickupLng: home.lng,
            availableSeats: seats,
          },
          create: {
            userId: uid,
            sessionId: s.id,
            attending: true,
            needsCarpool: false,
            isDriver: true,
            startLocation: `${home.homeName} (home)`,
            startLat: home.lat,
            startLng: home.lng,
            pickupStation: home.homeName,
            pickupLat: home.lat,
            pickupLng: home.lng,
            availableSeats: seats,
          },
        });
        rsvpCount++;
        continue;
      }

      if (riders.includes(num)) {
        await prisma.rSVP.upsert({
          where: { userId_sessionId: { userId: uid, sessionId: s.id } },
          update: {
            attending: true,
            transportMode: null,
            needsCarpool: true,
            isDriver: false,
            pickupStation: null,
            pickupLat: null,
            pickupLng: null,
            availableSeats: null,
            startLocation: home.homeName,
            startLat: home.lat,
            startLng: home.lng,
          },
          create: {
            userId: uid,
            sessionId: s.id,
            attending: true,
            needsCarpool: true,
            isDriver: false,
            startLocation: home.homeName,
            startLat: home.lat,
            startLng: home.lng,
          },
        });
        rsvpCount++;
        continue;
      }

      if (ptUsers.includes(num)) {
        await prisma.rSVP.upsert({
          where: { userId_sessionId: { userId: uid, sessionId: s.id } },
          update: {
            attending: true,
            transportMode: "PUBLIC_TRANSPORT",
            needsCarpool: false,
            isDriver: false,
            pickupStation: null,
            pickupLat: null,
            pickupLng: null,
            availableSeats: null,
            startLocation: home.homeName,
            startLat: home.lat,
            startLng: home.lng,
          },
          create: {
            userId: uid,
            sessionId: s.id,
            attending: true,
            needsCarpool: false,
            isDriver: false,
            transportMode: "PUBLIC_TRANSPORT",
            startLocation: home.homeName,
            startLat: home.lat,
            startLng: home.lng,
          },
        });
        rsvpCount++;
      }
    }
  }

  console.log("Seed complete:", {
    users: userIds.length,
    sessions: sessionRows.length,
    rsvps: rsvpCount,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
