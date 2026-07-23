import { prisma } from '../src/lib/prisma.js';
import { hashPassword, deviceApiKey, publicApiKey, secretApiKey } from '../src/lib/tokens.js';
import { toPoisha } from '../src/lib/money.js';

// Demo data so the full verification flow can be exercised immediately.
async function main() {
  const email = 'demo@npay.test';
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: 'Demo Merchant',
      email,
      businessName: 'Demo Store',
      passwordHash: await hashPassword('password123'),
    },
  });

  // Opening balance 37.15 Tk so the demo SMS (received 3,000 -> balance
  // 3,037.15) reconciles exactly.
  const account = await prisma.bkashAccount.create({
    data: {
      userId: user.id,
      label: 'Main store wallet',
      accountNumber: '01700000000',
      currentBalance: toPoisha(37.15),
    },
  });

  const device = await prisma.device.create({
    data: {
      userId: user.id,
      bkashAccountId: account.id,
      name: 'Store counter phone',
      apiKey: deviceApiKey(),
    },
  });

  const secret = secretApiKey();
  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      label: 'Default integration key',
      publicKey: publicApiKey(),
      secretHash: await hashPassword(secret),
    },
  });

  console.log('Seeded demo data:');
  console.log('  login:        demo@npay.test / password123');
  console.log('  bKash account:', account.accountNumber, '(balance 37.15 Tk)');
  console.log('  device key:   ', device.apiKey);
  console.log('  api public:   ', apiKey.publicKey);
  console.log('  api secret:   ', secret);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
