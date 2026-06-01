import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { Role } from '@prisma/client';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone must be a valid 10-digit Indian mobile number' })
  @IsOptional()
  phone?: string;
}