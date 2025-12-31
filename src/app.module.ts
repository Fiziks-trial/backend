import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubjectsModule } from './modules/subjects/subjects.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, SubjectsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
