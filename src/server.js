// server.js
import app from "./app.js";
import clusterModule from "./cluster.js";

const port = 3005;
const clusterMode = process.argv.includes("--cluster");

if (clusterMode) {
  clusterModule.init(app, port);
} else {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
