import { DataSource } from 'typeorm';

import { GISDAY_ENTITIES, Tag } from './all.entity';
import { GISDAY_SUBSCRIBERS } from './utc-timestamps';

// #2584, against a real database. Skipped unless GISDAY_TIMESTAMP_DB_HOST names a SQL Server that holds the GIS Day schema
// (migrated), logging in as TYPEORM_USERNAME and TYPEORM_PASSWORD to TYPEORM_DATABASE. Run it against a server whose clock is not
// UTC, which is what hid the fault: a throwaway container started with `-e TZ=America/Chicago` is one.
const host = process.env.GISDAY_TIMESTAMP_DB_HOST;
const describeWithDatabase = host ? describe : describe.skip;

describeWithDatabase('Created and updated times on a database whose clock is not UTC (#2584)', () => {
  const minute = 60 * 1000;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await new DataSource({
      type: 'mssql',
      host,
      port: process.env.TYPEORM_PORT ? parseInt(process.env.TYPEORM_PORT, 10) : undefined,
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      options: { enableArithAbort: true, trustServerCertificate: true },
      entities: GISDAY_ENTITIES as never,
      subscribers: GISDAY_SUBSCRIBERS
    }).initialize();
  });

  afterEach(async () => {
    await dataSource.getRepository(Tag).delete({ guid: 'utc-2584' });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  const utcNow = async (): Promise<Date> => {
    const [{ now }] = await dataSource.query(`SELECT CONVERT(varchar(33), SYSUTCDATETIME(), 127) + 'Z' AS now`);

    return new Date(now);
  };

  it("stores the instant a row was inserted, whatever the database server's time zone", async () => {
    await dataSource.getRepository(Tag).insert({ guid: 'utc-2584', name: 'utc' });

    const row = await dataSource.getRepository(Tag).findOneByOrFail({ guid: 'utc-2584' });

    expect(Math.abs(row.created.getTime() - (await utcNow()).getTime())).toBeLessThan(minute);
    expect(Math.abs(row.updated.getTime() - (await utcNow()).getTime())).toBeLessThan(minute);
  });

  it('stores the instant a row was inserted by the database default, for a writer that does not stamp it', async () => {
    await dataSource.query(`INSERT INTO tags (guid, name) VALUES ('utc-2584', 'utc')`);

    const row = await dataSource.getRepository(Tag).findOneByOrFail({ guid: 'utc-2584' });

    expect(Math.abs(row.created.getTime() - (await utcNow()).getTime())).toBeLessThan(minute);
  });

  it('reads back a time it was given exactly', async () => {
    const given = new Date('2026-11-20T16:59:00.000Z');

    await dataSource.getRepository(Tag).insert({ guid: 'utc-2584', name: 'utc', created: given });

    const row = await dataSource.getRepository(Tag).findOneByOrFail({ guid: 'utc-2584' });

    expect(row.created).toEqual(given);
  });

  it('sets updated to the instant of the change, through update and through save, and leaves created alone', async () => {
    const created = new Date('2026-11-20T16:59:00.000Z');

    await dataSource.getRepository(Tag).insert({ guid: 'utc-2584', name: 'utc', created, updated: created });
    await dataSource.getRepository(Tag).update({ guid: 'utc-2584' }, { name: 'renamed' });

    const afterUpdate = await dataSource.getRepository(Tag).findOneByOrFail({ guid: 'utc-2584' });

    expect(Math.abs(afterUpdate.updated.getTime() - (await utcNow()).getTime())).toBeLessThan(minute);
    expect(afterUpdate.created).toEqual(created);

    await dataSource.getRepository(Tag).update({ guid: 'utc-2584' }, { updated: created });
    await dataSource.getRepository(Tag).save({ guid: 'utc-2584', name: 'saved' });

    const afterSave = await dataSource.getRepository(Tag).findOneByOrFail({ guid: 'utc-2584' });

    expect(afterSave.name).toBe('saved');
    expect(Math.abs(afterSave.updated.getTime() - (await utcNow()).getTime())).toBeLessThan(minute);
    expect(afterSave.created).toEqual(created);
  });

  it('has the database clock that carries an offset as the default of every created and updated column', async () => {
    const defaults: Array<{ tbl: string; col: string; def: string }> = await dataSource.query(`
      SELECT OBJECT_NAME(dc.parent_object_id) AS tbl, c.name AS col, dc.definition AS def
      FROM sys.default_constraints dc
      JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
      WHERE c.name IN ('created', 'updated') AND dc.definition LIKE '%date%'
    `);

    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults.filter((d) => !/sysdatetimeoffset/i.test(d.def))).toEqual([]);
  });
});
