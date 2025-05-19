import { ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';

import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk-auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/roles/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/user-id/user-id.decorator';
import { FindReportDto } from './dto/find-report.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(
    @UserId() userId: string,
    @Body() createActivityDto: CreateActivityDto,
  ) {
    return this.activitiesService.create(userId, createActivityDto);
  }

  @UseGuards(ClerkAuthGuard)
  @Get()
  findAll() {
    return this.activitiesService.findAll();
  }

  @UseGuards(ClerkAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @UseGuards(ClerkAuthGuard)
  @Get(':id/leaderboard')
  findLeaderboard(@Param('id') id: string) {
    return this.activitiesService.findLeaderboard(id);
  }

  @UseGuards(ClerkAuthGuard)
  @Get(':id/report')
  findReport(@Param('id') id: string, @Query() query: FindReportDto) {
    const { fromDate, toDate } = query;

    if (fromDate > toDate) {
      throw new BadRequestException(`fromDate cannot be greater than toDate`);
    }
    if (toDate > new Date()) {
      throw new BadRequestException(`toDate cannot be in the future`);
    }

    return this.activitiesService.findReport(id, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(userId, id, updateActivityDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.activitiesService.remove(userId, id);
  }
}
