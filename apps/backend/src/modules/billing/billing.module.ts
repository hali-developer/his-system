import { Module } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { BillingResolver } from './billing.resolver';
import { BillingService } from './billing.service';

@Module({
  providers: [BillingResolver, BillingService, BillingRepository],
  exports: [BillingService],
})
export class BillingModule {}
