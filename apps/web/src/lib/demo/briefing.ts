import { DemoFactPacketSchema, type DemoFactPacket } from '@reachops/contracts';
import briefingJson from './briefing.generated.json';

/**
 * The fact packet the briefing is composed from.
 *
 * Imported only by the Briefing route. Every evidence identifier it cites belongs to the core
 * snapshot, which the evidence registry already holds, so this module registers nothing of its own.
 */
export const demoBriefing: DemoFactPacket = DemoFactPacketSchema.parse(briefingJson);
