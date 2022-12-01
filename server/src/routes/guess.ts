import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export const gessRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/guesses/count", async () => {
    const count = await prisma.guess.count();
    return { count };
  });
  fastify.post(
    "/pools/:poolId/games/:gameId/guesses",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const createGuessParams = z.object({
        poolId: z.string(),
        gameId: z.string(),
      });
      const createGuessBody = z.object({
        firstTeamPoint: z.number(),
        secondTeamPoint: z.number(),
      });
      const { poolId, gameId } = createGuessParams.parse(request.params);
      const { firstTeamPoint, secondTeamPoint } = createGuessBody.parse(
        request.body
      );
      const participant = await prisma.participant.findUnique({
        where: {
          userId_poolsId: {
            poolsId: poolId,
            userId: request.user.sub,
          },
        },
      });
      if (!participant) {
        return reply
          .status(400)
          .send({ message: "You are not a participant of this pool!" });
      }
      const guess = await prisma.guess.findUnique({
        where: {
          gameId_participantId: {
            participantId: participant.id,
            gameId,
          },
        },
      });
      if (guess) {
        return reply
          .status(400)
          .send({ message: "You already guessed this game!" });
      }

      const game = await prisma.game.findUnique({
        where: {
          id: gameId,
        },
      });
      if (!game) {
        return reply.status(400).send({ message: "Game not found!" });
      }
      if (game.date < new Date()) {
        return reply
          .status(400)
          .send({ message: "You can not sen guess after the game date" });
      }
      await prisma.guess.create({
        data: {
          gameId,
          participantId: participant.id,
          firstTeamPoint,
          secondTeamPoint,
        },
      });
      return reply.status(201).send();
    }
  );
};
