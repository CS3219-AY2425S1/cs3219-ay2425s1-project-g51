import { IsString } from 'class-validator';

export class WebSocketKeyDto {
  @IsString()
  matchId: string;

  @IsString()
  username: string;
}
