import express from "express";
const router = express.Router();

/**
 * Creates and configures an Express router for handling item-related routes
 * @param {import('sqlite3').Database} db - SQLite database instance
 * @param {Object} options - Configuration options
 * @param {boolean} [options.retryOnBusy=false] - Whether to retry operations when database is busy
 * @param {number} [options.maxRetries=3] - Maximum number of retries for busy database
 * @param {number} [options.retryDelay=100] - Delay in ms between retries
 * @returns {import('express').Router} Express router configured with item routes
 */
function itemsRouter(db, options = {}) {
  const shouldRetry = options.retryOnBusy || false;
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 100;

  // Get all items with pagination
  router.get("/", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all("SELECT * FROM items LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
      if (err) {
        console.error("Error getting all items:", err);
        res.status(500).json({ error: err.message });
        return;
      }
      db.get("SELECT COUNT(*) AS count FROM items", [], (err, result) => {
        if (err) {
          console.error("Error counting items:", err);
          res.status(500).json({ error: err.message });
          return;
        }
        const totalItems = result.count;
        const totalPages = Math.ceil(totalItems / limit);
        res.json({
          items: rows,
          pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            pageSize: limit,
          },
        });
      });
    });
  });

  // Get single item by id
  router.get("/:id", (req, res) => {
    db.get("SELECT * FROM items WHERE id = ?", [req.params.id], (err, row) => {
      if (err) {
        console.error(`Error getting item ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        console.warn(`Item not found with id ${req.params.id}`);
        res.status(404).json({ error: "Item not found" });
        return;
      }
      res.json(row);
    });
  });

  // Create new item
  router.post("/", (req, res) => {
    const { name, description } = req.body;
    if (!name) {
      console.warn("Attempted to create item without name:", req.body);
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const performInsert = (retries = maxRetries) => {
      db.run(
        "INSERT INTO items (name, description) VALUES (?, ?)",
        [name, description],
        function (err) {
          if (err) {
            if (shouldRetry && err.code === "SQLITE_BUSY" && retries > 0) {
              console.warn("Database busy, retrying insert...", {
                retriesLeft: retries - 1,
              });
              setTimeout(() => performInsert(retries - 1), retryDelay);
              return;
            }
            console.error("Error creating new item:", err, {
              name,
              description,
            });
            res.status(500).json({ error: err.message });
            return;
          }
          db.get(
            "SELECT * FROM items WHERE id = ?",
            [this.lastID],
            (err, row) => {
              if (err) {
                console.error(
                  `Error retrieving created item ${this.lastID}:`,
                  err
                );
                res.status(500).json({ error: err.message });
                return;
              }
              res.json(row);
            }
          );
        }
      );
    };

    performInsert();
  });

  // Update item
  router.put("/:id", (req, res) => {
    const { name, description } = req.body;
    if (!name) {
      console.warn(
        `Attempted to update item ${req.params.id} without name:`,
        req.body
      );
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const performUpdate = (retries = maxRetries) => {
      db.run(
        "UPDATE items SET name = ?, description = ? WHERE id = ?",
        [name, description, req.params.id],
        function (err) {
          if (err) {
            if (shouldRetry && err.code === "SQLITE_BUSY" && retries > 0) {
              console.warn("Database busy, retrying update...", {
                retriesLeft: retries - 1,
              });
              setTimeout(() => performUpdate(retries - 1), retryDelay);
              return;
            }
            console.error(`Error updating item ${req.params.id}:`, err, {
              name,
              description,
            });
            res.status(500).json({ error: err.message });
            return;
          }
          if (this.changes === 0) {
            console.warn(
              `Attempted to update non-existent item ${req.params.id}`
            );
            res.status(404).json({ error: "Item not found" });
            return;
          }
          db.get(
            "SELECT * FROM items WHERE id = ?",
            [req.params.id],
            (err, row) => {
              if (err) {
                console.error(
                  `Error retrieving updated item ${req.params.id}:`,
                  err
                );
                res.status(500).json({ error: err.message });
                return;
              }
              res.json(row);
            }
          );
        }
      );
    };

    performUpdate();
  });

  // Delete item
  router.delete("/:id", (req, res) => {
    const performDelete = (retries = maxRetries) => {
      db.run("DELETE FROM items WHERE id = ?", [req.params.id], function (err) {
        if (err) {
          if (shouldRetry && err.code === "SQLITE_BUSY" && retries > 0) {
            console.warn("Database busy, retrying delete...", {
              retriesLeft: retries - 1,
            });
            setTimeout(() => performDelete(retries - 1), retryDelay);
            return;
          }
          console.error(`Error deleting item ${req.params.id}:`, err);
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          console.warn(
            `Attempted to delete non-existent item ${req.params.id}`
          );
          res.status(404).json({ error: "Item not found" });
          return;
        }
        res.json({ message: "Item deleted" });
      });
    };

    performDelete();
  });

  return router;
}

export default itemsRouter;
