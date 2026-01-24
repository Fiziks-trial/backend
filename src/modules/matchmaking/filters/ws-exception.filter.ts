import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { QUEUE_EVENTS, QueueErrorCode } from '../types';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    const error =
      exception instanceof WsException
        ? exception.getError()
        : {
            code: QueueErrorCode.INTERNAL_ERROR,
            message: 'Internal server error',
          };

    client.emit(QUEUE_EVENTS.ERROR, error);
  }
}
