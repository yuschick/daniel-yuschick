# Limits

What `/spec` can't prove, or proves only in part.

- It accepts a component or component set only. Any other node type stops the extractor.
- Hidden layers are listed, not summarized, so anything inside them needs a question before it's used.
- The checks can't tell whether a token is the right choice, only that it exists and matches Figma.
- Figma results are capped at 48KB. A larger component fails rather than truncating, and the extractor would need to split its output.
- An illustration, a frame or group holding only vector shapes such as an imported SVG, is reported as one layer with its size and shape count. Its shapes' fills and geometry aren't read, hidden shapes inside it included, so the spec must say how the illustration reaches code, for example as an SVG asset exported from Figma. A shape container with no vector or boolean layer, such as a group of rectangles, is still walked layer by layer.
- Setting a Figma component's description through a script can re-encode its text, so ask the approver to edit descriptions by hand.
