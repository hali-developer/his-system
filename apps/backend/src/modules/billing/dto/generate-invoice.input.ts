import { Field, Float, InputType } from '@nestjs/graphql';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class GenerateInvoiceLineInput {
  @Field()
  @IsString()
  itemCode: string;

  @Field()
  @IsString()
  description: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  qty: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

@InputType()
export class GenerateInvoiceInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @Field()
  @IsUUID()
  patientId: string;

  @Field(() => [GenerateInvoiceLineInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateInvoiceLineInput)
  lines: GenerateInvoiceLineInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;
}
