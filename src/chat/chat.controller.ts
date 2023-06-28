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
    console.log('subscribe topic:', topic);

    const stream = this.chatService.getKafkaMessageStream(topic);
    stream.pipe(res);

    res.on('close', () => {
      stream.unpipe(res);
    });
  }

  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    console.log('sendMessage topic:', dto.topic);
    await this.chatService.sendMessage({
      message: dto.message,
      topic: dto.topic,
      senderName: dto.senderName,
    });
  }
}
