import sqlite3 from "sqlite3";

/**
 * Creates and initializes a SQLite database connection
 * @returns {Promise<import('sqlite3').Database>} Configured SQLite database instance
 * @description
 * - Creates database with shared cache enabled
 * - Enables Write-Ahead Logging (WAL) mode for better concurrency
 * - Sets synchronous mode to normal for improved performance
 * - Uses in-memory temp store for faster temp operations
 * - Sets mmap size to 30GB for larger databases
 * - Creates items table if it doesn't exist
 * @throws {Error} If database connection, configuration, or table creation fails
 */
async function createDatabase() {
  try {
    // Create SQLite database connection with shared cache enabled
    const db = await new Promise((resolve, reject) => {
      const database = new sqlite3.Database(
        "./data/database.db",
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_SHAREDCACHE,
        (err) => {
          if (err) reject(err);
          else resolve(database);
        }
      );
    });

    console.log("Connected to SQLite database");

    // Configure database for performance
    await Promise.all([
      runQuery(db, "PRAGMA journal_mode = WAL"),
      runQuery(db, "PRAGMA synchronous = NORMAL"),
      runQuery(db, "PRAGMA temp_store = MEMORY"),
      runQuery(db, "PRAGMA mmap_size = 30000000000")
    ]);

    console.log("Database configured for performance");

    // Create table if it doesn't exist
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `);

    // Handle database errors
    db.on("error", (err) => {
      console.error("Database error:", err);
    });

    return db;

  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
}

/**
 * Helper function to run SQL queries as promises
 * @param {import('sqlite3').Database} db Database instance
 * @param {string} query SQL query to execute
 * @returns {Promise<void>}
 */
function runQuery(db, query) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default { createDatabase };
