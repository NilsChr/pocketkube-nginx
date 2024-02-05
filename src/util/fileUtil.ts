import fs from "fs";
import path from "path";

function copyFile(source: string, target: string) {
  fs.copyFileSync(source, target);
}

export function checkFolderExists(folderPath: string): boolean {
  return fs.existsSync(folderPath);
}

export function copyDirectory(source: string, target: string) {
  if (!fs.existsSync(target)) {
    console.log("CREATING DIR", target);
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source, { withFileTypes: true });

  for (const item of items) {
    const srcPath = path.join(source, item.name);
    const targetPath = path.join(target, item.name);

    if (item.isDirectory()) {
      copyDirectory(srcPath, targetPath);
    } else {
      copyFile(srcPath, targetPath);
    }
  }
}

export function deleteDirectorySync(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const currentPath = path.join(dirPath, file);
      if (fs.lstatSync(currentPath).isDirectory()) {
        // Recurse if directory
        deleteDirectorySync(currentPath);
      } else {
        // Delete file
        fs.unlinkSync(currentPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

export function writeStringToFile(filePath: string, content: string) {
  try {
    fs.writeFileSync(filePath, content);
    console.log("File written successfully");
  } catch (err) {
    console.error("Error writing file:", err);
  }
}
