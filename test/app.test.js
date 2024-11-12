import request from 'supertest';
import sqlite3 from 'sqlite3';

import app from '../src/app.js';

function initializeEmptyTestDatabase() {
  const db = new sqlite3.Database(':memory:');
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `);
  });
  return db;
}

async function createItem(item) {
  const response = await request(app)
    .post('/items')
    .send(item)
    .expect('Content-Type', /json/)
    .expect(200);
  return response.body;
}

beforeEach(() => {
  initializeEmptyTestDatabase();
});

describe('API Endpoints', () => {
  test('GET / should return "Hello, World!"', async () => {
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /text\/html/)
      .expect(200);

    expect(response.text).toBe('Hello, World!');
  });

  test('GET /items should return an array of items', async () => {
    const response = await request(app)
      .get('/items')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body.items)).toBe(true);
  });

  test('GET /items/:id should return a single item', async () => {
    const newItem = { name: 'TestItem', description: 'Test description' };
    const createdItem = await createItem(newItem);

    const response = await request(app)
      .get(`/items/${createdItem.id}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).toBe(createdItem.id);
  });

  test('POST /items should create a new item and return it', async () => {
    const newItem = { name: 'NewItem', description: 'New item description' };
    const createdItem = await createItem(newItem);

    expect(createdItem.id).toBeDefined();
    expect(createdItem.name).toBe(newItem.name);
  });

  test('PUT /items/:id should update an existing item', async () => {
    const newItem = { name: 'TestItem', description: 'Test description' };
    const createdItem = await createItem(newItem);
    const updatedItem = { name: 'UpdatedItem', description: 'Updated description' };

    const response = await request(app)
      .put(`/items/${createdItem.id}`)
      .send(updatedItem)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).toBe(updatedItem.name);
  });

  test('DELETE /items/:id should delete an existing item', async () => {
    const newItem = { name: 'TestItem', description: 'Test description' };
    const createdItem = await createItem(newItem);

    const response = await request(app)
      .delete(`/items/${createdItem.id}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Item deleted');
  });
});