import { createApp } from "./app";
import { PORT } from "./config";

const app = await createApp();

app.listen(PORT);
// eslint-disable-next-line no-console
console.log(`Server run on http://localhost:${PORT}`);
