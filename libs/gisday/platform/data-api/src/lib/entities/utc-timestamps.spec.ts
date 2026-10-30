import { DataSource } from 'typeorm';

import { GISDAY_ENTITIES, Tag } from './all.entity';
import { queryCheckingDataSource, recordWrites } from '../_base/query-checking-data-source';

// #2584: `created` and `updated` defaulted to getdate(), and typeorm writes `updated = CURRENT_TIMESTAMP` on every update. On SQL
// Server both are the database server's local time, and production's is Central, so every time was stored 5 or 6 hours early and
// labelled +00:00. The API runs in UTC, so the times it stamps itself are true instants whatever the database's clock says.
describe('Created and updated times are true instants (#2584)', () => {
  const instant = new Date('2026-11-20T16:59:00.000Z');
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await queryCheckingDataSource();
  });

  beforeEach(() => {
    jest.useFakeTimers({ now: instant });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // The statements that touch `tags`, with their parameters as the values typeorm hands the driver.
  const writes = (sql: RegExp, statements: Array<{ sql: string; parameters: Array<unknown> }>) =>
    statements
      .filter((s) => sql.test(s.sql))
      .map((s) => ({
        sql: s.sql.replace(/\s+/g, ' ').trim(),
        values: s.parameters.map((p) => (p && typeof p === 'object' && 'value' in p ? (p as { value: unknown }).value : p))
      }));

  it('declares the database clock that carries an offset as the default of every created and updated column', () => {
    const columns = GISDAY_ENTITIES.flatMap((entity) => dataSource.getMetadata(entity as never).columns).filter(
      (column) => column.isCreateDate || column.isUpdateDate
    );
    const defaults = (column: (typeof columns)[number]) => [
      column.entityMetadata.tableName,
      column.databaseName,
      `${(column.default as () => string)()}`.toLowerCase()
    ];

    expect(columns.length).toBeGreaterThan(0);
    expect(columns.map(defaults)).toEqual(
      columns.map((column) => [column.entityMetadata.tableName, column.databaseName, 'sysdatetimeoffset()'])
    );
  });

  it('stamps a row inserted through the API with the instant it was inserted, never the database clock', async () => {
    const { statements } = recordWrites(dataSource);

    await dataSource.getRepository(Tag).insert({ guid: 't-1', name: 'a tag' });

    const [insert] = writes(/INSERT INTO "?tags/i, statements);

    expect(insert.values).toEqual(expect.arrayContaining([instant, instant]));
  });

  it('sets updated to the instant of the change on an update, not to CURRENT_TIMESTAMP', async () => {
    const { statements } = recordWrites(dataSource);

    await dataSource.getRepository(Tag).update({ guid: 't-1' }, { name: 'renamed' });

    const [update] = writes(/UPDATE "?tags/i, statements);

    expect(update.sql).not.toMatch(/CURRENT_TIMESTAMP/i);
    expect(update.values).toEqual(expect.arrayContaining([instant]));
  });

  it('does the same when the update is a save of a row already there', async () => {
    const stored = {
      Tag_guid: 't-1',
      Tag_name: 'a tag',
      Tag_created: new Date('2026-10-01T00:00:00Z'),
      Tag_updated: new Date('2026-10-01T00:00:00Z')
    };
    const { statements } = recordWrites(dataSource, [], (sql) => (/FROM "tags"/i.test(sql) ? [stored] : []));

    await dataSource.getRepository(Tag).save({ guid: 't-1', name: 'renamed' });

    const [update] = writes(/UPDATE "?tags/i, statements);

    expect(update.sql).not.toMatch(/CURRENT_TIMESTAMP/i);
    expect(update.values).toEqual(expect.arrayContaining([instant]));
  });
});
