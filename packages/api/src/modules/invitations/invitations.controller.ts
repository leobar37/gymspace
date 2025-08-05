import { Controller, Post, Get, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, AcceptInvitationDto } from './dto';
import { Allow, Public, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Allow(PERMISSIONS.COLLABORATORS_CREATE)
  @ApiBearerAuth()
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Create invitation for collaborator' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createInvitation(@Body() dto: CreateInvitationDto, @AppCtxt() ctx: RequestContext) {
    return await this.invitationsService.createInvitation(dto, ctx.getUserId());
  }

  @Post(':token/accept')
  @Public()
  @ApiOperation({ summary: 'Accept invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async acceptInvitation(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    return await this.invitationsService.acceptInvitation(token, dto);
  }

  @Get()
  @Allow(PERMISSIONS.COLLABORATORS_READ)
  @ApiBearerAuth()
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Get pending invitations for gym' })
  @ApiResponse({ status: 200, description: 'List of pending invitations' })
  async getGymInvitations(@Query('gymId') gymId: string, @AppCtxt() ctx: RequestContext) {
    return await this.invitationsService.getGymInvitations(gymId, ctx.getUserId());
  }

  @Put(':id/cancel')
  @Allow(PERMISSIONS.COLLABORATORS_UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel pending invitation' })
  @ApiResponse({ status: 200, description: 'Invitation cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this invitation' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async cancelInvitation(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.invitationsService.cancelInvitation(id, ctx.getUserId());
  }
}
