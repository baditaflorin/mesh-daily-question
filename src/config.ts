import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-daily-question",
  displayName: "Daily Question",
  visualProfile: "gather",
  shellLayout: "inset",
  description: "A browser-local daily question room for one thoughtful answer per peer.",
  accentHex: "#92f0e2",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
