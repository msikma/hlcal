// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

import * as cheerio from 'cheerio'
import {parseAgendaItemLocation} from './location.js'
import {parseAgendaItemDate, createTimeBlocks, exceedsCutoff, exceedsLimit} from './date.js'
import {slug} from '../util/slug.js'
import {fetchHtml} from '../util/fetch.js'
import {normalizeWhitespace} from '../util/data.js'

const HL_BASEURL = 'https://www.dehavenloods.nl'
const HL_AGENDA = '/agenda'

/**
 * Fetches the agenda HTML from the Havenloods website.
 */
export async function getAgendaHTML() {
  const url = `${HL_BASEURL}${HL_AGENDA}`
  const html = await fetchHtml(url)
  return {
    baseURL: HL_BASEURL,
    text: html,
  }
}

/**
 * Returns a slug for a given item.
 */
function getSlug(title, start) {
  const date = start.toISOString().split('T')
  return `${date ? date[0] : 'unk'}_${slug(title)}`
}

/**
 * Returns a date block (for purposes of archiving).
 */
function getDateBlock(start) {
  const date = (start ? start : new Date()).toISOString().split('T')
  return date[0].slice(0, 7).replaceAll('-', '_')
}

/**
 * Parses a raw item into a full item.
 */
function getAgendaItemData(itemRaw) {
  const {title, date, loc, link, image} = itemRaw
  const {start, end, duration} = parseAgendaItemDate(date)

  if (exceedsCutoff(start)) {
    return null
  }
  if (exceedsLimit(duration)) {
    return null
  }
  const location = parseAgendaItemLocation(loc)
  const timeBlocks = createTimeBlocks(start, end)
  const dateBlock = getDateBlock(start)

  return {
    title,
    slug: getSlug(title, start),
    start,
    end,
    duration,
    link,
    image,
    ...location,
    blocks: timeBlocks,
    dateBlock,
  }
}

/**
 * Attempts to parse a raw item; on failure, null is returned.
 */
function parseAgendaRawItem(item) {
  try {
    const data = getAgendaItemData(item)
    return data
  }
  catch {
    return null
  }
}

/**
 * Extracts all agenda items from the Havenloods agenda page HTML.
 */
function extractAgendaItems($, baseURL) {
  const agendaLinks = [...$('a.block[href^="/agenda"]')]
  const itemsRaw = agendaLinks.map(link => {
    const title = $('> div > span:nth-child(1)', link)
    const date = $('> div > p:nth-child(2)', link)
    const loc = $('> div > span:nth-child(3)', link)
    const img = $('> div picture > img', link)
    const imgSource = img.length ? img.attr('src') : null
    const titleText = normalizeWhitespace(title.text().trim())
    const dateText = normalizeWhitespace(date.text().trim())
    const locText = normalizeWhitespace(loc.text().trim())
    const url = $(link).attr('href')
    return {
      title: titleText ? titleText : null,
      date: dateText ? dateText : null,
      loc: locText ? locText : null,
      image: imgSource ? imgSource.trim() : null,
      link: new URL(url, baseURL).toString(),
    }
  })
  const items = itemsRaw.map(parseAgendaRawItem).filter(item => item)
  return items
}

/**
 * Returns the currently visible agenda items.
 */
export async function fetchLiveAgendaItems() {
  const page = await getAgendaHTML()
  const $ = cheerio.load(page.text)
  try {
    const items = extractAgendaItems($, page.baseURL)
    return items
  }
  catch {
    return []
  }
}

/**
 * Sorts two events.
 */
export function sortEvents(a, b) {
  const aStart = a.start
  const bStart = b.start
  return aStart === bStart ? 0 : aStart < bStart ? -1 : 1
}
