# Limits

What `/spec` can't prove, or proves only in part.

- It accepts a component or component set only. Any other node type stops the extractor.
- Hidden layers are listed, not summarized, so anything inside them needs a question before it's used.
- The checks can't tell whether a token is the right choice, only that it exists and matches Figma.
- Figma results are capped at 48KB. A larger component fails rather than truncating, and the extractor would need to split its output.
- Setting a Figma component's description through a script can re-encode its text, so ask the approver to edit descriptions by hand.
