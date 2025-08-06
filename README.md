# note_app

Features to implement:
- real-time collaboration
- voice entry-to-text (implemented)
- streak tracker for journaling, days active
- sound effects e.g. typewriter sound effects for typing
- hand-drawn sketches
- focus mode hides extra features (implemented)
- commands: e.g. cmd+s = save note

AI features:
- summarize documents after idle (scrapped, would result in too many calls)
- summarize weekly journal entries
- auto-generate document outline, summarize note

Design features:
- hold to confirm (framer example), (implemented for logout)
- swipe to mark task as finished, good for journaling, to-do lists
- Framer magnetic target cursor feature
- sliding nav bar
- add loading screens and transitions to prevent flicker

i want to implement the following features, similar to our pomodoro timer and activity calendar, rather than adding the ai summary to the content of the text in the editor, i want to create a component that pops out when the AI summarizer is used, i want fire-base to keep ai summaries associated with notes where users can find the ai summarizer content