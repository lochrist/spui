# spui

## Goals
- DOM (not vdom) ui library
- Use a mithril like syntax
- Handles patching of dom element
- Handles list of elements
- Should handle spui.if for branch of child

## Questions?
- Will it cost too much in terms of bindings? too many bindings? similar to angular...
- Could we have bindings that are sharable?
- How to make update performant when using 2 way data binding (when the ui sets the data, we do not want to reupdate the data)

## Hackday
- Basic html
- emitter/signal
- S root like to catch signal