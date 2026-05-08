import { Module } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsResolver } from './appointments.resolver';
import { AppointmentsService } from './appointments.service';

@Module({
  providers: [AppointmentsResolver, AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
