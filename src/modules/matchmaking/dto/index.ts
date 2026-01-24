/**
 * =============================================================================
 * DTO BARREL EXPORT
 * =============================================================================
 *
 * WHAT IS A BARREL FILE?
 * ----------------------
 * A "barrel" is an index.ts file that re-exports things from other files.
 * It's a pattern to make imports cleaner.
 *
 * WITHOUT BARREL (messy):
 *   import { JoinQueueDto } from './dto/join-queue.dto';
 *   import { LeaveQueueDto } from './dto/leave-queue.dto';
 *   import { QueueStatusDto } from './dto/queue-status.dto';
 *
 * WITH BARREL (clean):
 *   import { JoinQueueDto, LeaveQueueDto, QueueStatusDto } from './dto';
 *
 * The barrel collects all exports in one place, so consumers only need
 * to know about the folder, not individual file names.
 *
 * =============================================================================
 */

export * from './join-queue.dto';
