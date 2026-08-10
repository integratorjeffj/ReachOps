import { PrismaClient } from '@prisma/client';
import { resetSummitAndSage, seedSummitAndSage } from './seed-service';

async function main(): Promise<void> {
  const command = process.argv[2];
  const prisma = new PrismaClient();

  try {
    const summary =
      command === 'reset'
        ? await resetSummitAndSage(prisma)
        : command === 'seed'
          ? await seedSummitAndSage(prisma)
          : null;

    if (!summary) {
      throw new Error('Usage: demo seed CLI requires either "seed" or "reset".');
    }

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown demo seed failure.';
  console.error(message);
  process.exitCode = 1;
});
