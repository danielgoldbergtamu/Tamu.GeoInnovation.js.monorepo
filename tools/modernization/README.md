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

## Added on 12 October: probes used for the smoke suite and the map bugs

Each runs in the smoke suite's Playwright container, with `tamu-js-smoke-nm` mounted over `node_modules`.

| Script | What it does |
| --- | --- |
| `shot.js <url> <out.png> [selector] [settle ms] [click text]` | One screenshot after a selector appears. `SAVED_BASEMAP=<id>` stands in for a visitor who chose that basemap before. |
| `probe-legend.js <url> <out dir> [name]` | Lists each legend entry with its swatch's kind and size and saves the legend. `PORTAL_DELAY_MS` holds back portal symbology, which is how #1721 was reproduced on demand. |
| `probe-perspective.js <url> <out dir> <label>` | Switches a map 2D, 3D, 2D and prints where it is looking and how long the map area stayed blank at each step (#1724, #1732). |
| `probe-paint.js <base url> <path>...` | Times successive screenshots of the map surface, as the suite's paint check takes them; run with `docker run --cpus 1` to see #1716. |
| `resize-png.js <in> <out> <width> <height>` | Resamples an image in a browser canvas; the host has no image library. |
| `quick-set-count.py <smoke log> [workers]` | Counts a proposed quick set against a full run's log, with each group's summed test time. |
| `az-releases.py` | Prints AggieMap's latest Azure releases and their stages. Reads the token from the `AZ_PAT` environment variable; never prints it. |
