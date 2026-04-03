import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { BarsService } from './bars.service';

@Controller('bars')
export class BarsController {
  constructor(private readonly bars: BarsService) {}

  @Post()
  create(@Body() body: { name: string; slug: string; adminPin?: string }) {
    return this.bars.create(body);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.bars.findBySlug(slug);
  }

  @Get(':id/spotify-status')
  getSpotifyStatus(@Param('id') id: string) {
    return this.bars.getSpotifyStatus(id);
  }

  @Post(':slug/verify-pin')
  verifyPin(@Param('slug') slug: string, @Body() body: { pin: string }) {
    return this.bars.verifyPin(slug, body.pin);
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() body: { name?: string; adminPin?: string }) {
    return this.bars.update(slug, body);
  }
}
