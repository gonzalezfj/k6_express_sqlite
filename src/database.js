import sqlite3 from "sqlite3";

/**
 * Creates and initializes a SQLite database connection
 * @returns {import('sqlite3').Database} Configured SQLite database instance
 * @description
 * - Creates database with shared cache enabled
 * - Enables Write-Ahead Logging (WAL) mode for better concurrency
 * - Creates items table if it doesn't exist
 * - Sets up error handling
 * @throws {Error} If database connection, WAL mode, or table creation fails
 */
function createDatabase() {
  // Create SQLite database connection with shared cache enabled
  const db = new sqlite3.Database(
    "./data/database.db",
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_SHAREDCACHE,
    (err) => {
      if (err) {
        console.error("Error connecting to database:", err);
        process.exit(1);
      } else {
        console.log("Connected to SQLite database");
        // Enable WAL mode
        db.run("PRAGMA journal_mode = WAL", (err) => {
          if (err) {
            console.error("Error enabling WAL mode:", err);
            process.exit(1);
          }
          console.log("WAL mode enabled");
        });
        // Create table if it doesn't exist
        db.run(
          `CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT
        )`,
          (err) => {
            if (err) {
              console.error("Error creating table:", err);
              process.exit(1);
            }
          }
        );
      }
    }
  );

  // Handle database errors
  db.on("error", (err) => {
    console.error("Database error:", err);
  });

  return db;
}

export default { createDatabase };
