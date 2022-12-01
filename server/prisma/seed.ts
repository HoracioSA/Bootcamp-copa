import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.create({
    data: {
      email: "John@example.com",
      name: "John Doe",
      avatarUrl: "https://github.com/HorecioSA.png",
    },
  });
  const pool = await prisma.pools.create({
    data: {
      title: "Exemple Pool",
      code: "Bol0089",
      ownerId: user.id,
      participants: {
        create: {
          userId: user.id,
        },
      },
    },
  });
  await prisma.game.create({
    data: {
      date: "2022-11-05T17:08:45.845Z",
      firstCountryIsoCode: "GB",
      secondCountryIsoCode: "PT",
    },
  });
  await prisma.game.create({
    data: {
      date: "2022-11-05T17:08:45.845Z",
      firstCountryIsoCode: "US",
      secondCountryIsoCode: "AG",
      guesses: {
        create: {
          firstTeamPoint: 2,
          secondTeamPoint: 3,
          participant: {
            connect: {
              userId_poolsId: {
                userId: user.id,
                poolsId: pool.id,
              },
            },
          },
        },
      },
    },
  });
}

main();
