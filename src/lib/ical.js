// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import ical from 'ical-generator'

/**
 * Generates an ical object.
 */
function generateIcal(events) {
  const cal = ical()
  for (const item of events) {
    for (const [start, end] of item.blocks) {
      const event = cal.createEvent({
        id: item.slug,
        summary: item.title,
        description: `${item.title}\n${item.location ?? ''}${item.city ? ` (${item.city})` : ''}`,
        start: start,
        end: end,
        location: item.location,
        class: 'public',
        url: item.link,
      })
      if (item.image) {
        event.attachments = [item.image]
      }
    }
  }
  return cal
}

/**
 * Writes a new ical file.
 */
export async function writeIcal(outBaseDir, events) {
  const cal = generateIcal(events)
  const outFile = path.join(outBaseDir, 'calendar.ics')
  await fs.writeFile(outFile, cal.toString(), 'utf8')
  return
}
