import fetch from 'isomorphic-fetch'
import {flatten, sortedUniqBy, sortBy} from 'lodash'

async function fetchDestinationForWriteKey(writeKey, segmentOrigin) {
  const res = await fetch(
    `${segmentOrigin}/v1/projects/${writeKey}/integrations`
  )

  if (!res.ok) {
    throw new Error(
      `Failed to fetch integrations for write key ${writeKey}: HTTP ${
        res.status
      } ${res.statusText}`
    )
  }

  const destinations = await res.json()

  // Rename creationName to id to abstract the weird data model
  for (const destination of destinations) {
    destination.id = destination.creationName
    delete destination.creationName
  }

  return destinations
}

export default async function fetchDestinations(
  writeKeys,
  customSegmentOrigin
) {
  const destinationsRequests = []
  for (const writeKey of writeKeys) {
    destinationsRequests.push(
      fetchDestinationForWriteKey(
        writeKey,
        customSegmentOrigin || 'https://cdn.segment.com'
      )
    )
  }

  let destinations = flatten(await Promise.all(destinationsRequests))
  // Remove the dummy Repeater destination
  destinations = destinations.filter(d => d.id !== 'Repeater')
  destinations = sortBy(destinations, ['id'])
  destinations = sortedUniqBy(destinations, 'id')

  return destinations
}
