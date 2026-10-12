import { debounce } from "lodash";
import { DataAdapter } from "obsidian";
import { DBRow } from "shared/types/mdb";
import { LocalCachePersister } from "shared/types/persister";

type CacheFile = Record<string, DBRow[]>;

/** Persists the Superstate index as a JSON file in the plugin folder.

    Replaces make.md's SQLite persisters (`.makemd/*.mdc`, via sql.js), which brought a WASM
    binary and Node `fs` access into the bundle. Same contract: rows of `{path, cache,
    version}` per type, kept in memory and written back debounced. */
export class JSONCachePersister implements LocalCachePersister {
	public indexVersion = Date.now().toString();
	private initialized = false;
	private maps: Record<string, Map<string, DBRow>> = {};

	public constructor(
		private adapter: DataAdapter,
		private storagePath: string,
		private types: string[],
	) {}

	public async initialize() {
		let stored: CacheFile = {};
		try {
			if (await this.adapter.exists(this.storagePath)) {
				stored = JSON.parse(await this.adapter.read(this.storagePath)) as CacheFile;
			}
		} catch (e) {
			// A corrupt cache only costs a full reindex.
			console.error("Notioneer: discarding unreadable index cache", e);
		}
		this.maps = Object.fromEntries(
			this.types.map((type) => [type, new Map((stored[type] ?? []).map((row) => [row.path, row]))]),
		);
		this.initialized = true;
	}

	public isInitialized() {
		return this.initialized;
	}

	public unload() {
		this.initialized = false;
	}

	public reset() {
		if (!this.initialized) return;
		this.maps = Object.fromEntries(this.types.map((type) => [type, new Map<string, DBRow>()]));
		this.save();
	}

	public store(path: string, cache: string, type: string): Promise<void> {
		if (!this.initialized || !this.maps[type]) return Promise.resolve();
		this.maps[type].set(path, { path, cache, version: this.indexVersion });
		this.save();
		return Promise.resolve();
	}

	public remove(path: string, type: string): Promise<void> {
		if (!this.initialized || !this.maps[type]) return Promise.resolve();
		this.maps[type].delete(path);
		this.save();
		return Promise.resolve();
	}

	public cleanType(type: string) {
		if (!this.initialized || !this.maps[type]) return;
		for (const [path, row] of this.maps[type]) {
			if (row.version != this.indexVersion) this.maps[type].delete(path);
		}
		this.save();
	}

	public loadAll(type: string): Promise<DBRow[]> {
		if (!this.initialized) return Promise.resolve([]);
		return Promise.resolve([...(this.maps[type]?.values() ?? [])]);
	}

	private save = debounce(
		() => {
			const data: CacheFile = Object.fromEntries(
				Object.entries(this.maps).map(([type, rows]) => [type, [...rows.values()]]),
			);
			this.adapter.write(this.storagePath, JSON.stringify(data)).catch((e) => {
				console.error("Notioneer: could not write index cache", e);
			});
		},
		5000,
		{ leading: false },
	);
}
