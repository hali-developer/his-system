import { Field, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class BookAppointmentInput {
  @Field()
  @IsUUID()
  patientId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @Field()
  @IsDateString()
  startsAt: string;

  @Field()
  @IsDateString()
  endsAt: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
