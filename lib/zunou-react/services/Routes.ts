import isEmpty from 'lodash/isEmpty'
import omitBy from 'lodash/omitBy'
import { sprintf } from 'sprintf-js'
import type { UrlObject } from 'url'

// Returns the path for the given route name.
export const pathFor = (href: UrlObject): string => {
  // We need to decide which params should be substituted into the
  // URL, and which should be added as query params.
  const pathname = href?.pathname || ''
  const params = href.query || {}
  const regex = /:([a-z]+)/gi
  const routeParamNames = pathname.match(regex)
  const extras = omitBy(params, (_value, key) =>
    (routeParamNames || []).includes(`:${key}` as unknown as never),
  ) as Record<string, string>
  const query = isEmpty(extras)
    ? ''
    : `?${new URLSearchParams(extras).toString()}`

  return `${sprintf(pathname.replace(regex, '%($1)s'), params)}${query}`
}
