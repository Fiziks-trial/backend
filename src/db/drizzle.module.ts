import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DB',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined');
        }

        const client = postgres(databaseUrl);
        return drizzle(client);
      },
    },
  ],
  exports: ['DB'],
})
export class DrizzleModule {}
