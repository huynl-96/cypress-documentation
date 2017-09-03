const _ = require('lodash')
const chalk = require('chalk')
const debug = require('debug')('cypress:cli')
const fs = require('../fs')
const download = require('./download')
const util = require('../util')
const info = require('./info')
const unzip = require('./unzip')
const logger = require('../logger')

const hasSomethingToSay = (err) => err && err.message

const install = (options = {}) => {
  debug('installing with options %j', options)

  _.defaults(options, {
    force: false,
  })

  let needVersion = util.pkgVersion()

  if (process.env.CYPRESS_VERSION) {
    needVersion = process.env.CYPRESS_VERSION
    debug('using CYPRESS_VERSION %s', needVersion)
    logger.log(chalk.yellow(`Forcing CYPRESS_VERSION ${needVersion}`))
  }

  return info.getInstalledVersion()
  .catch(() => {
    throw new Error('Cypress executable was not found.')
  })
  .then((installedVersion) => {
    if (options.force) {
      return info.clearVersionState().then(() => {
        throw new Error('')
      })
    } else if (installedVersion === needVersion) {
      logger.log(chalk.green(`Cypress ${needVersion} already installed.`))
    } else if (!installedVersion) {
      logger.log('Could not find installed Cypress')
      return info.clearVersionState().then(() => {
        throw new Error('')
      })
    } else {
      throw new Error(`Installed version (${installedVersion}) does not match needed version (${needVersion}).`)
    }
  })
  .catch((err) => {
    if (hasSomethingToSay(err)) {
      logger.log(err.message)
    }
    logger.log(chalk.green(`Installing Cypress (version: ${needVersion}).`))

    // check to see if needVersion is a valid file
    return fs.statAsync(needVersion)
    .then(() => {
      logger.log('Installing local Cypress binary from %s', needVersion)

      return unzip.start({
        zipDestination: needVersion,
        destination: info.getInstallationDir(),
        executable: info.getPathToUserExecutable(),
      })
      .then(() => info.writeInstalledVersion('unknown'))
    })
    .catch(() => {
      // else go out and download it from the interwebz
      return download.start({
        displayOpen: false,
        cypressVersion: needVersion,
        version: needVersion,
      })
    })
  })
}

module.exports = {
  install,
}
