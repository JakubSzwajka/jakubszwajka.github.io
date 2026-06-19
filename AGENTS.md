# Repo Agent Notes

## Content pipeline boundary

This repo is the public Astro blog and portfolio, not the private writing pipeline.

- Private evidence, harvest logs, source pointers, fragments, source-safety reviews, and unpublished shaping work belong in `/Users/kuba.szwajka/DEV/priv/career`.
- Blog candidates should be shaped in `/Users/kuba.szwajka/DEV/priv/career/docs/artifacts/blog-candidates/<slug>/`.
- Export into this repo only after source-safety review, normally to `src/content/blog/<slug>.md`.
- Do not add local private repo paths, customer context, raw harvest logs, or private source pointers to this repo.
- Existing `docs/` writing-pipeline files are legacy/migration artifacts unless Kuba explicitly asks to use them.
- When planning future blog candidates, treat precise implementation-trap posts as the current strongest public signal: Python/FastAPI/Pydantic-style posts that solve specific integration problems. Keep planning and source review in `/Users/kuba.szwajka/DEV/priv/career`; export only after source-safety review.

## Visual/layout fixes

When changing layout, especially blog post chrome, verify the actual rendered boxes in the browser before claiming the fix is done. Check the relevant container and child element bounding boxes separately: page wrapper, section/silo, text/content children, and any side chrome such as the table of contents.

If the user says a layout element is in the wrong “silo” or should be “next to it,” clarify which boundary they mean before editing: the readable text column, the post section, or the main app `.wrapper`. Do not assume these are the same.

For this blog, the main app silo is `.wrapper` (`max-width: 1200px`). Blog post side chrome such as the ToC may intentionally sit outside `.wrapper` on very wide screens, while post content sections can still span the wrapper.
