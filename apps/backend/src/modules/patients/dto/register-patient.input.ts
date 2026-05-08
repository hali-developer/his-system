import { Field, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

@InputType()
export class RegisterPatientInput {
  @Field()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @Field()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @Field()
  @IsDateString()
  dob: string;

  @Field(() => String)
  @IsEnum(Gender)
  gender: Gender;

  @Field()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}
