import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentContext } from '../../common/auth/request-context.decorator';
import { GqlAuthGuard } from '../../common/auth/gql-auth.guard';
import { RequestContext } from '../../common/auth/request-context';
import { RegisterPatientInput } from './dto/register-patient.input';
import { PatientsService } from './patients.service';

@Resolver()
export class PatientsResolver {
  constructor(private readonly patientsService: PatientsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async patientRegister(
    @Args('input') input: RegisterPatientInput,
    @CurrentContext() ctx: RequestContext,
  ): Promise<string> {
    const patient = await this.patientsService.register(input, ctx);
    return patient.id;
  }
}
