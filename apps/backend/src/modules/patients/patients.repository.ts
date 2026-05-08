import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPossibleDuplicate(
    orgId: string,
    branchId: string,
    firstName: string,
    lastName: string,
    dob: Date,
    phone: string,
  ) {
    return this.prisma.patient.findFirst({
      where: {
        organizationId: orgId,
        branchId,
        firstName,
        lastName,
        dob,
        phone,
        isDeleted: false,
      },
    });
  }

  async createPatient(tx: any, data: any) {
    return tx.patient.create({ data });
  }
}
