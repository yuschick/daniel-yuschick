import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only unmounts rendered hooks and components between tests
// on its own when the runner exposes `afterEach` as a global. Tests here
// import from 'vitest' explicitly, so do it by hand.
afterEach(() => {
  cleanup();
});
