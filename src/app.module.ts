import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { SpacesModule } from './spaces/spaces.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthModule, MembersModule, SpacesModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
