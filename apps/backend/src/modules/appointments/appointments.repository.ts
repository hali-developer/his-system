import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasConflict(
    orgId: string,
    branchId: string,
    providerId: string | undefined,
    startsAt: Date,
    endsAt: Date,
  ) {
    if (!providerId) return false;

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        organizationId: orgId,
        branchId,
        providerId,
        status: { in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
      },
    });

    return Boolean(conflict);
  }

  async createAppointment(tx: any, data: any) {
    return tx.appointment.create({ data });
  }
}
