/**
 * Reads a spec into its front matter and sections, each with its text and table
 * rows. Shared by `/spec`, which writes specs, and `/implement`, which builds them.
 *
 * @param {string} markdown
 */
export function parseSpec(markdown) {
  const frontMatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  const meta = Object.fromEntries(
    (frontMatter ? frontMatter[1].split('\n') : []).map((line) => {
      const [key, ...value] = line.split(':');
      return [key.trim(), value.join(':').trim()];
    }),
  );

  const sections = new Map();
  let current = null;
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = { text: [], rows: [] };
      sections.set(heading[1], current);
    } else if (current) {
      current.text.push(line);
      if (/^\|/.test(line) && !/^\|\s*:?-/.test(line)) {
        current.rows.push(
          line
            .slice(1, -1)
            .split(/(?<!\\)\|/)
            // An escaped pipe is part of the cell, such as a union in a type.
            .map((cell) =>
              cell.trim().replaceAll('`', '').replaceAll('\\|', '|'),
            ),
        );
      }
    }
  }
  return { meta, sections };
}
