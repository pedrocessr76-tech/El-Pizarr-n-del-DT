// Global test teardown to prevent open handles leaking between test runs
afterAll(async () => {
  // Give any pending promises/microtasks a chance to flush
  await new Promise((resolve) => setImmediate(resolve));
  
  // Force close any remaining handles (timers, connections, etc.)
  // This is a safety net - individual tests should clean up their own resources
  const timers = (global as any).timers || [];
  for (const timer of timers) {
    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }
    if (timer && typeof timer.close === 'function') {
      try { timer.close(); } catch { }
    }
  }
  
  // Allow event loop to process any final cleanup
  await new Promise((resolve) => setImmediate(resolve));
});

// Suppress unhandled rejection warnings during tests (they're expected in some error-path tests)
process.on('unhandledRejection', (reason) => {
  // Ignore expected test errors
  if (reason instanceof Error && reason.message?.includes('provider down')) return;
  if (reason instanceof Error && reason.message?.includes('smtp caído')) return;
  if (reason instanceof Error && reason.message?.includes('db caída')) return;
  if (reason instanceof Error && reason.message?.includes('redis offline')) return;
  console.warn('Unhandled rejection in test:', reason);
});