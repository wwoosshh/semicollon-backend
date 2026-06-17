import { Module } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../auth/roles.guard";

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService, RolesGuard],
})
export class SettingsModule {}
