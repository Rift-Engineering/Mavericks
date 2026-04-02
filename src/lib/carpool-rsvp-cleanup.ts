import type { Prisma } from "@prisma/client";

/** Removes carpool group links and calculated fields before changing an RSVP’s transport role. */
export async function clearCarpoolAssignmentsForRsvp(
  tx: Prisma.TransactionClient,
  rsvpId: string,
) {
  const rsvp = await tx.rSVP.findUnique({
    where: { id: rsvpId },
    select: {
      id: true,
      carpoolGroupId: true,
      driverOfGroup: { select: { id: true } },
    },
  });
  if (!rsvp) return;

  if (rsvp.driverOfGroup) {
    const gid = rsvp.driverOfGroup.id;
    await tx.rSVP.updateMany({
      where: { carpoolGroupId: gid },
      data: {
        carpoolGroupId: null,
        transitToPickupMin: null,
        calcDepartureTime: null,
        travelTimeMin: null,
      },
    });
    await tx.carpoolGroup.delete({ where: { id: gid } });
    return;
  }

  if (rsvp.carpoolGroupId) {
    await tx.rSVP.update({
      where: { id: rsvpId },
      data: {
        carpoolGroupId: null,
        transitToPickupMin: null,
        calcDepartureTime: null,
        travelTimeMin: null,
      },
    });
  }
}
