import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVenueDto, UpdateVenueDto } from '../dto';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: CreateVenueDto, @Req() req: any) {
    return this.venues.create(body, req.user.userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyVenues(@Req() req: any) {
    return this.venues.findByUserId(req.user.userId);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    // Public endpoint — returns sanitized data (no tokens, no PIN)
    return this.venues.findBySlugPublic(slug);
  }

  @Get(':id/spotify-status')
  getSpotifyStatus(@Param('id') id: string) {
    return this.venues.getSpotifyStatus(id);
  }

  @Post(':slug/verify-pin')
  verifyPin(@Param('slug') slug: string, @Body() body: { pin: string }) {
    return this.venues.verifyPin(slug, body.pin);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  async update(@Param('slug') slug: string, @Body() body: UpdateVenueDto, @Req() req: any) {
    await this.venues.assertOwnership(slug, req.user.userId);
    return this.venues.update(slug, body);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('slug') slug: string, @Req() req: any) {
    await this.venues.assertOwnership(slug, req.user.userId);
    return this.venues.delete(slug);
  }
}
