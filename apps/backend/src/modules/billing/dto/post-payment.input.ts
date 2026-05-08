import { Field, Float, InputType } from '@nestjs/graphql';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

@InputType()
export class PostPaymentInput {
  @Field()
  @IsUUID()
  invoiceId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field()
  @IsString()
  method: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @Field()
  @IsDateString()
  receivedAt: string;

  @Field()
  @IsString()
  idempotencyKey: string;
}
