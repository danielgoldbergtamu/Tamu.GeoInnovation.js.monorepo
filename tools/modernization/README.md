# Modernization working scripts

Scripts written while doing the signals and OnPush steps of #1218. They are working tools, not tested
utilities: read one before running it. Paths are arguments; none is tied to a machine.

| Script | What it does |
| --- | --- |
| `sig-volume.sh` | Runs one Angular signal migration inside a check volume's clone (`/w`) and writes the result as a patch to `/logs`. Env: `MIGRATION`, `OPTS`, `LIBS=yes` for the second pass over libraries with no build target. Over a Windows bind mount one run took an hour; in a volume, about nine minutes. |
| `strip-skip-todos.py <repo> <out.tsv>` | Removes the migration's "TODO: Skipped for migration" comments and writes what they said to a list. |
| `classify-writes.py <repo> <skipped.tsv>` | For inputs skipped because code writes to them, finds where the writes are (specs, the component itself, a parent). |
| `specs-set-input.py <repo>` | Rewrites `component.x = v` in specs that have a fixture to `fixture.componentRef.setInput('x', v)`. |
| `onpush-scan.py <repo> <path prefix> [--list] [--apply]` | Sorts the components under a path by what OnPush would do to them; `--apply` removes `ChangeDetectionStrategy.Eager` from the ones it finds nothing against. |
| `onpush-read.py <repo> <path prefix>` | Of the components the scan clears, lists any that write a field outside `ngOnInit` and the constructor. |
| `probe-app.js <base url> <path>...` | Loads each page in a fresh tab in the Playwright container and prints its heading, text length and errors: the browser check for a change no unit test can see. |
| `file-issue.sh <title> <body file> <label> <type> <priority> "<projects>" [parent]` | Files an issue with every field CLAUDE.md asks for. Priority is still asked of the maintainer first. |
