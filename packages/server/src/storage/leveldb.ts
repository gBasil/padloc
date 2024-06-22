import { Level } from "level";
import {
    Storage,
    Storable,
    StorableConstructor,
    StorageListOptions,
    filterByQuery,
    sortBy,
    StorageQuery,
} from "@padloc/core/src/storage";
import { Err, ErrorCode } from "@padloc/core/src/error";
import { Config, ConfigParam } from "@padloc/core/src/config";

export class LevelDBStorageConfig extends Config {
    @ConfigParam()
    dir: string = "./data";
}

export class LevelDBStorage implements Storage {
    private _db: Level;

    constructor(public readonly config: LevelDBStorageConfig) {
        this._db = new Level(`${this.config.dir}`);
    }

    async get<T extends Storable>(cls: StorableConstructor<T> | T, id: string) {
        const res = cls instanceof Storable ? cls : new cls();
        try {
            const raw = await this._db.get(`${res.kind}_${id}`);
            return res.fromJSON(raw);
        } catch (e) {
            if (e.notFound) {
                throw new Err(ErrorCode.NOT_FOUND, `Cannot find object: ${res.kind}_${id}`);
            } else {
                throw e;
            }
        }
    }

    async save<T extends Storable>(obj: T) {
        await this._db.put(`${obj.kind}_${obj.id}`, obj.toJSON());
    }

    async delete<T extends Storable>(obj: T) {
        await this._db.del(`${obj.kind}_${obj.id}`);
    }

    async clear() {
        throw "not implemented";
    }

    async list<T extends Storable>(
        cls: StorableConstructor<T>,
        { offset = 0, limit = Infinity, query, orderBy, orderByDirection }: StorageListOptions = {}
    ): Promise<T[]> {
		const results: T[] = [];
		const kind = new cls().kind;
		const sort = orderBy && sortBy(orderBy, orderByDirection || "asc");

		for await (const [key, value] of this._db.iterator()) {
			if (key.indexOf(kind + "_") !== 0) {
				throw new Error();
			}
			try {
				const item = new cls().fromJSON(value);
				if (!query || filterByQuery(item, query)) {
					results.push(item);
				}
			} catch (e) {
				console.error(
					`Failed to load ${key}:${JSON.stringify(JSON.parse(value), null, 4)} (Error: ${e})`
				);
			}
		}

		if (sort) {
			results.sort(sort);
		}
		return results.slice(offset, offset + limit);
    }

    async count<T extends Storable>(cls: StorableConstructor<T>, query?: StorageQuery): Promise<number> {
        return this.list(cls, { query }).then((res) => res.length);
    }
}
