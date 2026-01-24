# WebSockets and Gateways

## HTTP vs WebSocket

| HTTP | WebSocket |
|------|-----------|
| Request → Response → Connection closes | Connection stays open |
| Client initiates all communication | Both sides can send anytime |
| Good for: CRUD operations | Good for: Real-time features |
| Like sending letters | Like a phone call |

## Why Matchmaking Needs WebSockets

With HTTP, the client would have to poll:
```
Client: "Any match yet?" → Server: "No"
Client: "Any match yet?" → Server: "No"
Client: "Any match yet?" → Server: "Yes!"
```

With WebSocket:
```
Client: "I want to play"
... connection stays open ...
Server: "Match found!" (server initiates)
```

## What is a Gateway?

A Gateway is NestJS's WebSocket handler. Like a Controller but for WebSocket events instead of HTTP routes.

```typescript
// Controller (HTTP)
@Controller('users')
class UsersController {
  @Get()
  getUsers() { }
}

// Gateway (WebSocket)
@WebSocketGateway()
class MatchmakingGateway {
  @SubscribeMessage('queue:join')
  handleJoin() { }
}
```

## Key Decorators

| Decorator | Purpose |
|-----------|---------|
| `@WebSocketGateway()` | Marks class as WebSocket handler |
| `@SubscribeMessage('event')` | Listen for specific event |
| `@ConnectedSocket()` | Get the socket connection |
| `@MessageBody()` | Get the event payload |

## Socket vs Server

```typescript
@WebSocketGateway()
class MyGateway {
  @WebSocketServer()
  server: Server;  // Broadcast to everyone

  @SubscribeMessage('hello')
  handle(@ConnectedSocket() client: Socket) {
    client.emit('hi');      // Send to THIS client only
    this.server.emit('hi'); // Send to ALL clients
  }
}
```

## Connection Lifecycle

```
1. Client connects    → handleConnection() fires
2. Client sends event → @SubscribeMessage handler fires
3. Client disconnects → handleDisconnect() fires
```

## Socket Rooms

Rooms group sockets together for targeted broadcasts:

```typescript
// Join a room
client.join('match_123');

// Send to everyone in room
this.server.to('match_123').emit('question', data);

// Leave room
client.leave('match_123');
```

## Authentication in WebSockets

Unlike HTTP (where each request has headers), WebSocket authenticates once on connection:

```typescript
@WebSocketGateway()
class MyGateway {
  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    // Validate JWT, attach user to socket
    client.data.userId = decoded.sub;
  }
}
```
