// Next.js calls `register()` once when the server process starts.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export async function register() {
  // Guard against running in the edge runtime or during the build step —
  // node-cron and Prisma both require the Node.js runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startLoyverseSyncScheduler } = await import('@/lib/integrations/loyverse/scheduler')
    startLoyverseSyncScheduler()
  }
}
