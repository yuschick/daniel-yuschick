/*
 ** Check if the code is running on the server.
 */
export function isServer() {
  return typeof window === 'undefined';
}
