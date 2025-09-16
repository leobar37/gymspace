import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsArray, ValidateNested, IsString, Matches } from 'class-validator';

class TimeSlot {
  @ApiProperty({ example: '06:00', description: 'Opening time in HH:MM format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  open: string;

  @ApiProperty({ example: '12:00', description: 'Closing time in HH:MM format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  close: string;
}

class DaySchedule {
  @ApiProperty({ description: 'Is the gym open this day', example: true })
  isOpen: boolean;

  @ApiProperty({
    description: 'Time slots for the day',
    type: [TimeSlot],
    example: [
      { open: '06:00', close: '12:00' },
      { open: '16:00', close: '21:00' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @IsOptional()
  slots?: TimeSlot[];
}

export class UpdateGymScheduleDto {
  @ApiProperty({ description: 'Monday schedule', type: DaySchedule })
  @ValidateNested()
  @Type(() => DaySchedule)
  @IsOptional()
  monday?: DaySchedule;

  @ApiProperty({ description: 'Tuesday schedule', type: DaySchedule })
  @ValidateNested()
  @Type(() => DaySchedule)
  @IsOptional()
  tuesday?: DaySchedule;

  @ApiProperty({ description: 'Wednesday schedule', type: DaySchedule })
  @ValidateNested()
  @Type(() => DaySchedule)
  @IsOptional()
  wednesday?: DaySchedule;

  @ApiProperty({ description: 'Thursday schedule', type: DaySchedule })
  @ValidateNested()
  @Type(() => DaySchedule)
  @IsOptional()
  thursday?: DaySchedule;

  @ApiProperty({ description: 'Friday schedule', type: DaySchedule })
  @ValidateNested()
  @Type(() => DaySchedule)
  @IsOptional()
  friday?: DaySchedule;

  @ApiProperty({ description: 'Saturday schedule', type: DaySchedule })
  @ValidateNested()
  @Type(() => DaySchedule)
  @IsOptional()
  saturday?: DaySchedule;

  @ApiProperty({ description: 'Sunday schedule', type: DaySchedule })
  @ValidateNested()
  @Type(() => DaySchedule)
  @IsOptional()
  sunday?: DaySchedule;
}
