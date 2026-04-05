import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, Min, Max, MaxLength, Matches } from 'class-validator';

// ─── Queue / Songs ───

export class AddSongDto {
  @IsString() spotifyId!: string;
  @IsString() spotifyUri!: string;
  @IsString() @MaxLength(200) title!: string;
  @IsString() @MaxLength(200) artist!: string;
  @IsOptional() @IsString() albumArt?: string;
  @IsOptional() @IsString() @MaxLength(100) dedication?: string;
  @IsOptional() @IsString() @MaxLength(50) groupName?: string;
}

// ─── Events ───

export class CreateEventDto {
  @IsString() @MaxLength(100) name!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() @MaxLength(4) @Matches(/^[0-9]*$/) adminPin?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(20) maxSongsPerUser?: number;
  @IsOptional() @IsBoolean() allowExplicit?: boolean;
}

export class UpdateEventDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(20) maxSongsPerUser?: number;
  @IsOptional() @IsBoolean() allowExplicit?: boolean;
  @IsOptional() @IsString() @MaxLength(4) adminPin?: string;
  @IsOptional() @IsBoolean() enableDedications?: boolean;
  @IsOptional() @IsBoolean() enableGroupNames?: boolean;
  @IsOptional() @IsBoolean() enableReactions?: boolean;
}

// ─── Venues ───

export class CreateVenueDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @MaxLength(50) @Matches(/^[a-z0-9-]+$/) slug!: string;
  @IsOptional() @IsString() @MaxLength(4) @Matches(/^[0-9]*$/) adminPin?: string;
}

export class UpdateVenueDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(4) adminPin?: string;
  @IsOptional() @IsString() backgroundImage?: string;
  @IsOptional() @IsBoolean() enableDedications?: boolean;
  @IsOptional() @IsBoolean() enableGroupNames?: boolean;
  @IsOptional() @IsBoolean() enableReactions?: boolean;
  @IsOptional() @IsBoolean() enableDJBattle?: boolean;
}

// ─── Battle ───

export class CreateBattleDto {
  @IsString() @MaxLength(50) djAName!: string;
  @IsString() @MaxLength(50) djBName!: string;
  @IsOptional() @IsNumber() @Min(1) @Max(10) rounds?: number;
}

export class SetBattleSongDto {
  @IsString() @Matches(/^(a|b)$/) side!: 'a' | 'b';
  @IsString() spotifyUri!: string;
  @IsString() @MaxLength(200) title!: string;
  @IsString() @MaxLength(200) artist!: string;
}

export class BattleVoteDto {
  @IsString() @Matches(/^(a|b)$/) side!: 'a' | 'b';
}
