# Repo Agent Notes

## Visual/layout fixes

When changing layout, especially blog post chrome, verify the actual rendered boxes in the browser before claiming the fix is done. Check the relevant container and child element bounding boxes separately: page wrapper, section/silo, text/content children, and any side chrome such as the table of contents.

If the user says a layout element is in the wrong “silo” or should be “next to it,” clarify which boundary they mean before editing: the readable text column, the post section, or the main app `.wrapper`. Do not assume these are the same.

For this blog, the main app silo is `.wrapper` (`max-width: 1200px`). Blog post side chrome such as the ToC may intentionally sit outside `.wrapper` on very wide screens, while post content sections can still span the wrapper.
