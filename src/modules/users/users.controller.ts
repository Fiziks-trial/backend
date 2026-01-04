import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  SearchUsersDto,
  UserProfile,
  PublicProfile,
  SearchUsersResponse,
  SubjectStatsResponse,
} from './dto';
import { JwtAuthGuard, CurrentUser } from '../../common';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Search users by username */
  @Get()
  searchUsers(@Query() query: SearchUsersDto): Promise<SearchUsersResponse> {
    return this.usersService.searchUsers(query.search, query.limit);
  }

  /** Get current user profile */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  getMyProfile(@CurrentUser('id') userId: string): Promise<UserProfile> {
    return this.usersService.findUserById(userId);
  }

  /** Update current user profile */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserProfile> {
    return this.usersService.updateUser(userId, dto);
  }

  /** Get public profile by username */
  @Get('username/:username')
  getProfileByUsername(
    @Param('username') username: string,
  ): Promise<PublicProfile> {
    return this.usersService.getPublicProfileByUsername(username);
  }

  /** Get public profile by ID */
  @Get(':id')
  getProfileById(@Param('id') id: string): Promise<PublicProfile> {
    return this.usersService.getPublicProfileById(id);
  }

  /** Get user subject stats (ELO, wins, losses per subject) */
  @Get(':id/stats')
  getUserStats(@Param('id') userId: string): Promise<SubjectStatsResponse[]> {
    return this.usersService.getUserSubjectStats(userId);
  }
}
