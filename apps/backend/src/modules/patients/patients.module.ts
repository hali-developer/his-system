import { Module } from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { PatientsResolver } from './patients.resolver';
import { PatientsService } from './patients.service';

@Module({
  providers: [PatientsResolver, PatientsService, PatientsRepository],
  exports: [PatientsService],
})
export class PatientsModule {}
