import Fastify from "fastify";
import cors from "@fastify/cors";
import { pollRoutes } from "./routes/pool";
import { gessRoutes } from "./routes/guess";
import { userRoutes } from "./routes/user";
import { gameRoutes } from "./routes/game";
import { authRoutes } from "./routes/auth";
import jwt from "@fastify/jwt";
async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });
  await fastify.register(cors, {
    origin: true,
  });
  await fastify.register(jwt, {
    secret: "nlwcopa",
  });
  await fastify.register(pollRoutes);
  await fastify.register(authRoutes);
  await fastify.register(gessRoutes);
  await fastify.register(userRoutes);
  await fastify.register(gameRoutes);

  await fastify.listen({ port: 3333 });
}

bootstrap();
