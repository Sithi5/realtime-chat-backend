import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Kafka, Consumer, Producer, Admin, KafkaMessage } from 'kafkajs';
import { Readable } from 'stream';

@Injectable()
export class ChatService implements OnApplicationShutdown {
  private readonly kafka: Kafka;
  private producer: Producer;
  private kafkaAdmin: Admin;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'chat-service',
      brokers: ['localhost:9092'],
    });
    this.kafkaAdmin = this.kafka.admin();
    this.producer = this.kafka.producer();
    this.connect();
  }

  private async connect() {
    await this.kafkaAdmin.connect();
    await this.producer.connect();
  }

  async topicExists(topicName: string): Promise<boolean> {
    try {
      const topics = await this.kafkaAdmin.listTopics();
      return topics.includes(topicName);
    } catch (error) {
      return false;
    }
  }

  getKafkaMessageStream(topic: string): Readable {
    const stream = new Readable({ objectMode: true });
    stream._read = () => {
      return;
    };
    const consumer = this.kafka.consumer({ groupId: 'chat-consumer' });
    try {
      consumer.connect();
      consumer.subscribe({
        topic: topic,
        fromBeginning: false,
      });
      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          stream.push('Hello');
        },
      });
      stream.on('close', () => {
        consumer.stop().catch(console.error);
      });
    } catch (e) {
      console.log(e);
    }

    return stream;
  }

  async sendMessage(args: {
    topic: string;
    message: string;
    senderName: string;
  }): Promise<void> {
    const { topic, message, senderName } = args;

    if (!(await this.topicExists(topic))) {
      await this.kafkaAdmin.createTopics({
        topics: [{ topic: topic }],
      });
    }
    try {
      await this.producer.send({
        topic: topic,
        messages: [
          {
            value: JSON.stringify({
              message: message,
              senderName: senderName,
              date: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async onApplicationShutdown() {
    await this.producer.disconnect();
  }
}
