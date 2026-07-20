import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DraftModule } from './draft/draft.module';
import { MatchModule } from './match/match.module';

@Module({
  imports: [DraftModule, MatchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
