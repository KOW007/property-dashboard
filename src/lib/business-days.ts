/**
 * Business day utilities for ACH cron scheduling.
 *
 * Rules:
 * - If payment_day falls on a weekend, shift to the next Monday.
 * - If payment_day falls on a federal holiday, shift to the next business day.
 * - Payment days 29/30/31 always run on the last calendar day of the month
 *   (and then apply weekend/holiday shifting).
 * - The cron runs every weekday. This module returns which payment_day values
 *   should be processed on a given calendar date.
 */

// Federal holidays — computed dynamically for any year
function federalHolidays(year: number): Set<string> {
  const dates: string[] = []

  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const date = (m: number, d: number) => new Date(year, m - 1, d)

  // Helper: nth weekday of month (e.g., 3rd Monday of January)
  const nthWeekday = (m: number, weekday: number, n: number) => {
    const d = new Date(year, m - 1, 1)
    let count = 0
    while (true) {
      if (d.getDay() === weekday) count++
      if (count === n) return new Date(d)
      d.setDate(d.getDate() + 1)
    }
  }

  // Helper: last weekday of month
  const lastWeekday = (m: number, weekday: number) => {
    const d = new Date(year, m, 0) // last day of month
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
    return new Date(d)
  }

  // Observed rule: if holiday falls on Saturday → Friday, Sunday → Monday
  const observed = (d: Date): Date => {
    const dow = d.getDay()
    if (dow === 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1) // Saturday → Friday
    if (dow === 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) // Sunday → Monday
    return d
  }

  // Fixed-date federal holidays
  const fixed = [
    date(1, 1),   // New Year's Day
    date(6, 19),  // Juneteenth
    date(7, 4),   // Independence Day
    date(11, 11), // Veterans Day
    date(12, 25), // Christmas
  ]
  fixed.forEach(d => dates.push(fmt(observed(d))))

  // Floating federal holidays
  dates.push(fmt(nthWeekday(1, 1, 3)))   // MLK Day — 3rd Monday January
  dates.push(fmt(nthWeekday(2, 1, 3)))   // Presidents' Day — 3rd Monday February
  dates.push(fmt(lastWeekday(5, 1)))      // Memorial Day — last Monday May
  dates.push(fmt(nthWeekday(9, 1, 1)))   // Labor Day — 1st Monday September
  dates.push(fmt(nthWeekday(10, 1, 2)))  // Columbus Day — 2nd Monday October
  dates.push(fmt(nthWeekday(11, 4, 4)))  // Thanksgiving — 4th Thursday November

  return new Set(dates)
}

export function isBusinessDay(d: Date): boolean {
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return false // weekend
  const key = d.toISOString().slice(0, 10)
  return !federalHolidays(d.getFullYear()).has(key)
}

export function nextBusinessDay(d: Date): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + 1)
  while (!isBusinessDay(next)) next.setDate(next.getDate() + 1)
  return next
}

/**
 * Returns the set of `payment_day` values that should be collected today.
 *
 * @param today  The calendar date the cron is running on (default: now in CST)
 */
export function getPaymentDaysToProcess(today: Date = new Date()): number[] {
  const year  = today.getFullYear()
  const month = today.getMonth() // 0-indexed
  const todayStr = today.toISOString().slice(0, 10)

  const days: number[] = []

  // Iterate payment_day values 1–31
  for (let pd = 1; pd <= 31; pd++) {
    // Resolve the actual calendar date for this payment_day this month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()

    // Days 29–31 → use last day of month if month is shorter
    const calendarDay = pd > lastDayOfMonth ? lastDayOfMonth : pd

    let due = new Date(year, month, calendarDay)

    // Shift non-business days forward
    if (!isBusinessDay(due)) {
      due = nextBusinessDay(due)
    }

    const dueStr = due.toISOString().slice(0, 10)

    if (dueStr === todayStr) {
      // For days 29–31 that all map to the last day, only add once
      if (!days.includes(pd <= lastDayOfMonth ? pd : lastDayOfMonth)) {
        days.push(pd)
      } else if (pd <= lastDayOfMonth) {
        days.push(pd)
      }
    }
  }

  return days
}
