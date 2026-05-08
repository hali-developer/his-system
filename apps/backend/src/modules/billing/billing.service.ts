import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RequestContext } from '../../common/auth/request-context';
import { BillingRepository } from './billing.repository';
import { GenerateInvoiceInput } from './dto/generate-invoice.input';
import { PostPaymentInput } from './dto/post-payment.input';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: BillingRepository,
  ) {}

  async generateInvoice(input: GenerateInvoiceInput, ctx: RequestContext) {
    if (!input.lines.length) {
      throw new BadRequestException('At least one invoice line is required');
    }

    const subtotal = input.lines.reduce((acc, line) => acc + line.qty * line.unitPrice, 0);
    const taxAmount = 0;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const invoiceNo = `INV-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          appointmentId: input.appointmentId,
          patientId: input.patientId,
          invoiceNo,
          status: 'POSTED',
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          currency: input.currency || 'USD',
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
          lines: {
            create: input.lines.map((line) => ({
              itemCode: line.itemCode,
              description: line.description,
              qty: line.qty,
              unitPrice: line.unitPrice,
              lineTotal: line.qty * line.unitPrice,
            })),
          },
        },
      });

      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          entryNo: `JE-${Date.now()}`,
          status: 'POSTED',
          entryDate: new Date(),
          memo: `Invoice ${invoice.invoiceNo}`,
          sourceType: 'INVOICE',
          sourceId: invoice.id,
          createdBy: ctx.userId,
          postedAt: new Date(),
        },
      });

      await tx.journalItem.createMany({
        data: [
          {
            journalEntryId: journalEntry.id,
            accountId: 'AR_ACCOUNT',
            debit: totalAmount,
            credit: 0,
            memo: 'Accounts receivable',
          },
          {
            journalEntryId: journalEntry.id,
            accountId: 'REVENUE_ACCOUNT',
            debit: 0,
            credit: totalAmount,
            memo: 'Service revenue',
          },
        ],
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          actorUserId: ctx.userId,
          action: 'INVOICE_GENERATE',
          entityType: 'INVOICE',
          entityId: invoice.id,
          afterJson: invoice,
          traceId: ctx.traceId,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          aggregateType: 'INVOICE',
          aggregateId: invoice.id,
          eventName: 'invoice.posted',
          eventVersion: '1.0',
          payload: { invoiceId: invoice.id, totalAmount },
        },
      });

      return invoice;
    });
  }

  async postPayment(input: PostPaymentInput, ctx: RequestContext) {
    const operation = 'POST_PAYMENT';
    const existing = await this.repo.findIdempotencyLog(
      ctx.organizationId,
      ctx.branchId,
      input.idempotencyKey,
      operation,
    );
    if (existing?.responseJson) {
      return existing.responseJson;
    }

    const invoice = await this.repo.getInvoiceById(
      ctx.organizationId,
      ctx.branchId,
      input.invoiceId,
    );
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(invoice.totalAmount) - paidSoFar;
    if (input.amount > remaining) {
      throw new BadRequestException('Payment exceeds remaining balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          invoiceId: input.invoiceId,
          amount: input.amount,
          method: input.method,
          referenceNo: input.referenceNo,
          receivedAt: new Date(input.receivedAt),
          createdBy: ctx.userId,
        },
      });

      const newPaid = paidSoFar + input.amount;
      const nextStatus =
        newPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: nextStatus,
          updatedBy: ctx.userId,
        },
      });

      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          entryNo: `JE-${Date.now()}`,
          status: 'POSTED',
          entryDate: new Date(),
          memo: `Payment for ${invoice.invoiceNo}`,
          sourceType: 'PAYMENT',
          sourceId: payment.id,
          createdBy: ctx.userId,
          postedAt: new Date(),
        },
      });

      await tx.journalItem.createMany({
        data: [
          {
            journalEntryId: journalEntry.id,
            accountId: 'CASH_ACCOUNT',
            debit: input.amount,
            credit: 0,
            memo: 'Cash received',
          },
          {
            journalEntryId: journalEntry.id,
            accountId: 'AR_ACCOUNT',
            debit: 0,
            credit: input.amount,
            memo: 'Accounts receivable settled',
          },
        ],
      });

      const response = {
        paymentId: payment.id,
        invoiceId: invoice.id,
        invoiceStatus: nextStatus,
      };

      await tx.idempotencyLog.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          key: input.idempotencyKey,
          operation,
          requestHash: `${input.invoiceId}:${input.amount}:${input.method}`,
          responseJson: response,
          statusCode: 200,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          actorUserId: ctx.userId,
          action: 'PAYMENT_POST',
          entityType: 'PAYMENT',
          entityId: payment.id,
          afterJson: payment,
          traceId: ctx.traceId,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          aggregateType: 'PAYMENT',
          aggregateId: payment.id,
          eventName: 'payment.received',
          eventVersion: '1.0',
          payload: {
            paymentId: payment.id,
            invoiceId: invoice.id,
            amount: input.amount,
          },
        },
      });

      return response;
    });
  }
}
