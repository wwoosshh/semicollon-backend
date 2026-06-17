import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { BoardService } from "./board.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/token.service";
import type { CreatePostDto, CreateCommentDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("posts")
export class BoardController {
  constructor(private readonly svc: BoardService) {}

  @Get()
  list(@Query("spaceId") spaceId?: string) {
    return this.svc.list(spaceId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.svc.create(user, dto);
  }

  @Post(":id/comments")
  comment(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: CreateCommentDto) {
    return this.svc.addComment(user, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(user, id);
  }
}
