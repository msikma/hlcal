// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

import UserAgent from 'user-agents'

/**
 * Returns the html for a given url.
 */
export async function fetchHtml(url, init = {}) {
  const res = await browserFetch(url, init)
  const text = await res.text()
  return text
}

/**
 * fetch() with preloaded default headers to mimic a real browser.
 * 
 * Usable as a drop in replacement for regular fetch().
 */
export async function browserFetch(url, init = {}) {
  const userAgent = getUserAgent()
  const defaultHeaders = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xmlq=0.9,image/avif,image/webp,*/*q=0.8',
    'Accept-Language': 'en-US,enq=0.5',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  }

  const mergedInit = {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init?.headers || {}),
    },
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  mergedInit.signal = controller.signal
  return fetch(url, mergedInit)
}

/**
 * Returns a user agent string.
 */
function getUserAgent() {
  const userAgent = new UserAgent({deviceCategory: 'desktop'})
  return userAgent.toString()
}
