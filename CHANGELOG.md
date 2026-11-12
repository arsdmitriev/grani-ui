# Changelog

Before 1.0 a minor version may include a breaking change; its section then says how to move.

## 0.2.1 — 2026-11-12

UiQuiz moves from experimental to stable, with fixes to controlled values, keyboard interaction and
accessibility.

- Changed UiQuiz: moved from experimental to stable.
- Changed UiQuiz: renamed `sendLabel` to `submitLabel`. `sendLabel` is deprecated, remains supported
  throughout 0.2.x and will be removed in 0.3.0.
- Fixed UiQuiz: the submitted answers include every question, with `null` or `[]` for one left
  unanswered, as documented. In 0.2.0 an optional question passed with Next was missing from the
  object.
- Fixed UiQuiz: if the parent rejects a selection, the quiz restores the controlled value and keeps
  its visual and accessible states in sync.
- Fixed UiQuiz: tabbing through the custom answer field no longer selects its text as the answer.
  Clicking the field, pressing its shortcut key or typing does.
- Fixed UiQuiz: a long unbroken word in a question or an answer wraps inside its tile.
- Fixed UiQuiz: a `#done` slot provided after submission is rendered.
- Fixed UiQuiz: a numpad key that acts as an arrow with NumLock off no longer selects an answer.
- Fixed UiRadioGroup: keyboard focus on a card option is outlined in forced-colors mode. The same
  applies to quiz tiles.

## 0.2.0 — 2026-11-12

UiQuiz presents one question at a time, with answer tiles, keyboard shortcuts, and a custom answer
field.

- Added UiQuiz: define questions as data, with single or multiple selection and optional custom
  answers.
- Added UiQuiz keys: choose answers with number or letter keys, press Enter to continue, and skip
  optional questions.
- Added UiQuiz sending: the quiz awaits submission, prevents duplicate requests while sending, and
  keeps the answers if submission fails.
- Added UiQuiz progress: a segmented top edge and a question counter track progress;
  `variant="plain"` removes the card frame inside UiModal or UiDrawer.
- Fixed Panels: a list, a menu or a popover opened while its trigger is still sliding in with a
  drawer is shown once the trigger is in place. Previously it stayed hidden while reporting itself
  open.

## 0.1.0 — 2026-10-27

The first version brings 95 interaction patterns for admin apps, each with a live example, and
63 Vue components that implement them.

A pattern describes what a person gets on the screen: where keyboard focus goes, what stays in view
during a request, how a rejected value or a finished action is reported.

- Added Patterns: 95 patterns in six chapters, from keyboard focus and loading states to errors
  and feedback; each has a live example, names the components that keep it, and most are backed
  by tests.
- Added Components: 63 components and blocks on Vue 3.5 and Tailwind CSS 4, each with its API and a
  complete example.
- Added grani-ui/test: five Playwright checks an app runs on its own screens; a failed check names the
  pattern and the chapter that explains it.
- Added useListAddress: keeps a list's search, sort, page and filters in the page's URL, so a
  reload, a shared link or Back opens the list as it was.
- Added llms.txt: the patterns and the components as text for coding agents, read from
  `node_modules` and matching the installed version.
- Added Registry: `aka`, the other names a component goes by (accordion for UiReveal, toggle for
  UiSwitch); the showcase's search, the component's page and llms.txt use them.
- Changed UiDataTable: a `money` column aligns to the end by itself, digit under digit, and
  `align: 'start'` keeps it at the start.
