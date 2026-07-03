// Toggle native desktop fullscreen for the whole app. The actual `fullscreen`
// flag is kept in sync by a `fullscreenchange` listener in App.tsx, so this just
// requests/exits.
export function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}
