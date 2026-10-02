import { STORAGE_KEYS } from "./config";
import type { Reading } from "./apiService";

function readingsKey(): string {
  return `${STORAGE_KEYS.SETTINGS}_readings`;
}

export function getStoredReadings(): Reading[] {
  try {
    const raw = localStorage.getItem(readingsKey());
    return raw ? (JSON.parse(raw) as Reading[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredReading(reading: Reading): void {
  const readings = getStoredReadings();
  const idx = readings.findIndex((r) => r.id === reading.id);
  if (idx >= 0) {
    readings[idx] = reading;
  } else {
    readings.unshift(reading);
  }
  localStorage.setItem(readingsKey(), JSON.stringify(readings.slice(0, 100)));
}

export function clearStoredReadings(): void {
  localStorage.removeItem(readingsKey());
}
