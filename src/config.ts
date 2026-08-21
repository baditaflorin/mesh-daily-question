import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-daily-question",
  description: "A browser-local daily question room for one thoughtful answer per peer.",
  accentHex: "#f4b942",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
