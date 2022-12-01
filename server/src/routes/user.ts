import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export const userRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/users", async () => {
    const users = await prisma.user.findMany();
    return { users };
  });
};
