import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();

    // TEMP: simulate auth (replace later)
    req.user = { id: 'test', roles: ['admin'] };

    return true;
  }
}
