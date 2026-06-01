import { IsString, IsArray, IsOptional } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsArray()
  @IsOptional()
  history?: { role: 'user' | 'assistant'; content: string }[];

  @IsString()
  @IsOptional()
  action?: string;
}
