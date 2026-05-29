import { runRecurringGeneration } from '../server/services/recurringScheduler.ts';

await runRecurringGeneration();
console.log('Recurring generation complete.');
process.exit(0);
