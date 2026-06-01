import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WhatsAppTextBody {
  @IsString()
  body: string;
}

export class WhatsAppInteractiveReply {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class WhatsAppInteractive {
  @IsString()
  type: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppInteractiveReply)
  list_reply?: WhatsAppInteractiveReply;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppInteractiveReply)
  button_reply?: WhatsAppInteractiveReply;
}

export class WhatsAppImage {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsString()
  @IsOptional()
  sha256?: string;
}

export class WhatsAppVideo {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;
}

export class WhatsAppAudio {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;
}

export class WhatsAppDocument {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  filename?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;
}

export class WhatsAppMessageDto {
  @IsString()
  from: string;

  @IsString()
  @IsOptional()
  from_user_id?: string;

  @IsString()
  id: string;

  @IsString()
  timestamp: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTextBody)
  text?: WhatsAppTextBody;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppInteractive)
  interactive?: WhatsAppInteractive;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppImage)
  image?: WhatsAppImage;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppVideo)
  video?: WhatsAppVideo;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppAudio)
  audio?: WhatsAppAudio;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppDocument)
  document?: WhatsAppDocument;

  @IsOptional()
  @IsObject()
  context?: any;

  @IsString()
  type: string;
}

export class WhatsAppStatusDto {
  @IsString()
  id: string;

  @IsString()
  status: string;

  @IsString()
  timestamp: string;

  @IsString()
  recipient_id: string;

  @IsString()
  @IsOptional()
  recipient_user_id?: string;

  @IsOptional()
  @IsObject()
  pricing?: any;

  @IsArray()
  @IsOptional()
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export class WhatsAppContactProfile {
  @IsString()
  name: string;
}

export class WhatsAppContactDto {
  @ValidateNested()
  @Type(() => WhatsAppContactProfile)
  profile: WhatsAppContactProfile;

  @IsString()
  wa_id: string;

  @IsString()
  @IsOptional()
  user_id?: string;
}

export class WhatsAppMetadataDto {
  @IsString()
  display_phone_number: string;

  @IsString()
  phone_number_id: string;
}

export class WhatsAppChangeValueDto {
  @IsString()
  messaging_product: string;

  @IsObject()
  @ValidateNested()
  @Type(() => WhatsAppMetadataDto)
  metadata: WhatsAppMetadataDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppContactDto)
  contacts?: WhatsAppContactDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessageDto)
  messages?: WhatsAppMessageDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppStatusDto)
  statuses?: WhatsAppStatusDto[];
}

export class WhatsAppChangeDto {
  @IsString()
  field: string;

  @IsObject()
  @ValidateNested()
  @Type(() => WhatsAppChangeValueDto)
  value: WhatsAppChangeValueDto;
}

export class WhatsAppEntryDto {
  @IsString()
  id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppChangeDto)
  changes: WhatsAppChangeDto[];
}

export class WhatsAppWebhookDto {
  @IsString()
  object: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppEntryDto)
  entry: WhatsAppEntryDto[];
}