import { createServer } from "net";

export async function getFreePort(
  startPort: number,
  endPort: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    const port =
      Math.floor(Math.random() * (endPort - startPort + 1)) + startPort;
    const server = createServer();

    server.listen(port, () => {
      server.close(() => {
        if (port !== undefined) {
          resolve(port);
        } else {
          reject(new Error("Failed to retrieve the free port"));
        }
      });
    });

    server.on("error", () => {
      server.close();
      getFreePort(startPort, endPort).then(resolve).catch(reject);
    });
  });
}
