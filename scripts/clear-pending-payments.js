import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPendingPayments() {
  try {
    console.log('Clearing all pending payments...');

    const result = await prisma.paymentOrder.deleteMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      }
    });

    console.log(`Deleted ${result.count} pending payment orders`);

    // Also clean up any related transactions and refunds that reference deleted orders
    const orphanedTransactions = await prisma.paymentTransaction.findMany({
      where: {
        orderId: {
          notIn: (await prisma.paymentOrder.findMany({ select: { id: true } })).map(o => o.id)
        }
      }
    });

    if (orphanedTransactions.length > 0) {
      await prisma.paymentTransaction.deleteMany({
        where: {
          id: { in: orphanedTransactions.map(t => t.id) }
        }
      });
      console.log(`Deleted ${orphanedTransactions.length} orphaned transactions`);
    }

    const orphanedRefunds = await prisma.paymentRefund.findMany({
      where: {
        orderId: {
          notIn: (await prisma.paymentOrder.findMany({ select: { id: true } })).map(o => o.id)
        }
      }
    });

    if (orphanedRefunds.length > 0) {
      await prisma.paymentRefund.deleteMany({
        where: {
          id: { in: orphanedRefunds.map(r => r.id) }
        }
      });
      console.log(`Deleted ${orphanedRefunds.length} orphaned refunds`);
    }

    console.log('Pending payments cleared successfully!');
  } catch (error) {
    console.error('Error clearing pending payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPendingPayments();