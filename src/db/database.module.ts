import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDb, DB_TOKEN } from "./database";

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createDb(config.get<string>("DATABASE_URL") ?? ""),
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
