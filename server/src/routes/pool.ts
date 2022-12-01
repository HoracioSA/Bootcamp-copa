import { FastifyInstance } from "fastify";
import ShortUniqueId from "short-unique-id";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export const pollRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/pools/count", async () => {
    const count = await prisma.pools.count();
    return { count };
  });
  fastify.get(
    "/pools",
    {
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const pools = await prisma.pools.findMany({
        where: {
          participants: {
            some: {
              userId: req.user.sub,
            },
          },
        },
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  avatarUrl: true,
                },
              },
            },
            take: 4,
          },
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      return { pools };
    }
  );
  fastify.post("/pools", async (request, reply) => {
    const createPoolsBody = z.object({
      title: z.string(),
    });
    const { title } = createPoolsBody.parse(request.body);
    const generator = new ShortUniqueId({ length: 6 });
    const code = String(generator()).toUpperCase();
    try {
      await request.jwtVerify();
      await prisma.pools.create({
        data: {
          title,
          code,
          ownerId: request.user.sub,
          participants: {
            create: {
              userId: request.user.sub,
            },
          },
        },
      });
    } catch (error) {
      await prisma.pools.create({
        data: {
          title,
          code,
        },
      });
    }

    return reply.status(201).send({ code });
  });
  fastify.post(
    "/pools/join",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const joinPoolBody = z.object({
        code: z.string(),
      });
      const { code } = joinPoolBody.parse(request.body);
      const pool = await prisma.pools.findUnique({
        where: {
          code,
        },
        include: {
          participants: {
            where: {
              userId: request.user.sub,
            },
          },
        },
      });
      if (!pool) {
        return reply.status(400).send({ message: "Pool not found" });
      }
      if (pool.participants.length > 0) {
        return reply
          .status(400)
          .send({ message: "You already joined in this pool" });
      }
      if (!pool.ownerId) {
        await prisma.pools.update({
          where: {
            id: pool.id,
          },
          data: {
            ownerId: request.user.sub,
          },
        });
      }
      await prisma.participant.create({
        data: {
          poolsId: pool.id,
          userId: request.user.sub,
        },
      });
    }
  );
  fastify.get(
    "/pools/:id",
    { onRequest: [authenticate] },
    async (req, reply) => {
      const getPoolParams = z.object({
        id: z.string(),
      });
      const { id } = getPoolParams.parse(req.params);
      const pool = await prisma.pools.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  avatarUrl: true,
                },
              },
            },
            take: 4,
          },
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      return { pool };
    }
  );
};
