import {
  ConnectedSocket, MessageBody, OnGatewayConnection,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { TokenService } from "../auth/token.service";
import { ChatService } from "./chat.service";

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly tokens: TokenService,
    private readonly chat: ChatService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth as { token?: string } | undefined)?.token ??
        client.handshake.headers.authorization?.replace("Bearer ", "");
      if (!raw) throw new Error("no token");
      client.data.user = this.tokens.verifyAccess(raw);
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage("join")
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    const user = client.data.user;
    if (!user || !data?.channelId) {
      return { ok: false };
    }
    await client.join(`channel:${data.channelId}`);
    return { ok: true };
  }

  @SubscribeMessage("message")
  async onMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string; body: string }) {
    const user = client.data.user;
    const body = data?.body?.trim();
    if (!user || !data?.channelId || !body || !(await this.chat.canSend(user, data.channelId))) return;
    const msg = await this.chat.saveMessage(data.channelId, user.sub, body);
    this.server.to(`channel:${data.channelId}`).emit("message", msg);
  }
}
