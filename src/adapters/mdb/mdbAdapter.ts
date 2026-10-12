import { FileTypeAdapter } from "core/middleware/filetypes";
import { FilesystemMiddleware } from "core/middleware/filesystem";
import MakeMDPlugin from 'main';
import { AFile } from "shared/types/afile";
import { Command } from 'shared/types/commands';
import { DBTable, DBTables, MDB, SpaceProperty, SpaceTable, SpaceTableSchema, SpaceTables } from 'shared/types/mdb';
import { MDBFrame } from 'shared/types/mframe';
type MDBContent = {
    schema: SpaceTableSchema,
    schemas: SpaceTableSchema[],
    field: SpaceProperty,
    fields: SpaceProperty[],
    table: DBTable,
    tables: DBTables,
    mdbTable: SpaceTable,
    mdbTables: SpaceTables,
    mdbFrame: MDBFrame,
    mdbCommand: Command,
    mdbCommands: Command[]
}

/** Stand-in for make.md's `.mdb` adapter, which read and wrote SQLite files through sql.js.

    `.mdb` files hold make.md's space data — context tables, frames, commands — none of which
    Notioneer uses. Dropping sql.js removes a WASM binary and Node `fs` access from the
    bundle. The adapter stays registered because the Superstate still asks for `.mdb`
    fragments while it initializes; every read answers exactly as upstream did for an `.mdb`
    file that does not exist, and writes are ignored. */
export class MDBFileTypeAdapter implements FileTypeAdapter<MDB, MDBContent> {

    constructor (public plugin: MakeMDPlugin) {
    }

    public supportedFileTypes = ['mdb'];
    public id = "mdb.make.md";
    public cache: Map<string, MDB>
    public middleware: FilesystemMiddleware;
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
    }

    public newFile (): Promise<AFile> {
        return Promise.resolve(null);
    }

    public parseCache (): Promise<void> {
        return Promise.resolve();
    }

    public contentTypes () {
        return ['schemas', 'fields', 'tables', 'field', 'table', 'schema', 'field', 'mdbTable', 'mdbTables', 'mdbFrame', 'mdbCommand', 'mdbCommands'] as Array<keyof MDBContent>;
    }
    public cacheTypes () {
        return ['schemas', 'fields', 'tables'] as Array<keyof MDB>;
    }
    public getCacheTypeByRefString (): null {
        return null;
    }
    public getCache (file: AFile, fragmentType: keyof MDB) {
        return this.cache.get(file.path)?.[fragmentType];
    }
    public readContent (file: AFile, fragmentType: keyof MDBContent): Promise<MDBContent[typeof fragmentType]> {
        // Upstream lists an absent file's commands as an empty array; everything else is null.
        if (fragmentType == 'mdbCommands') return Promise.resolve([]);
        if (fragmentType == 'mdbCommand' || fragmentType == 'table') return Promise.resolve(undefined);
        return Promise.resolve(null);
    }
    public newContent (): Promise<undefined> {
        return Promise.resolve(undefined);
    }
    public saveContent (): Promise<boolean> {
        return Promise.resolve(false);
    }
    public deleteContent () {
    }

}
