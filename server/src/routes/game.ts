import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export const gameRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    "/pools/:id/games",
    { onRequest: [authenticate] },
    async (req, reply) => {
      const getPoolParams = z.object({
        id: z.string(),
      });
      const { id } = getPoolParams.parse(req.params);
      const games = await prisma.game.findMany({
        orderBy: {
          date: "desc",
        },
        include: {
          guesses: {
            where: {
              participant: {
                userId: req.user.sub,
                poolsId: id,
              },
            },
          },
        },
      });
      return {
        games: games.map((game) => {
          return {
            ...game,
            guess: game.guesses.length > 0 ? game.guesses[0] : null,
            guesses: undefined,
          };
        }),
      };
    }
  );
  fastify.post("/games", { onRequest: [authenticate] }, async (req, reply) => {
    const createGameBody = z.object({
      date: z.string(),
      firstCountryIsoCode: z.string(),
      secondCountryIsoCode: z.string(),
    });
    const { date, firstCountryIsoCode, secondCountryIsoCode } =
      createGameBody.parse(req.body);
    await prisma.game.create({
      data: {
        date,
        firstCountryIsoCode,
        secondCountryIsoCode,
      },
    });
    return reply.status(201).send();
  });
};
