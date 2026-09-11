import { buildServer } from "./server";

const PORT = Number(process.env.PORT ?? 4000);

const app = buildServer();

app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => {
    console.log(`acontabill backend listening on port ${PORT}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
