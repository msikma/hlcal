// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {sortEvents} from './hl.js'
import {getRecentYearMonthStrings} from '../util/data.js'

/**
 * Returns a path to an events date block directory.
 */
function getDateBlockDirectory(outBaseDir, dateBlock) {
  const year = dateBlock.slice(0, 4)
  const month = dateBlock.slice(5, 7)
  const dateBlockDir = path.join(outBaseDir, year, month)
  return dateBlockDir
}

/**
 * Reads events from a given file and returns them; or an empty array.
 */
async function readEvents(eventsFile) {
  try {
    const text = await fs.readFile(eventsFile, 'utf8')
    const data = JSON.parse(text)
    return data.events.map(event => rehydrateEvent(event))
  }
  catch {
    return []
  }
}

/**
 * Merges events into an existing file for a date block.
 */
async function mergeEvents(dateBlockDir, events) {
  const existingEventsFile = path.join(dateBlockDir, `events.json`)
  let fileEvents = {}
  try {
    const existingEvents = await readEvents(existingEventsFile)
    for (const event of existingEvents) {
      fileEvents[event.slug] = event
    }
  }
  catch {
    //
  }
  for (const event of events) {
    fileEvents[event.slug] = event
  }
  fileEvents = Object.values(fileEvents).sort(sortEvents)

  await fs.mkdir(dateBlockDir, {recursive: true})
  await fs.writeFile(existingEventsFile, JSON.stringify({events: fileEvents}, null, 2), 'utf8')
  return
}

/**
 * Merges a new batch of events with the stored ones.
 */
export async function storeEvents(outBaseDir, events) {
  await fs.mkdir(outBaseDir, {recursive: true})
  const dateBlocks = [...new Set(events.map(event => event.dateBlock))]
  for (const dateBlock of dateBlocks) {
    const dateBlockDir = getDateBlockDirectory(outBaseDir, dateBlock)
    await mergeEvents(dateBlockDir, events)
  }
}

/**
 * Rehydrates an event.
 */
function rehydrateEvent(event) {
  const rehydrated = {...event}
  rehydrated.start = new Date(rehydrated.start)
  rehydrated.end = new Date(rehydrated.end)
  rehydrated.blocks = rehydrated.blocks.map(block => [new Date(block[0]), new Date(block[1])])
  return rehydrated
}

/**
 * Returns all events from a given year/month.
 */
export async function readEventsFromMonth(outBaseDir, dateBlock) {
  const dateBlockDir = getDateBlockDirectory(outBaseDir, dateBlock)
  const eventsFile = path.join(dateBlockDir, `events.json`)
  const events = await readEvents(eventsFile)
  return events
}

/**
 * Reads recent events, previously fetched.
 */
export async function readRecentEvents(outBaseDir) {
  const yms = getRecentYearMonthStrings()
  const recentEvents = {}
  for (const ym of yms) {
    const events = await readEventsFromMonth(outBaseDir, ym)
    for (const event of events) {
      recentEvents[event.slug] = event
    }
  }
  const eventsList = Object.values(recentEvents).sort(sortEvents)
  return eventsList
}
