import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UserProfileDto } from './dto';
import { AppCtxt } from '~/common/decorators';
import { RequestContext } from '~/common/services/request-context.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves the profile information of the currently authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getProfile(
    @AppCtxt() context: RequestContext,
  ): Promise<UserProfileDto> {
    return this.usersService.getProfile(context);
  }

  /**
   * Update current user profile
   */
  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the profile information of the currently authenticated user. Email cannot be updated through this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateProfile(
    @AppCtxt() context: RequestContext,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(context, updateProfileDto);
  }
}