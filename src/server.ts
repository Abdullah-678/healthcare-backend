import { app } from "./app.js";
import { seedSuperAdmin } from "./app/utils/seed";
import { envVars } from "./config/env";

const bootStrap = async () => {
  try {
    await seedSuperAdmin();
    app.listen(envVars.PORT, () => {
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exitCode = 1;
  }
};

bootStrap();
