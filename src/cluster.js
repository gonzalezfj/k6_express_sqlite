import cluster from "cluster";
import { cpus } from "os";

/**
 * Initializes the application in cluster mode, creating worker processes for each CPU core
 * @param {import('express').Application} app - The Express application instance
 * @param {number} port - The port number to listen on
 * @returns {void}
 */
function init(app, port) {
  if (cluster.isPrimary) {
    const numCPUs = cpus().length;
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(
        `worker ${worker.process.pid} died with code ${code} and signal ${signal}`
      );
    });
  } else {
    app.listen(port, () => {
      console.log(`Worker ${process.pid} started`);
    });
  }
}

export default { init };
