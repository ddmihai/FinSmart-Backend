import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import { createDefaultAccountForUser } from '../services/accountService.js';
import { createTransaction } from '../services/transactionService.js';
import { upsertBudget } from '../services/budgetService.js';

async function main() {
  await connectDB();
  const passwordHash = await bcrypt.hash('Password123!', 12);
  let user = await User.findOne({ email: 'demo@finsmart.test' });
  if (!user) user = await User.create({ email: 'demo@finsmart.test', name: 'Demo User', passwordHash });
  const acc = await createDefaultAccountForUser(user._id as any);
  // a few sample transactions
  await createTransaction({ accountId: acc._id as any, type: 'income', amount: 250000, name: 'Salary', category: 'Salary' });
  await createTransaction({ accountId: acc._id as any, type: 'expense', amount: 3200, name: 'Coffee', category: 'Food' });
  await createTransaction({ accountId: acc._id as any, type: 'expense', amount: 58000, name: 'Rent', category: 'Rent' });
  await createTransaction({ accountId: acc._id as any, type: 'expense', amount: 12000, name: 'Groceries', category: 'Food' });
  // budgets
  await upsertBudget(user._id as any, 'Food', 100000);
  await upsertBudget(user._id as any, 'Rent', 800000);
  // eslint-disable-next-line no-console
  console.log('Seeded demo user & data:', user.email);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
