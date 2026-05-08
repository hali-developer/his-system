import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentContext } from '../../common/auth/request-context.decorator';
import { GqlAuthGuard } from '../../common/auth/gql-auth.guard';
import { RequestContext } from '../../common/auth/request-context';
import { BillingService } from './billing.service';
import { GenerateInvoiceInput } from './dto/generate-invoice.input';
import { PostPaymentInput } from './dto/post-payment.input';

@Resolver()
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async billingGenerateInvoice(
    @Args('input') input: GenerateInvoiceInput,
    @CurrentContext() ctx: RequestContext,
  ): Promise<string> {
    const invoice = await this.billingService.generateInvoice(input, ctx);
    return invoice.id;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async billingPostPayment(
    @Args('input') input: PostPaymentInput,
    @CurrentContext() ctx: RequestContext,
  ): Promise<string> {
    const payment = await this.billingService.postPayment(input, ctx);
    return String(payment.paymentId);
  }
}
