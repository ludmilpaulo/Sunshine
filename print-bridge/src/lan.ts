import net from "node:net";

export async function sendToLan(ip: string, port: number, data: Buffer): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 5000; // 5 second timeout

    socket.setTimeout(timeout);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Connection timeout"));
    });

    socket.connect(port, ip, () => {
      socket.write(data, (err) => {
        if (err) {
          socket.destroy();
          reject(err);
        } else {
          socket.end();
        }
      });
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });

    socket.on("close", () => {
      resolve();
    });
  });
}

