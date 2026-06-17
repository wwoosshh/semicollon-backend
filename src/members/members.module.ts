import { Module } from "@nestjs/common";
import { MembersService } from "./members.service";
import { MembersController } from "./members.controller";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../auth/roles.guard";

@Module({
  imports: [AuthModule],
  controllers: [MembersController],
  providers: [MembersService, RolesGuard],
})
export class MembersModule {}
