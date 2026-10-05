// Fontsource subpath CSS imports (e.g. "@fontsource-variable/league-gothic/wdth") resolve via package exports at build time.
declare module "@fontsource-variable/*";
declare module "@fontsource/*";

declare namespace App {
  interface Locals {
    user: import("./lib/auth/session").SessionUser | null;
  }
}
