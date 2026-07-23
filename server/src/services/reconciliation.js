import { prisma } from '../lib/prisma.js';
import { parseBkashSms } from '../lib/smsParser.js';
import { tryMatchPayments } from './paymentMatcher.js';

/**
 * Ingest one raw SMS from a device: log it, parse it, reconcile the balance,
 * and (if verified) attempt to complete any matching payment request.
 *
 * Reconciliation is the security core: we recompute the expected new balance
 * from the *stored* balance plus the reported amount and fee. If it matches
 * the balance the bank reported, the transaction is VERIFIED. Otherwise it is
 * recorded as UNRECONCILED (a missed/out-of-order SMS or tampering) and cannot
 * complete a payment.
 *
 * @returns {{ status: string, transaction?: object, payment?: object }}
 */
export async function ingestSms({ device, sender, body, receivedAt }) {
  const sms = await prisma.smsMessage.create({
    data: {
      deviceId: device.id,
      sender: sender ?? 'unknown',
      body,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
    },
  });

  const parsed = parseBkashSms(body);
  if (!parsed) {
    await prisma.smsMessage.update({
      where: { id: sms.id },
      data: { parsed: false, parseError: 'no matching template' },
    });
    return { status: 'IGNORED', reason: 'unrecognized SMS' };
  }

  // Resolve which bKash account this SMS belongs to.
  const account = await resolveAccount(device);
  if (!account) {
    await prisma.smsMessage.update({
      where: { id: sms.id },
      data: { parsed: true, parseError: 'no bKash account bound to device' },
    });
    return { status: 'ERROR', reason: 'device has no bKash account' };
  }

  // Duplicate guard on trxId.
  const existing = await prisma.transaction.findUnique({
    where: { trxId: parsed.trxId },
  });
  if (existing) {
    await prisma.smsMessage.update({
      where: { id: sms.id },
      data: { parsed: true, parseError: 'duplicate trxId' },
    });
    return { status: 'DUPLICATE', transaction: existing };
  }

  // Reconcile: does storedBalance + amount - fee == reportedBalance?
  const balanceBefore = account.currentBalance;
  const expectedAfter = balanceBefore + parsed.amount - parsed.fee;
  const reconciled = expectedAfter === parsed.balanceAfter;

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        bkashAccountId: account.id,
        smsMessageId: sms.id,
        trxId: parsed.trxId,
        amount: parsed.amount,
        fee: parsed.fee,
        senderPhone: parsed.senderPhone,
        balanceBefore,
        balanceAfter: parsed.balanceAfter,
        status: reconciled ? 'VERIFIED' : 'UNRECONCILED',
        occurredAt: parsed.occurredAt,
      },
    });

    // Always advance stored balance to the bank's reported truth so future
    // reconciliations stay aligned even after a hiccup.
    await tx.bkashAccount.update({
      where: { id: account.id },
      data: { currentBalance: parsed.balanceAfter },
    });

    await tx.smsMessage.update({ where: { id: sms.id }, data: { parsed: true } });
    await tx.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    return transaction;
  });

  let payment = null;
  if (reconciled) {
    payment = await tryMatchPayments(result);
  }

  return {
    status: reconciled ? 'VERIFIED' : 'UNRECONCILED',
    transaction: result,
    payment,
  };
}

async function resolveAccount(device) {
  if (device.bkashAccountId) {
    return prisma.bkashAccount.findUnique({ where: { id: device.bkashAccountId } });
  }
  // Fall back to the user's primary (first active) account.
  return prisma.bkashAccount.findFirst({
    where: { userId: device.userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
}
