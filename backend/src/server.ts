// import { createApp } from "./app.js";
// import { connectToDatabase } from "./config/database.js";
// import { env } from "./config/env.js";

// const bootstrap = async (): Promise<void> => {
//   await connectToDatabase();

//   const app = createApp();

//   app.listen(env.app.port, () => {
//     console.log(`Server running on port ${env.app.port}`);
//   });
// };

// bootstrap().catch((error) => {
//   console.error("Failed to start application.", error);
//   process.exit(1);
// });

import { createApp } from "./app.js";
import { connectToDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const bootstrap = async () => {
  await connectToDatabase();

  const app = createApp();

  app.listen(env.app.port, () => {
    console.log(`Server running on port ${env.app.port}`);
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});