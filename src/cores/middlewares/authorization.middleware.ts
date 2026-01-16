import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const regexJwtToken = /jwtToken=([^;]+)/;
    const regexUserId = /userId=([^;]+)/;
    if (req.headers.cookie && req.headers.cookie.includes('jwtToken') && req.headers.cookie.includes("userId")) {
      req.headers.authorization =
        'bearer ' + req.headers.cookie.match(regexJwtToken)[1];
      req.headers.userId = req.headers.cookie.match(regexUserId)[1]
    }
    next();
  }
}
