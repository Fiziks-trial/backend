# Matchmaking Flow

## Overview

The matchmaking system pairs players of similar skill for quiz battles using ELO ratings and WebSocket communication.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  socket.emit('queue:join', { subjectId: '...' })            │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  MatchmakingGateway                          │
│  - Receives WebSocket events                                 │
│  - Authenticates users via JWT                               │
│  - Delegates to MatchmakingService                           │
│  - Emits responses back to clients                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  MatchmakingService                          │
│  - Manages queue state (in-memory Maps)                      │
│  - Matching algorithm                                        │
│  - ELO range calculations                                    │
└─────────────────────────────────────────────────────────────┘
```

## Queue Data Structures

Three Maps work together for O(1) lookups:

| Map | Key → Value | Purpose |
|-----|-------------|---------|
| `queue` | userId → QueuedPlayer | Main storage |
| `subjectIndex` | subjectId → Set of userIds | Find players by subject |
| `socketIndex` | socketId → userId | Find user when socket disconnects |

## Join Queue Flow

```
┌─────────┐                         ┌─────────┐
│ Player  │                         │ Server  │
└────┬────┘                         └────┬────┘
     │                                   │
     │ Connect WebSocket                 │
     │──────────────────────────────────>│
     │                                   │
     │           Validate JWT token      │
     │           Attach userId to socket │
     │                                   │
     │ emit('queue:join', {subjectId})   │
     │──────────────────────────────────>│
     │                                   │
     │           Add to queue            │
     │           Try to find match       │
     │                                   │
     │ emit('queue:joined', status)      │
     │<──────────────────────────────────│
     │                                   │
     │           ... waiting ...         │
     │                                   │
```

## Match Found Flow

```
┌──────────┐                       ┌─────────┐                      ┌──────────┐
│ Player A │                       │ Server  │                      │ Player B │
└────┬─────┘                       └────┬────┘                      └────┬─────┘
     │                                  │                                │
     │ Already in queue (ELO: 1200)     │                                │
     │                                  │                                │
     │                                  │  emit('queue:join')            │
     │                                  │<───────────────────────────────│
     │                                  │                                │
     │                    Add Player B to queue                          │
     │                    Find match: Player A!                          │
     │                    |1200 - 1180| = 20 ✓                           │
     │                    Remove both from queue                         │
     │                    Create match record                            │
     │                                  │                                │
     │ emit('queue:match_found')        │   emit('queue:match_found')    │
     │<─────────────────────────────────│───────────────────────────────>│
     │                                  │                                │
     │ Navigate to /match/:id           │        Navigate to /match/:id  │
```

## ELO Range Expansion

To prevent infinite wait times, we expand the acceptable ELO range over time:

```
Time waiting    ELO Range    Example (Player at 1200)
─────────────────────────────────────────────────────
0-10 sec        ±100         Looking for 1100-1300
10-20 sec       ±150         Looking for 1050-1350
20-30 sec       ±200         Looking for 1000-1400
30+ sec         ±400 (max)   Looking for 800-1600
```

Formula:
```
range = initialRange + floor(waitTime / interval) × expansion
range = min(range, maxRange)
```

## Matching Algorithm

```
findMatch(player):
  1. Get all players waiting for same subject
  2. If less than 2 players → return null

  3. Calculate ELO range based on wait time

  4. For each candidate in subject queue:
     - Skip if same player
     - Calculate |player.elo - candidate.elo|
     - If within range AND closest so far → save as best match

  5. Return best match (or null)
```

## Disconnect Handling

```
┌─────────┐                         ┌─────────┐
│ Player  │                         │ Server  │
└────┬────┘                         └────┬────┘
     │                                   │
     │ In queue, waiting...              │
     │                                   │
     │ ✕ Browser closed / Network lost   │
     │──────────────────────────────────>│
     │                                   │
     │           handleDisconnect()      │
     │           Look up by socketId     │
     │           Remove from all Maps    │
     │           Log: "Player left"      │
```

## Configuration

```typescript
{
  initialEloRange: 100,       // Start with ±100
  eloRangeExpansion: 50,      // Expand by 50 each interval
  expansionIntervalMs: 10000, // Every 10 seconds
  maxEloRange: 400,           // Never exceed ±400
  queueTimeoutMs: 120000,     // Auto-remove after 2 minutes
}
```

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `queue:join` | `{ subjectId }` | Join matchmaking queue |
| `queue:leave` | none | Leave the queue |
| `queue:status` | none | Request current status |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `queue:joined` | `QueueStatus` | Confirmation + status |
| `queue:left` | none | Confirmation of leaving |
| `queue:match_found` | `MatchFoundPayload` | Match details |
| `queue:error` | `{ code, message }` | Error occurred |
| `queue:status_update` | `QueueStatus` | Periodic status update |

## Error Handling

| Error Code | When | Client Action |
|------------|------|---------------|
| `ALREADY_IN_QUEUE` | Join while already queued | Show warning |
| `NOT_IN_QUEUE` | Leave when not queued | Ignore |
| `INVALID_SUBJECT` | Subject doesn't exist | Show error |
| `AUTHENTICATION_REQUIRED` | No valid JWT | Redirect to login |

## Future Improvements

- **Redis**: Move queue from in-memory to Redis for multi-server support
- **Priority Queue**: VIP/premium players matched faster
- **Party System**: Queue with friends
- **Ranked Seasons**: Reset ELO periodically
- **Anti-Smurf**: Detect new accounts with high skill
