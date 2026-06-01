import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class CreateMedicalHistoryDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsBoolean()
  @IsOptional()
  diabetic?: boolean;

  @IsBoolean()
  @IsOptional()
  hypertension?: boolean;

  @IsBoolean()
  @IsOptional()
  hepatic?: boolean;

  @IsBoolean()
  @IsOptional()
  cardioVascular?: boolean;

  @IsBoolean()
  @IsOptional()
  pregnancy?: boolean;

  @IsInt()
  @IsOptional()
  pregnancyTrimester?: number;

  @IsBoolean()
  @IsOptional()
  thyroid?: boolean;

  @IsBoolean()
  @IsOptional()
  ulcer?: boolean;

  @IsBoolean()
  @IsOptional()
  drugAllergy?: boolean;

  @IsString()
  @IsOptional()
  drugAllergyDetail?: string;

  @IsBoolean()
  @IsOptional()
  bleedingDisorder?: boolean;

  @IsBoolean()
  @IsOptional()
  lactatingMother?: boolean;

  @IsBoolean()
  @IsOptional()
  neural?: boolean;

  @IsBoolean()
  @IsOptional()
  renal?: boolean;

  @IsBoolean()
  @IsOptional()
  previousCovid19?: boolean;

  @IsBoolean()
  @IsOptional()
  hypercholesterolemia?: boolean;

  @IsString()
  @IsOptional()
  otherSpecify?: string;
}

export class UpdateMedicalHistoryDto {
  @IsBoolean()
  @IsOptional()
  diabetic?: boolean;

  @IsBoolean()
  @IsOptional()
  hypertension?: boolean;

  @IsBoolean()
  @IsOptional()
  hepatic?: boolean;

  @IsBoolean()
  @IsOptional()
  cardioVascular?: boolean;

  @IsBoolean()
  @IsOptional()
  pregnancy?: boolean;

  @IsInt()
  @IsOptional()
  pregnancyTrimester?: number;

  @IsBoolean()
  @IsOptional()
  thyroid?: boolean;

  @IsBoolean()
  @IsOptional()
  ulcer?: boolean;

  @IsBoolean()
  @IsOptional()
  drugAllergy?: boolean;

  @IsString()
  @IsOptional()
  drugAllergyDetail?: string;

  @IsBoolean()
  @IsOptional()
  bleedingDisorder?: boolean;

  @IsBoolean()
  @IsOptional()
  lactatingMother?: boolean;

  @IsBoolean()
  @IsOptional()
  neural?: boolean;

  @IsBoolean()
  @IsOptional()
  renal?: boolean;

  @IsBoolean()
  @IsOptional()
  previousCovid19?: boolean;

  @IsBoolean()
  @IsOptional()
  hypercholesterolemia?: boolean;

  @IsString()
  @IsOptional()
  otherSpecify?: string;
}