import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/chat.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() dto: ChatMessageDto) {
    const result = await this.aiService.chat(
      dto.message,
      dto.sessionId || 'default',
      dto.action,
    );
    return result;
  }
}
