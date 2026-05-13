import { DatabaseSync } from "node:sqlite";
import { databasePath } from "../utils/paths.js";
export class ForgeDatabase {
    db;
    constructor(path = databasePath()) {
        this.db = new DatabaseSync(path);
        this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    }
    exec(sql) {
        this.db.exec(sql);
    }
    run(sql, params = []) {
        return this.db.prepare(sql).run(...params);
    }
    get(sql, params = []) {
        return this.db.prepare(sql).get(...params);
    }
    all(sql, params = []) {
        return this.db.prepare(sql).all(...params);
    }
    close() {
        this.db.close();
    }
}
