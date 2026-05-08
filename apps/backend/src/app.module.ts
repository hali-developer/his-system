import { Module } from '@nestjs/common';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [PatientsModule, AppointmentsModule, BillingModule],
  providers: [PrismaService],
})
export class AppModule {}
