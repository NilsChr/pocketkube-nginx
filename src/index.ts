import path from "path";

import {
  chmodRecursiveSync,
  createPocketBaseInstance,
  deletePocketBaseInstance,
  initializePocketBase, killProcketBaseProcess, pb, startApp, startPocketBaseInstance,
} from "./pocketbase";
import { nginx } from "./nginx";

if(isNaN(parseInt(process.env.POCKETBASE_SLEEP_SECONDS!))) {
  throw new Error("Env variable POCKETBASE_SLEEP_SECONDS not defined.");
}

async function main() {
  await initializePocketBase();
  //generateOutput();
  nginx.generateOutput();
  pb.collection("instances").subscribe("*", async function (e) {
    //console.log(e.action);
    //console.log(e.record);
    const appKey = `${e.record.id}_${e.record.title}`

    if (e.action === "create") {
      createPocketBaseInstance(appKey)
      await chmodRecursiveSync(
        path.join(__dirname, "..", "pocketbase-instances",appKey),
        0o755
      );
      await startApp(appKey)

    } 
    let killInstance = false;
    if (e.action === "delete") {
      killInstance = true;
      await deletePocketBaseInstance(appKey);
    }
    if (e.action === "update") {
      if(e.record.active === false) {
        killInstance = true;
      } else if(e.record.active === true && e.record.running == false) {
        killInstance = true;
        await startApp(appKey)
      } 
    }

    if(killInstance) {
      await killProcketBaseProcess(e.record.activePID);
    }
    nginx.generateOutput();
  });
}

main();

