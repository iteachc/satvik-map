# Notes for Claude

## Link previews (Telegram, WhatsApp, Discord)

Lessons from getting the previews to work:

- **Telegram skips the preview if the page is too big.** It gave up on the ~2.2 MB doubts page
  even though the Open Graph tags were right at the top; Discord showed it fine. Keep `index.html`
  small (tens of KB) and load bulky data from a separate file (the doubts site uses `threads.json`).
- **Telegram saves each link's preview and keeps reusing it.** After changing the page, send the
  link to **@WebpageBot** in Telegram to refresh it, then re-share.
- **GitHub Pages can serve the old copy for up to ~10 minutes after a deploy.** Refreshing too
  soon re-saves the old preview. To test right away, share the link with `?v=2` (any new value)
  on the end: that fetches a fresh copy and Telegram treats it as a new link.
- No `og:image` means a text-only card; add a 1200×630 picture for a big preview.
- This cloud environment can't open `*.github.io` (network policy), so check the published
  files via the Actions run, or ask the owner to open the page.

## Testing on phones

- **Test scrolling with real finger swipes, not code.** `window.scrollTo` and `scrollTop`
  move a page that a finger can't (e.g. `overflow: hidden` on html/body), so a code-only
  test passes while the site is stuck on a real phone (Satvik Map list, 2026-10-08).
- In Playwright, swipe with raw touch events over CDP: `Input.dispatchTouchEvent` with a
  `touchStart`, a run of `touchMove` steps, then `touchEnd`, and read `scrollY` after.
  `Input.synthesizeScrollGesture` and `mouse.wheel` don't scroll in headless phone emulation.
- Reproduce the bug on the live version first, then show the fix passes the same test.
- The cloud environment blocks cdnjs: for tests, serve libraries from npm (`npm pack`)
  through `page.route`, and strip the `integrity` attributes.
