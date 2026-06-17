import { Module } from "@nestjs/common";
import { SpacesService } from "./spaces.service";
import { SpacesController } from "./spaces.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SpacesController],
  providers: [SpacesService],
})
export class SpacesModule {}
