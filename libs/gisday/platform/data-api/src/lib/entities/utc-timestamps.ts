import { EntitySubscriberInterface, EventSubscriber, InsertEvent, ObjectLiteral, UpdateEvent } from 'typeorm';

/**
 * The default of every `created` and `updated` column (#2584): the database's clock with its offset. `getdate()` is the server's
 * local time, which on production is Central, and as a `datetimeoffset` it was stored as if it were UTC.
 */
export const DATABASE_NOW = 'SYSDATETIMEOFFSET()';

/**
 * Stamps `created` and `updated` with the API's clock (#2584). Node runs in UTC, so these are true instants whatever the
 * database server's time zone is.
 *
 * The column default covers an insert that does not come through typeorm, but typeorm writes `updated = CURRENT_TIMESTAMP`
 * itself on every update, which on SQL Server is local time, and no default can change that. The value is set here, before
 * typeorm builds the statement, and typeorm then leaves its own out. Listed in `GISDAY_SUBSCRIBERS`, which the API registers.
 */
@EventSubscriber()
export class UtcTimestampSubscriber implements EntitySubscriberInterface {
  public beforeInsert(event: InsertEvent<ObjectLiteral>): void {
    const now = new Date();

    stampIfEmpty(event, event.metadata.createDateColumn?.propertyName, now);
    stampIfEmpty(event, event.metadata.updateDateColumn?.propertyName, now);
  }

  public beforeUpdate(event: UpdateEvent<ObjectLiteral>): void {
    const property = event.metadata.updateDateColumn?.propertyName;

    // A query builder update hands over the values being set, so `updated` joins them.
    if (property && event.entity) {
      event.entity[property] = new Date();
    }
  }
}

function stampIfEmpty(event: InsertEvent<ObjectLiteral>, property: string | undefined, now: Date): void {
  if (property && event.entity && event.entity[property] === undefined) {
    event.entity[property] = now;
  }
}

export const GISDAY_SUBSCRIBERS = [UtcTimestampSubscriber];
