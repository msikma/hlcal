// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

import * as path from 'node:path'
import {fetchLiveAgendaItems} from './lib/hl.js'
import {storeEvents} from './lib/events.js'
import {readRecentEvents} from './lib/events.js'
import {writeIcal} from './lib/ical.js'

/**
 * Fetches items that are currently live and stores them for later use.
 */
async function updateEvents(outBaseDir) {
  const events = await fetchLiveAgendaItems()
  await storeEvents(outBaseDir, events)
}

/**
 * Generates a new ical file.
 */
async function main() {
  const outBaseDir = path.join(import.meta.dirname, '..', 'out')

  await updateEvents(outBaseDir)
  const recentEvents = await readRecentEvents(outBaseDir)
  await writeIcal(outBaseDir, recentEvents)
}

main()
