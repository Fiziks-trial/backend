import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
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

        const pool = new Pool({
          connectionString: databaseUrl,
          ssl: {
            rejectUnauthorized: false, // REQUIRED for Supabase
          },
        });

        return drizzle(pool);
      },
    },
  ],
  exports: ['DB'],
})
export class DrizzleModule {}
