import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
export declare const initSocket: (server: HttpServer) => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
//# sourceMappingURL=socket.d.ts.map