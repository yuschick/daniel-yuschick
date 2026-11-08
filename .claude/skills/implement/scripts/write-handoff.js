import { main } from '../../_shared/scripts/handoff.js';

// A build's PR is always a draft: marking it ready is the approver's call.
await main({ skill: 'implement', draft: true });
