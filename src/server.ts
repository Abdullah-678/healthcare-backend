import { app } from "./app";
import { envVars } from "./config/env";

const port = 5000; // The port your express server will be running on.

const bootStrap = () => {
  try {
    // Start the server
    app.listen(envVars.PORT, () => {
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    });
  } catch (err) {
    console.error("server failed");
  }
};

bootStrap();
