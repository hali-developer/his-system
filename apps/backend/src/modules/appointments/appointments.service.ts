import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RequestContext } from '../../common/auth/request-context';
import { BookAppointmentInput } from './dto/book-appointment.input';
import { AppointmentsRepository } from './appointments.repository';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: AppointmentsRepository,
  ) {}

  async book(input: BookAppointmentInput, ctx: RequestContext) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be greater than startsAt');
    }

    const hasConflict = await this.repo.hasConflict(
      ctx.organizationId,
      ctx.branchId,
      input.providerId,
      startsAt,
      endsAt,
    );
    if (hasConflict) {
      throw new ConflictException('Provider slot conflict');
    }

    return this.prisma.$transaction(async (tx) => {
      const appointment = await this.repo.createAppointment(tx, {
        organizationId: ctx.organizationId,
        branchId: ctx.branchId,
        patientId: input.patientId,
        providerId: input.providerId,
        startsAt,
        endsAt,
        reason: input.reason,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          actorUserId: ctx.userId,
          action: 'APPOINTMENT_BOOK',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          afterJson: appointment,
          traceId: ctx.traceId,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          aggregateType: 'APPOINTMENT',
          aggregateId: appointment.id,
          eventName: 'appointment.booked',
          eventVersion: '1.0',
          payload: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
          },
        },
      });

      return appointment;
    });
  }
}
