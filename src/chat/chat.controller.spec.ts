import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let app: INestApplication;
  let chatService: ChatService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [ChatService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    chatService = moduleRef.get<ChatService>(ChatService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /chat', () => {
    it('should send a message to Kafka', () => {
      const message = 'Hello, world!';
      const roomId = 'room1';

      return request(app.getHttpServer())
        .post('/chat')
        .send({ message, roomId })
        .expect(201)
        .expect(() => {
          expect(chatService.sendMessage).toHaveBeenCalledWith(message, roomId);
        });
    });
  });

  describe('GET /chat', () => {
    it('should retrieve messages from Kafka', () => {
      const roomId = 'room1';
      const messages = [
        { id: '1', text: 'Hello' },
        { id: '2', text: 'World' },
      ];

      jest.spyOn(chatService, 'getMessages').mockResolvedValue(messages);

      return request(app.getHttpServer())
        .get(`/chat?roomId=${roomId}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual(messages);
        });
    });
  });
});
