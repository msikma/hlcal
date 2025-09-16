// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

import {DateTime} from 'luxon'

const dutchMonths = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
const dutchMonthsLc = dutchMonths.map(str => str.toLowerCase())
const dutchTimezone = 'Europe/Amsterdam'

/**
 * Checks if a given date exceeds our cutoff.
 * 
 * If past the cutoff, items will not be included due to lack of certainty.
 */
export function exceedsCutoff(date) {
  const cutoff = DateTime.now().plus({months: 9})
  return date > cutoff
}

/**
 * Checks if a given duration exceeds our limit.
 * 
 * If past the limit, the item is probably not filled in correctly on the backend.
 */
export function exceedsLimit(duration) {
  const sevenDays = 86400 * 7 * 1000
  return duration > sevenDays
}

/**
 * Returns a month number for a month string.
 * 
 * Months are zero indexed, e.g. 0 for "Januari".
 */
function getMonthNumber(monthString) {
  const month = normalizeMonth(monthString).toLowerCase()
  const monthIdx = dutchMonthsLc.findIndex(item => item === month)
  if (monthIdx == null) {
    throw new Error(`Invalid month: "${monthString}"`)
  }
  return monthIdx
}

/**
 * Ensures months are normalized for our dutchMonths list.
 */
function normalizeMonth(monthString) {
  if (monthString === 'October') {
    return 'Oktober'
  }
  return monthString
}

/**
 * Returns the hours and minutes for a given time string.
 */
function getHoursMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(n => parseInt(n))
  if (isNaN(hours) || isNaN(minutes)) {
    return null
  }
  return [hours, minutes]
}

/**
 * Returns an array of time blocks.
 * 
 * This is used to create the appropriate start and end times for multi-day events.
 */
export function createTimeBlocks(start, end) {
  if (end < start) {
    throw new Error(`Invalid timestamps: start is after end`)
  }

  const results = []

  const startHours = start.getHours()
  const startMinutes = start.getMinutes()
  const startSeconds = start.getSeconds()
  const startMillis = start.getMilliseconds()

  const endHours = end.getHours()
  const endMinutes = end.getMinutes()
  const endSeconds = end.getSeconds()
  const endMillis = end.getMilliseconds()

  // We're expecting the end time to be later than the start time.
  // If this is the case, we will break this up into multiple blocks.
  // If it's not the case, we'll return a single time block instead.
  // In the latter case, it's most likely an event that starts in the evening
  // and ends early morning.
  if (endHours <= startHours) {
    return [[start, end]]
  }

  // Go day by day.
  let current = new Date(start)
  current.setHours(0, 0, 0, 0)

  const finalDay = new Date(end)
  finalDay.setHours(0, 0, 0, 0)

  while (current <= finalDay) {
    const dayStart = new Date(current)
    dayStart.setHours(startHours, startMinutes, startSeconds, startMillis)

    const dayEnd = new Date(current)
    dayEnd.setHours(endHours, endMinutes, endSeconds, endMillis)

    results.push([dayStart, dayEnd])
    current.setDate(current.getDate() + 1)
  }

  return results
}

/**
 * Takes a date string from the Havenloods website and converts it to start and end date objects.
 * 
 * This takes the timezone of the local date into account.
 */
export function parseAgendaItemDate(dateString) {
  // Date strings are in the following format:
  // - vrijdag 19 september 2025 20:30 tot 23:00 - for events starting and ending on the same date
  // - zaterdag 20 september 2025 10:00 tot zondag 21 september 19:00 - for events starting and ending on different dates
  // We'll parse these and return two JS objects.
  // Note: for the end year, we assume it's the same as the start year, unless the end month is lower than the start month.
  // Events with a longer duration than 3 days are almost certainly mistakes.
  const dateItems = dateString.match(/(.+?)\s(([0-9]+)\s(.+?)\s([0-9]+))\s([0-9:]+)\stot\s(([0-9:]+)|(.+?)\s([0-9]+)\s(.+?)\s([0-9:]+))/)
  if (dateItems == null) {
    throw new Error(`Invalid date string: ${dateString}`)
  }
  let startDate, startMonth, startYear, startTime, endDate, endMonth, endYear, endTime
  const hasDifferentDates = dateItems[10] != null
  if (hasDifferentDates) {
    startDate = dateItems[3]
    startMonth = dateItems[4]
    startYear = dateItems[5]
    startTime = dateItems[6]
    endDate = dateItems[10]
    endMonth = dateItems[11]
    endTime = dateItems[12]
  }
  else {
    startDate = dateItems[3]
    startMonth = dateItems[4]
    startYear = dateItems[5]
    startTime = dateItems[6]
    endDate = dateItems[3]
    endMonth = dateItems[4]
    endTime = dateItems[8]
  }
  startDate = parseInt(startDate)
  startMonth = getMonthNumber(startMonth)
  startYear = parseInt(startYear)
  startTime = getHoursMinutes(startTime)
  endDate = parseInt(endDate)
  endMonth = getMonthNumber(endMonth)
  endYear = endMonth < startMonth ? startYear + 1 : startYear
  endTime = getHoursMinutes(endTime)

  if ([startDate, startMonth, startYear, endDate, endMonth, endYear].map(t => isNaN(t)).includes(true) || startTime == null || endTime == null) {
    throw new Error(`Invalid date string: "${dateString}"`)
  }

  const startDateObject = DateTime.fromObject(
    {
      year: startYear,
      month: startMonth + 1, // Luxon uses 1-12 for months
      day: startDate,
      hour: startTime[0],
      minute: startTime[1],
    },
    {
      zone: dutchTimezone
    }
  )
  const endDateObject = DateTime.fromObject(
    {
      year: endYear,
      month: endMonth + 1, // Luxon uses 1-12 for months
      day: endDate,
      hour: endTime[0],
      minute: endTime[1],
    },
    {
      zone: dutchTimezone
    }
  )

  const startDateDate = startDateObject.toJSDate()
  const endDateDate = endDateObject.toJSDate()

  if (startDateDate > endDateDate) {
    throw new Error(`Invalid date string (start is after end): "${dateString}"`)
  }

  return {
    start: startDateDate,
    end: endDateDate,
    duration: Number(endDateDate) - Number(startDateDate),
  }
}
