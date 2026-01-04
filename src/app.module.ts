import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { UsersModule } from './modules/users/users.module';
import { MatchesModule } from './modules/matches/matches.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    SubjectsModule,
    UsersModule,
    MatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
