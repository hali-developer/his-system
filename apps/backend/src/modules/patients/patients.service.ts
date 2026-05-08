import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RequestContext } from '../../common/auth/request-context';
import { RegisterPatientInput } from './dto/register-patient.input';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PatientsRepository,
  ) {}

  async register(input: RegisterPatientInput, ctx: RequestContext) {
    const dob = new Date(input.dob);
    const duplicate = await this.repo.findPossibleDuplicate(
      ctx.organizationId,
      ctx.branchId,
      input.firstName,
      input.lastName,
      dob,
      input.phone,
    );

    if (duplicate) {
      throw new ConflictException('Possible duplicate patient found');
    }

    return this.prisma.$transaction(async (tx) => {
      const patient = await this.repo.createPatient(tx, {
        organizationId: ctx.organizationId,
        branchId: ctx.branchId,
        mrn: `MRN-${Date.now()}`,
        ...input,
        dob,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          actorUserId: ctx.userId,
          action: 'PATIENT_REGISTER',
          entityType: 'PATIENT',
          entityId: patient.id,
          afterJson: patient,
          traceId: ctx.traceId,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          aggregateType: 'PATIENT',
          aggregateId: patient.id,
          eventName: 'patient.created',
          eventVersion: '1.0',
          payload: { patientId: patient.id, mrn: patient.mrn },
        },
      });

      return patient;
    });
  }
}
