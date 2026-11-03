export interface EmulatedMedia {
  forcedColors?: 'active' | 'none' | null;
  reducedMotion?: 'reduce' | 'no-preference' | null;
}

export interface BrowserCommands {
  emulateMedia: (media: EmulatedMedia) => Promise<void>;
  forcePseudoState: (
    selector: string,
    pseudoClasses: string[],
  ) => Promise<void>;
}

/**
 * Returns the browser controls defined in `packages/storybook/.storybook/browserCommands.mjs`.
 *
 * @returns The commands during a Vitest run, or `undefined` in the Storybook UI, where only a real browser's own settings apply.
 */
export function getBrowserCommands(): BrowserCommands | undefined {
  return (globalThis as { dyBrowserCommands?: BrowserCommands })
    .dyBrowserCommands;
}
