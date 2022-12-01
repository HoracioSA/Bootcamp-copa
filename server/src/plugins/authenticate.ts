import { FastifyRequest } from "fastify";

export const authenticate = async (req: FastifyRequest) => {
  await req.jwtVerify();
};
