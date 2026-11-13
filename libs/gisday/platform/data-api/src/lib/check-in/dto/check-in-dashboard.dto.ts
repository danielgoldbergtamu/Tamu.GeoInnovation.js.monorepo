import type { RsvpPersonTypeCounts } from '@tamu-gisc/gisday/common';

import type { RsvpDashboardPerson } from '../../user-rsvp/dto/rsvp-dashboard.dto';

/** One event on the Check-ins dashboard (#2893): its RSVPs against who checked in, and them by person type. */
export interface CheckInDashboardEvent {
  guid: string;
  name: string | null;
  /** When the event starts, or null for an event with no day or time. */
  starts: string | null;
  location: string | null;
  rsvps: number;
  /** Everyone who checked in, RSVP or not. */
  checkIns: number;
  /** Those who checked in and had RSVP'd. */
  showedUp: number;
  /** Those who checked in with no RSVP. */
  walkIns: number;
  /** Check-ins made outside the session's time (#2635). */
  outside: number;
  /** Who checked in, by person type. */
  counts: RsvpPersonTypeCounts;
}

/** A season's Check-ins dashboard: each event, and when each check-in was made, for the chart. Counts only. */
export interface CheckInDashboard {
  events: Array<CheckInDashboardEvent>;
  made: Array<{ event: string; created: string }>;
  /** Accounts whose profile could not be read, counted as Not given. */
  unreadAccounts: number;
}

/** Someone who checked in to an event: their profile, when, and whether they had RSVP'd or came outside the time. */
export interface CheckInDashboardPerson extends RsvpDashboardPerson {
  walkIn: boolean;
  outsideSessionTime: boolean;
}

/** The share of an event's RSVPs who checked in, or null for an event nobody RSVP'd for. */
export function showUpRate(rsvps: number, showedUp: number): number | null {
  return rsvps > 0 ? showedUp / rsvps : null;
}
