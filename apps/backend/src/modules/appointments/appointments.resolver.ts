import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentContext } from '../../common/auth/request-context.decorator';
import { GqlAuthGuard } from '../../common/auth/gql-auth.guard';
import { RequestContext } from '../../common/auth/request-context';
import { BookAppointmentInput } from './dto/book-appointment.input';
import { AppointmentsService } from './appointments.service';

@Resolver()
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async appointmentBook(
    @Args('input') input: BookAppointmentInput,
    @CurrentContext() ctx: RequestContext,
  ): Promise<string> {
    const appointment = await this.appointmentsService.book(input, ctx);
    return appointment.id;
  }
}
