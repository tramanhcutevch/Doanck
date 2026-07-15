import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./api/_server.js";

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_PORT = Number(process.env.PORT || 3001);
const isMainModule = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isMainModule) {
  createApp().then((app) => {
    app.listen(DEFAULT_PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${DEFAULT_PORT}`);
    });
  });
}

export { createApp };
