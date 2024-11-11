# 🔬 Load Testing in a Simple SQLite CRUD Express Server

This Node.js server is designed for load testing with SQLite and k6.

## ✨ What's Inside

- 💾 Very simple CRUD operations with SQLite
- 🌐 Minimal API endpoints
- 🔥 Load testing with k6
- 💪 Performance via Node.js clustering (opt-in)

## 🎯 Why This Project?

This project provides hands-on experience with:

- 🛠️ Building CRUD operations
- 📊 Load testing
- 🔬 Server behavior under pressure
- 🚦 Multi-core processing

## 🔧 Power Stack

- ⚡ Node.js - The engine
- 📦 SQLite - Data storage
- 🔥 k6 - Load testing tool

## 🏋️ Load Testing Specs

This server is tested with:

- 👥 50 concurrent virtual users
- ⏱️ 30 seconds of testing
- 🔄 CRUD operations from each user

To start, follow the instructions:

## 🚀 Getting Started

To get started with this project, follow these steps:

1. **Install dependencies**:

   ```sh
   npm install
   ```

2. **Run the server**:

   - To run the server in a single process mode:
     ```sh
     npm run serve
     ```
   - To run the server with clustering enabled:
     ```sh
     npm run cluster
     ```

3. **Load testing with k6**:
   - Ensure k6 is installed on your system. If not, follow the installation instructions [here](https://k6.io/docs/getting-started/installation/).
   - Run the load tests:
     ```sh
     npm run load-test
     ```
