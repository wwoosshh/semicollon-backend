import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/token.service";
import type { SaveTreeDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller()
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post("spaces/:id/files/tree")
  saveTree(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: SaveTreeDto) {
    return this.files.saveTree(user, id, dto.paths ?? []);
  }

  @Get("spaces/:id/files")
  list(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.files.list(user, id);
  }

  @Delete("files/:id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.files.remove(user, id);
  }

  @Get("files/:id/channel")
  channel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.files.ensureFileChannel(user, id);
  }
}
