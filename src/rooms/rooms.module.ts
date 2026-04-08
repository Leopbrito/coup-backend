import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  providers: [RoomsService, RoomsGateway],
  controllers: [RoomsController]
})
export class RoomsModule {}
