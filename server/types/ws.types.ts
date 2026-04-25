import WebSocket from "ws";

export type ExtendedWebSocket = WebSocket & { userId?: string };

export type OnlineUserMap = Map<string, ExtendedWebSocket>;
