const appId = import.meta.env.VITE_PRIVY_APP_ID;

export function PrivySetupNotice() {
  if (appId) return null;

  return (
    <div className="pointer-events-auto mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-center text-sm text-amber-200">
      Add <code className="rounded bg-black/20 px-1.5 py-0.5 text-amber-100">VITE_PRIVY_APP_ID</code> to{" "}
      <code className="rounded bg-black/20 px-1.5 py-0.5 text-amber-100">.env.local</code>
    </div>
  );
}
