import path from "path";
import { checkFolderExists } from "../util/fileUtil";

const axios = require("axios");
const fs = require("fs");
const AdmZip = require('adm-zip');

export async function downloadPB() {
  const arc = process.env.PB_ARC;
  const v = process.env.PB_V;
  console.log(`Downloading pocketbase ${arc}_v${v}`);

  if(arc === undefined ||  v === undefined) throw new Error("Could not download PB")

  const dirPath = path.join(__dirname, "../../", "pocketbase-template", v)
  if(checkFolderExists(dirPath)) {
    console.log(`Pocketbase ${arc}_v${v} already installed`);
    return
  }

  fs.mkdir(path.join(__dirname, "../../", "pocketbase-template"), { recursive: true }, (err:any) => {
    if (err) throw err;
  });

  const writer = fs.createWriteStream(dirPath + ".zip");
  const fileUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${v}/pocketbase_${v}_${arc}.zip`;

  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream"
  }).then((response: any) => {
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  });
}


export function unzipFile(zipFilePath: string, outputFolder: string) {
    const dirPath = path.join(__dirname, "../../", "pocketbase-template", process.env.PB_V!)
    const zip = new AdmZip(dirPath+'.zip');
    zip.extractAllTo(dirPath, true);
    //fs.chmodSync(dirPath, 0o755);
//    chmodRecursiveSync(dirPath, 0o755);

}

export function chmodRecursiveSync(dirPath:string, mode:any) {
    console.log('Granting access to:', dirPath)
    fs.chmodSync(dirPath, mode);
    fs.readdirSync(dirPath, { withFileTypes: true }).forEach((dirent:any) => {
        const fullPath = path.join(dirPath, dirent.name);
        if (dirent.isDirectory()) {
            chmodRecursiveSync(fullPath, mode);
        } else {
            fs.chmodSync(fullPath, mode);
        }
    });
}

