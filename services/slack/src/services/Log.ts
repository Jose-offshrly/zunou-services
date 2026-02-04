import { createLogger, format, transports } from 'winston'

import { logLevel } from '~/services/Constants'

/**
 * @public
 *
 * The logger singleton.
 */
export const Log = createLogger({
  format: format.combine(format.splat(), format.simple()),
  level: logLevel,
  transports: [new transports.Console()],
})
