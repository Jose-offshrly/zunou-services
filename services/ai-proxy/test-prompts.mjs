// Test script to see what prompts and tools look like
// Run with: node test-prompts.mjs

import { getDelegatedCapabilitySummary, DELEGATE_ACTION_TOOL, getDirectTools, getHybridStats } from './tools.mjs';
import { buildVoiceDailyDebriefPrompt, buildVoiceDayPrepPrompt } from './prompts.mjs';

console.log('='.repeat(80));
console.log('DELEGATE_ACTION_TOOL DEFINITION');
console.log('='.repeat(80));
console.log(JSON.stringify(DELEGATE_ACTION_TOOL, null, 2));

console.log('\n' + '='.repeat(80));
console.log('DELEGATED CAPABILITIES SUMMARY (what Voice Agent sees)');
console.log('='.repeat(80));
console.log(getDelegatedCapabilitySummary());

console.log('\n' + '='.repeat(80));
console.log('HYBRID MODE STATS');
console.log('='.repeat(80));
const stats = getHybridStats('daily-debrief');
console.log(JSON.stringify(stats, null, 2));

console.log('\n' + '='.repeat(80));
console.log('DIRECT TOOLS (Voice Agent has these directly)');
console.log('='.repeat(80));
const directTools = getDirectTools('daily-debrief');
console.log(`Count: ${directTools.length}`);
console.log('Names:', directTools.map(t => t.name).join(', '));

console.log('\n' + '='.repeat(80));
console.log('VOICE DAILY DEBRIEF PROMPT (with hybrid/delegated section)');
console.log('='.repeat(80));
const debriefPrompt = buildVoiceDailyDebriefPrompt({
  user_context: 'John is a VP of Product at a tech company. Prefers concise updates.',
  additional_context: {},
  debrief_context: {
    counts: { meetings_today: 3, tasks_overdue: 2, insights_attention: 1 },
    sections: { todayEvents: '9am: Team standup\n2pm: Product review\n4pm: 1:1 with CEO' }
  },
  delegated_capabilities: getDelegatedCapabilitySummary(),
  model: 'gpt-realtime',
  tool_count: stats.directCount + stats.delegatedCount
});
console.log(debriefPrompt);

console.log('\n' + '='.repeat(80));
console.log('VOICE DAY-PREP PROMPT (with hybrid/delegated section)');
console.log('='.repeat(80));
const dayPrepPrompt = buildVoiceDayPrepPrompt({
  user_context: 'John is a VP of Product.',
  day_context: {
    date: '2026-01-12',
    dayLabel: 'Monday',
    eventsCount: 2,
    eventsFormatted: '10am: Design Review (45 min)\n2pm: Sprint Planning (1 hr)'
  },
  delegated_capabilities: getDelegatedCapabilitySummary(),
  model: 'gpt-realtime',
  tool_count: stats.directCount + stats.delegatedCount
});
console.log(dayPrepPrompt);
