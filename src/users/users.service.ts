import { Injectable } from '@nestjs/common';

export type User = {
  userId: number;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      email: 'malo@gmail.com',
      password: 'qwerty12345',
    },
    {
      userId: 2,
      email: 'tom@gmail.com',
      password: 'qwerty12345',
    },
  ];

  async findOne(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }
}
