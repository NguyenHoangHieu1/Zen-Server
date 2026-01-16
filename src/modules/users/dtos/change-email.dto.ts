import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/modules/auth/dto/create-user.dto';

export class ChangeEmailDto extends PickType(CreateUserDto, ['email']) {}
