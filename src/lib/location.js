// @dada78641/hlcal <https://github.com/msikma/hlcal>
// © MIT license

/**
 * Parses an agenda item's location string.
 */
export function parseAgendaItemLocation(locationString) {
  // The location string, if it's present, will be in the following format:
  // - Poppentheater op de Fighter | Rotterdam
  // - Matrix Rotterdam | Rotterdam Centrum
  if (locationString == null) {
    return {
      location: null,
      city: null,
    }
  }
  const split = locationString.split('|').map(line => line.trim())
  const city = split?.[1] ?? 'Rotterdam'

  return {
    location: split[0],
    city,
  }
}
