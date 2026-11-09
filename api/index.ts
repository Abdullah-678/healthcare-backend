import { register } from "tsx/esm/api";

register();

const { default: app } = await import("../src/app.js");
export default app;
