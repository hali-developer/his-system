import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getInvoiceById(orgId: string, branchId: string, invoiceId: string) {
    return this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId, branchId },
      include: { payments: true },
    });
  }

  async findIdempotencyLog(orgId: string, branchId: string, key: string, operation: string) {
    return this.prisma.idempotencyLog.findUnique({
      where: {
        organizationId_branchId_key_operation: {
          organizationId: orgId,
          branchId,
          key,
          operation,
        },
      },
    });
  }
}
