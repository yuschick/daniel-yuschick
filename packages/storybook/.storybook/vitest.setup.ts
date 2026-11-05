import { commands } from 'vitest/browser';

// Stories also run in the Storybook UI, where `vitest/browser` doesn't exist, so
// they reach these through a global set only during a test run.
Object.assign(globalThis, { dyBrowserCommands: commands });
