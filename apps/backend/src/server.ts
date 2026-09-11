import Fastify, { type FastifyInstance } from "fastify";

// Split out from index.ts so tests can build the app (and use Fastify's
// .inject() to fire fake requests) without actually binding a network port.
export function buildServer(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
