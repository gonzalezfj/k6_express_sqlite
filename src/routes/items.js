import express from "express";
const router = express.Router();
import { promisify } from "util";

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

  const dbAll = promisify(db.all).bind(db);
  const dbGet = promisify(db.get).bind(db);
  const dbRun = promisify(db.run).bind(db);

  async function retryOperation(operation, retries = maxRetries) {
    try {
      return await operation();
    } catch (err) {
      if (shouldRetry && err.code === "SQLITE_BUSY" && retries > 0) {
        console.warn("Database busy, retrying operation...", { retriesLeft: retries - 1 });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return retryOperation(operation, retries - 1);
      }
      throw err;
    }
  }

  async function getAllItems(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const rows = await dbAll("SELECT * FROM items LIMIT ? OFFSET ?", [limit, offset]);
      const result = await dbGet("SELECT COUNT(*) AS count FROM items", []);
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
    } catch (err) {
      console.error("Error getting all items:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async function getItemById(req, res) {
    try {
      const row = await dbGet("SELECT * FROM items WHERE id = ?", [req.params.id]);
      if (!row) {
        console.warn(`Item not found with id ${req.params.id}`);
        res.status(404).json({ error: "Item not found" });
        return;
      }
      res.json(row);
    } catch (err) {
      console.error(`Error getting item ${req.params.id}:`, err);
      res.status(500).json({ error: err.message });
    }
  }

  async function createNewItem(req, res) {
    const { name, description } = req.body;
    if (!name) {
      console.warn("Attempted to create item without name:", req.body);
      res.status(400).json({ error: "Name is required" });
      return;
    }

    try {
      await retryOperation(() => dbRun("INSERT INTO items (name, description) VALUES (?, ?)", [name, description]));
      const row = await dbGet("SELECT * FROM items WHERE name = ? AND description = ? ORDER BY id DESC LIMIT 1", [name, description]);
      res.json(row);
    } catch (err) {
      console.error("Error creating new item:", err, { name, description });
      res.status(500).json({ error: err.message });
    }
  }

  async function updateItem(req, res) {
    const { name, description } = req.body;
    if (!name) {
      console.warn(`Attempted to update item ${req.params.id} without name:`, req.body);
      res.status(400).json({ error: "Name is required" });
      return;
    }

    try {
      await retryOperation(() => dbRun("UPDATE items SET name = ?, description = ? WHERE id = ?", [name, description, req.params.id]));
      const row = await dbGet("SELECT * FROM items WHERE id = ?", [req.params.id]);
      if (!row) {
        console.warn(`Attempted to update non-existent item ${req.params.id}`);
        res.status(404).json({ error: "Item not found" });
        return;
      }
      res.json(row);
    } catch (err) {
      console.error(`Error updating item ${req.params.id}:`, err, { name, description });
      res.status(500).json({ error: err.message });
    }
  }

  async function deleteItem(req, res) {
    try {
      await retryOperation(() => dbRun("DELETE FROM items WHERE id = ?", [req.params.id]));
      // Check if item existed before deletion
      const row = await dbGet("SELECT * FROM items WHERE id = ?", [req.params.id]);
      if (row) {
        console.warn(`Attempted to delete non-existent item ${req.params.id}`);
        res.status(404).json({ error: "Item not found" });
        return;
      }
      res.json({ message: "Item deleted" });
    } catch (err) {
      console.error(`Error deleting item ${req.params.id}:`, err);
      res.status(500).json({ error: err.message });
    }
  }

  router.get("/", getAllItems);
  router.get("/:id", getItemById);
  router.post("/", createNewItem);
  router.put("/:id", updateItem);
  router.delete("/:id", deleteItem);

  return router;
}

export default itemsRouter;
