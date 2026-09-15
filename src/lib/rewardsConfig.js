import { brandConfig } from "../config/brandConfig";

const rewards = brandConfig.rewards ?? {};

export const DISTRIBUTION_INTERVAL_HOURS = rewards.distributionIntervalHours ?? 6;
export const HOLDER_SPLIT_PERCENT = rewards.holderSplitPercent ?? 50;
export const PAYOUT_SCHEDULE_UTC = rewards.payoutScheduleUtc ?? "00:00 · 06:00 · 12:00 · 18:00 UTC";
export const PAYOUT_SHORT = rewards.payoutShort ?? "every 6 hours";
export const PAYOUT_LABEL = rewards.payoutLabel ?? "6-Hour SOL Cycles";
export const PAYOUT_DESCRIPTION =
  rewards.payoutDescription ??
  "Hold an Oppos Pass — 50% of creator fees are designed to be airdropped in SOL on a 6-hour clock. The payout job is not live yet.";

/** USD share for one holder over one payout interval from daily fee pool */
export function estimateIntervalUsd(dailyUsdPerPass, passesHeld, intervalHours = DISTRIBUTION_INTERVAL_HOURS) {
  return dailyUsdPerPass * passesHeld * (intervalHours / 24);
}

export const PAYOUT_HOURS_UTC = [0, 6, 12, 18];

/** Next 00/06/12/18 UTC payout instant. */
export function getNextPayoutDate(now = new Date(), intervalHours = DISTRIBUTION_INTERVAL_HOURS) {
  const slotMs = intervalHours * 60 * 60 * 1000;
  const t = now.getTime();
  return new Date(Math.floor(t / slotMs) * slotMs + slotMs);
}

export function formatDurationHms(ms) {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatUtcHm(date) {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`;
}
