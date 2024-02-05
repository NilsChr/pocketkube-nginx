import { exec } from "child_process";
import { pb } from ".";

export async function killPocketBaseProcesses(): Promise<void> {
  console.log("Killing all pocketbase instances");
  return new Promise((resolve) => {
    const command =
      "ps -eo pid,comm | grep pocketbase | grep -v grep | awk '{print $1}'";

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return resolve();
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return resolve();
      }

      const pids = stdout.split("\n").filter((pid) => pid.trim());

      if (pids.length === 0) {
        console.log("No pocketbase processes found.");
        return resolve();
      }

      pids.forEach((pid) => {
        try {
          process.kill(parseInt(pid), "SIGTERM");
          console.log(`PocketBase process with PID ${pid} has been killed.`);
        } catch (err) {
          console.error(`Failed to kill process ${pid}: ${err}`);
        }
      });

      resolve();
    });
  });
}

export async function killProcketBaseProcess(pid: number): Promise<void> {
  console.log("KillProcketBaseProcess pic: " + pid);
  if (pid === 0) return;
  return new Promise((resolve, reject) => {
    exec(`kill ${pid}`, async (error, stdout, stderr) => {
      // Get record and update it to have no pid, port and set running to false. 
      const record = await pb
        .collection("instances")
        .getFirstListItem(`activePID=${pid}`);
      await pb.collection("instances").update(record.id, {activePID: 0, activePORT:0, running: false})
      
      if (error) {
        reject(`Error killing process ${pid}: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Error output from killing process ${pid}: ${stderr}`);
        return;
      }
      resolve();
    });
  });
}
