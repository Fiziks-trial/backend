import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, SearchUsersDto } from './dto';
import { JwtAuthGuard, CurrentUser } from '../../common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  searchUsers(@Query() query: SearchUsersDto) {
    return this.usersService.searchUsers(query.search, query.limit);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findUserById(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(userId, dto);
  }

  @Get('username/:username')
  getProfileByUsername(@Param('username') username: string) {
    return this.usersService.getPublicProfileByUsername(username);
  }

  @Get(':id')
  getProfileById(@Param('id') id: string) {
    return this.usersService.getPublicProfileById(id);
  }
}
