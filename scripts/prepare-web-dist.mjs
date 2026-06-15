import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve("apps/web/dist");
const adminDir = resolve(distDir, "admin");

mkdirSync(adminDir, { recursive: true });
copyFileSync(resolve(distDir, "index.html"), resolve(adminDir, "index.html"));
