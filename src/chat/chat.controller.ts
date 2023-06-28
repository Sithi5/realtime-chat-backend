import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('subscribe/:topic')
  async subscribeToTopic(@Res() res, @Param('topic') topic: string) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    this.chatService.addSubscription(topic, res);

    res.on('close', () => {
      this.chatService.removeSubscription(topic, res);
    });
  }

  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    await this.chatService.sendMessage({
      message: dto.message,
      topic: dto.topic,
      senderName: dto.senderName,
    });
  }
}
