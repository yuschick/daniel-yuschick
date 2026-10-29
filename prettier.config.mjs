/**
 * The shared Prettier configuration for the whole repository. Prettier finds
 * it by walking up from each file, so packages don't need their own.
 *
 * @type {import('prettier').Config}
 */
const config = {
  singleQuote: true,
};

export default config;
