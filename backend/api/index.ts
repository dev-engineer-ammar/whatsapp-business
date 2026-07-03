import { createApp } from "../src/app.js";
import { connectToDatabase } from "../src/config/database.js";

await connectToDatabase();

const app = createApp();

export default app;