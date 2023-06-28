import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Kafka, Consumer, Producer, Admin, KafkaMessage } from 'kafkajs';
import { Readable } from 'stream';

@Injectable()
export class ChatService implements OnApplicationShutdown {
  private readonly kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private kafkaAdmin: Admin;
  private roomSubscriptions: Map<string, any[]>;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'chat-service',
      brokers: ['localhost:9092'],
    });
    this.kafkaAdmin = this.kafka.admin();
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: 'chat-consumer',
      heartbeatInterval: 1000,
    });
    this.roomSubscriptions = new Map<string, any[]>();
    this.connect();
  }

  private async connect() {
    await this.kafkaAdmin.connect();
    await this.producer.connect();
    await this.consumer.connect();
    this.subscribeToChatRooms();
  }

  async subscribeToChatRooms() {
    console.log('subscribeToChatRooms');
    await this.consumer.subscribe({
      topic: /^(chat|chat-.*)$/,
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          partition,
          offset: message.offset,
          value: message.value.toString(),
        });
        const clients = this.roomSubscriptions.get(topic);
        if (clients) {
          const kafkaMessage = JSON.parse(message.value.toString());
          clients.forEach((client) => {
            client.write(`data: ${JSON.stringify(kafkaMessage)}\n\n`);
          });
        }
      },
    });
  }

  async topicExists(topicName: string): Promise<boolean> {
    try {
      const topics = await this.kafkaAdmin.listTopics();
      return topics.includes(topicName);
    } catch (error) {
      return false;
    }
  }

  addSubscription(topic: string, connection: any) {
    let connections = this.roomSubscriptions.get(topic);
    if (!connections) {
      connections = [];
      console.log('addSubscription:', 'topic:', topic);
      this.roomSubscriptions.set(topic, connections);
    }
    connections.push(connection);
  }

  removeSubscription(topic: string, connection: any) {
    const connections = this.roomSubscriptions.get(topic);
    if (connections) {
      const index = connections.indexOf(connection);
      if (index !== -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.roomSubscriptions.delete(topic);
      }
    }
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
      console.log(
        'sendMessage:',
        'topic:',
        topic,
        'message:',
        message,
        'senderName:',
        senderName
      );
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
    await this.consumer.disconnect();
    await this.kafkaAdmin.disconnect();
  }
}
