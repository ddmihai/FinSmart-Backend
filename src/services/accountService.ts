import { Account } from '../models/Account.js';
import { Card } from '../models/Card.js';
import { generateCardNumber, generateCVV, generateExpiry, generateUKAccountNumber, generateUKSortCode } from '../utils/generators.js';
import { Types } from 'mongoose';

export async function createDefaultAccountForUser(userId: Types.ObjectId) {
  const acc = await Account.create({
    user: userId,
    type: 'Basic',
    sortCode: generateUKSortCode(),
    accountNumber: generateUKAccountNumber(),
    balance: 0
  });
  const { month, year } = generateExpiry();
  await Card.create({
    account: acc._id,
    number: generateCardNumber(),
    cvv: generateCVV(),
    expiryMonth: month,
    expiryYear: year,
    active: true
  });
  return acc;
}

export async function issueReplacementCard(accountId: Types.ObjectId) {
  await Card.updateMany({ account: accountId, active: true }, { $set: { active: false } });
  const { month, year } = generateExpiry();
  const card = await Card.create({
    account: accountId,
    number: generateCardNumber(),
    cvv: generateCVV(),
    expiryMonth: month,
    expiryYear: year,
    active: true
  });
  return card;
}

