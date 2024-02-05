import { getFreePort } from "../util/network";
import { setupAdminSchema, setupRootAdmin } from "./admin";
import {
  createPocketBaseInstance,
  deletePocketBaseInstance,
  startPocketBaseInstance
} from "./instance";
import { killPocketBaseProcesses, killProcketBaseProcess } from "./processes";
import PocketBase, { RecordModel } from "pocketbase";
import eventsource from "eventsource";
import "cross-fetch/polyfill";
import { checkFolderExists } from "../util/fileUtil";
import { chmodRecursiveSync, downloadPB, unzipFile } from "./downloader";
import path from "path";

export * from "./admin";
export * from "./instance";
export * from "./processes";
export * from "./downloader";

//@ts-ignore
global.EventSource = eventsource;

let pb: PocketBase;
let instances: Map<string, RecordModel> = new Map();
let timers: Map<string, NodeJS.Timeout> = new Map();

export { pb, instances, timers };

export async function initializePocketBase(): Promise<void> {
  console.log("Booting Pocketkube");
  return new Promise(async (resolve) => {
    await downloadPB();
    await unzipFile(
      `../../pocketbase-template/${process.env.PB_V}.zip`,
      `../../pocketbase-template/PB_${process.env.PB_V}`
    );
    await killPocketBaseProcesses();
    const adminExists = checkFolderExists(
      path.join(__dirname, "..", "..", "pocketbase-instances/admin")
    );

    if (!adminExists) {
      await createPocketBaseInstance("admin");
      await chmodRecursiveSync(
        path.join(__dirname, "..", "..", "pocketbase-instances", "admin"),
        0o755
      );
    }
    await startPocketBaseInstance("admin", 8000);
    if (!adminExists) {
      await setupRootAdmin();
    }

    const pbUrl = "http://127.0.0.1:8000";
    pb = new PocketBase(pbUrl);
    pb.autoCancellation(false);

    await authenticateAdmin();
    if (!adminExists) {
      await setupAdminSchema(pb);
    }
    await updateInstances();
    await resetRunVariables();
    await updateInstances();

    await startActiveInstances();
    console.log("Pocketkube operational ✅");
    resolve();
  });
}

async function authenticateAdmin() {
  console.log("Authenticatig to admin");
  await pb.admins.authWithPassword(
    process.env.ADMIN_USER || "",
    process.env.ADMIN_PW || ""
  );
}

export async function updateInstances() {
  console.log("Update instances");
  instances.set("admin", {
    id: "admin",
    title: "admin",
    activePORT: 8000,
    running: true,
    collectionId: "instances",
    collectionName: "instances",
    created: "",
    updated: ""
  });
  let records = await pb.collection("instances").getFullList();
  for (let record of records) {
    instances.set(record.id, record);
  }
}
async function resetRunVariables() {
  console.log("Reset run variables");

  for (let instance of Array.from(instances.values()).filter(
    (app) => app.id !== "admin"
  )) {
    await pb.collection("instances").update(instance.id, {
      activePID: null,
      activePORT: null,
      running: false
    });
  }
}

function startActiveInstances(): Promise<void> {
  console.log("Start active instances");
  return new Promise(async (resolve) => {
    for (let instance of instances.values()) {
      if (instance.active && instance.running == false)
        await startApp(`${instance.id}_${instance.title}`).catch((reason) => {
          console.log(`Error caught when starting ${instance.id}`);
          console.log(reason);
        });
    }
    resolve();
  });
}

export async function startApp(id: string): Promise<void> {
  return new Promise(async (resolve) => {
    console.log(`Starting app ${id}`);
    const instance = instances.get(id);
    if (instance) {
      if (
        instance.running === true ||
        instance.activePID !== 0 ||
        instance.activePORT !== 0
      ) {
        console.log("Not starting already running app.");
        return resolve();
      }
    }

    const port = await getFreePort(8000, 10000);
    const pid = await startPocketBaseInstance(id, port);
    console.log(`Instance started`);
    const record = await pb.collection("instances").update(id.split("_")[0], {
      activePID: pid,
      activePORT: port,
      running: true
    });

    if (
      process.env.POCKETBASE_SLEEP_SECONDS &&
      parseInt(process.env.POCKETBASE_SLEEP_SECONDS) > 0
    ) {
      startTimer(record.id);
    }
    resolve();
  });
}

export function startTimer(id: string) {
  clearTimeout(timers.get(id));
  let timer = setTimeout(async () => {
    const instance = instances.get(id);
    if (instance === undefined) return;
    await killProcketBaseProcess(instance.activePID);
    await pb.collection("instances").update(instance.id, {
      activePID: null,
      activePORT: null,
      running: false
    });
    updateInstances();
  }, parseInt(process.env.POCKETBASE_SLEEP_SECONDS!));
  timers.set(id, timer);
}

export async function handleCreateEvent(record: RecordModel) {
  await createPocketBaseInstance(record.id);
  await record.id;
  await updateInstances();
}

export async function handleDeleteEvent(record: RecordModel) {
  await killProcketBaseProcess(record.activePID);
  deletePocketBaseInstance(record.id);
  instances.delete(record.id);
}
