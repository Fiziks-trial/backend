import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MatchmakingGateway } from './matchmaking.gateway';
import { MatchmakingService } from './matchmaking.service';
import { UsersModule } from '../users/users.module';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [
    UsersModule,
    SubjectsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MatchmakingGateway, MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
