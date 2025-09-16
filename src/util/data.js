// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

/** Sleeps for a given number of milliseconds and resolves. */
export const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms))

/** Normalizes whitespace to a single space. */
export const normalizeWhitespace = str => str.replace(/\s+/g, ' ').trim()

/**
 * Returns a number of strings from which we'll read existing events.
 * 
 * This is the current month, plus up to 3 months in the past, and up to 3 months in the future.
 */
export function getRecentYearMonthStrings(now = new Date(), pastMonths = 3, futureMonths = 6) {
  const months = []

  const totalMonths = pastMonths + futureMonths + 1
  
  const startDate = new Date(now)
  startDate.setDate(5)
  startDate.setMonth(now.getMonth() - pastMonths)

  for (let n = 0; n < totalMonths; ++n) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + n);
    
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    
    months.push(`${year}_${month}`)
  }
  
  return months
}
