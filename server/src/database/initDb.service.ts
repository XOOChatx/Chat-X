import { Pool } from "pg";
import fs from "fs"
import path from "path"
import { config } from "../config/env";

const DB_NAME = "chatx"

export async function initDb(){

    console.log(" Connecting to postgres sql ...")

    const adminPool = new Pool({
        user: config.PG_USER,
        host: config.PG_HOST,
        database: "postgres",
        password: config.PG_PASSWORD,
        port: Number(config.PG_PORT),
    });

    const result = await adminPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [DB_NAME]
    );

    if (result.rowCount === 0){
        console.log(`Database "${DB_NAME}" not found. Creating ...`)
        await adminPool.query(`CREATE DATABASE ${DB_NAME}`)
        console.log(`Database "${DB_NAME}" created.`)
    }else{
        console.log(`Database found...`)
    }

    await adminPool.end();

    const appPool = new Pool({
        user: config.PG_USER,
        host: config.PG_HOST,
        database: DB_NAME,
        password: config.PG_PASSWORD,
        port: Number(config.PG_PORT),
    });

    const schemaPath = path.join(process.cwd(), "src", "database", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    try{
        await appPool.query(schema);
        console.log("Running schema!!!");        
    }catch(err){
        console.error("Schema failed", err)
    }

    return appPool;
}