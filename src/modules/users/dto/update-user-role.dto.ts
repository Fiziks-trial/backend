import { IsIn, IsNotEmpty } from 'class-validator';
import { userRoles, UserRole } from '../entities/user.schema';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsIn(userRoles)
  role: UserRole;
}
