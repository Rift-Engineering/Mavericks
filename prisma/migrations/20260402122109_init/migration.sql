-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED', 'OPTIMISED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('DRIVING', 'PUBLIC_TRANSPORT', 'WALKING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT NOT NULL,
    "locationLat" DOUBLE PRECISION NOT NULL,
    "locationLng" DOUBLE PRECISION NOT NULL,
    "rsvpDeadline" TIMESTAMP(3) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RSVP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "attending" BOOLEAN NOT NULL,
    "transportMode" "TransportMode",
    "needsCarpool" BOOLEAN NOT NULL DEFAULT false,
    "isDriver" BOOLEAN NOT NULL DEFAULT false,
    "pickupStation" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "availableSeats" INTEGER,
    "calcDepartureTime" TIMESTAMP(3),
    "calcDriveToVenueMin" INTEGER,
    "startLocation" TEXT,
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "travelTimeMin" INTEGER,
    "transitToPickupMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "carpoolGroupId" TEXT,

    CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarpoolGroup" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "driverRsvpId" TEXT NOT NULL,

    CONSTRAINT "CarpoolGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimisationSnapshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "step1Json" JSONB,
    "step2Json" JSONB,
    "step3Json" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimisationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RSVP_userId_sessionId_key" ON "RSVP"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CarpoolGroup_driverRsvpId_key" ON "CarpoolGroup"("driverRsvpId");

-- CreateIndex
CREATE UNIQUE INDEX "OptimisationSnapshot_sessionId_key" ON "OptimisationSnapshot"("sessionId");

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_carpoolGroupId_fkey" FOREIGN KEY ("carpoolGroupId") REFERENCES "CarpoolGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolGroup" ADD CONSTRAINT "CarpoolGroup_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolGroup" ADD CONSTRAINT "CarpoolGroup_driverRsvpId_fkey" FOREIGN KEY ("driverRsvpId") REFERENCES "RSVP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimisationSnapshot" ADD CONSTRAINT "OptimisationSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
