import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { InterceptorsConsumer } from '@nestjs/core/interceptors';
import { classToPlain, plainToClass, plainToInstance } from 'class-transformer';
import { SerializedUser } from 'src/modules/users/dtos/SerializeUser.dto';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
type ParametersForSerialize = { SerializedDto?: any; DeserializedDto?: any };
export function Serialize(params: ParametersForSerialize) {
  return UseInterceptors(new SerializeInterceptor(params));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dtos?: ParametersForSerialize) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req: Request = context.switchToHttp().getRequest();
    if (this.dtos.DeserializedDto && req.body) {
      req.body = plainToInstance(this.dtos.DeserializedDto, req.body);
    }

    return next.handle().pipe(
      map((data) => {
        if (this.dtos.SerializedDto) {
          const result = plainToInstance(this.dtos.SerializedDto, data, {
            excludeExtraneousValues: true,
          });
          return result;
        } else {
          return data;
        }
      }),
    );
  }
}
