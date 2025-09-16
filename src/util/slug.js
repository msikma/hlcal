// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

import slugify from '@sindresorhus/slugify'

/**
 * Returns a slug for a given string.
 */
export function slug(string) {
  return slugify(string.trim(), {separator: '_'})
}
