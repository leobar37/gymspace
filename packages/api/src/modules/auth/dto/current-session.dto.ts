import { ApiProperty } from '@nestjs/swagger';
import { IUser, IGym, IOrganization, ISubscription, Permission } from '@gymspace/shared';

export class CurrentSessionDto {
  @ApiProperty({
    description: 'Current access token',
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    description: 'Current authenticated user',
    type: 'object',
  })
  user: IUser;

  @ApiProperty({
    description: 'Current selected gym context',
    type: 'object',
    required: false,
  })
  gym?: IGym;

  @ApiProperty({
    description: 'User organization',
    type: 'object',
    required: false,
  })
  organization?: IOrganization;

  @ApiProperty({
    description: 'Organization active subscription',
    type: 'object',
    required: false,
  })
  subscription?: ISubscription;

  @ApiProperty({
    description: 'User permissions in current context',
    type: [String],
  })
  permissions: Permission[];

  @ApiProperty({
    description: 'Whether user is authenticated',
    type: Boolean,
  })
  isAuthenticated: boolean;
}
