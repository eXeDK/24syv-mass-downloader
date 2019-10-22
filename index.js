'use strict'
const term = require('terminal-kit').terminal
const Promise = require('bluebird')
const rp = require('request-promise')
const moment = require('moment')
const downloadFile = require('download-file')

function getEpisodeUrl (episode) {
  return 'http://arkiv.radio24syv.dk/attachment/' + episode.audioInfo.url
}

function getEpisodeDirectory (rootFolder, episode) {
  return rootFolder + '/' + episode.year + '/' + episode.month + '/'
}

function getEpisodeFilename (episode) {
  return moment(episode.publishInfo.createdAt).format('YYYY-MM-DD') + ' - ' + episode.title.replace('/', '-') + '.mp3'
}

function downloadEpisode (rootFolder, episode) {
  return new Promise((resolve, reject) => {
    downloadFile(getEpisodeUrl(episode), {
      directory: getEpisodeDirectory(rootFolder, episode),
      filename: getEpisodeFilename(episode)
    }, (err) => {
      (err) ? reject(err) : resolve()
    })
  })
}

function getMonthlyEpisodes (podcastId, year, month) {
  const url = 'https://api.radio24syv.dk/v2/podcasts/program/' + podcastId + '?year=' + year + '&month=' + month
  return rp(url)
    .then(JSON.parse)
    .then(episodes => episodes.map(episode => Object.assign(episode, { year: year, month: month })))
    .catch(() => [])
}

function getYearlyEpisodes (podcastId, year) {
  return Promise.reduce(Array.from({ length: 12 }, (v, k) => k + 1), (allEpisodes, month) => {
    return getMonthlyEpisodes(podcastId, year, month)
      .then(monthlyEpisodes => allEpisodes.concat(monthlyEpisodes))
  }, [])
}

function getAllEpisodes (podcastId) {
  return Promise.reduce(Array.from({ length: 9 }, (v, k) => k + 2010 + 1), (allEpisodes, year) => {
    return getYearlyEpisodes(podcastId, year)
      .then(yearlyEpisodes => allEpisodes.concat(yearlyEpisodes))
  }, [])
}

function downloadPodcast (rootFolder, podcastId) {
  // return getAllEpisodes(podcastId)
  return getYearlyEpisodes(podcastId, 2019)
  // return getMonthlyEpisodes(podcastId, 2017, 11)
    // Verify that the user wants to download everything
    .then(allEpisodes => {
      // Ask if you want to download all the data
      const totalSizeInMegaBytes = allEpisodes.reduce((totalBytes, episode) => totalBytes + episode.audioInfo.fileSize, 0) / (1000 * 1000)
      term('You are about to download ' + totalSizeInMegaBytes + 'MBs, do you want to continue?\n')
      return term.yesOrNo({ yes: ['y', 'ENTER'], no: ['n'] }).promise
        .then(yesToDownload => {
          return yesToDownload ? Promise.resolve(allEpisodes) : Promise.reject(new Error('Abort download'))
        })
    })
    .then(allEpisodes => {
      // Start downloading
      const progressBar = term.progressBar({
        width: 100,
        title: 'Downloading episodes',
        eta: true,
        percent: true,
        items: allEpisodes.length
      })

      return Promise.each(allEpisodes, episode => {
        progressBar.startItem(episode.title)
        return downloadEpisode(rootFolder, episode)
          .then(() => {
            progressBar.itemDone(episode.title)
          })
      })
    })
    .catch((e) => {
      console.log(e)
      term.red('Download aborted')
    })
}

getAllEpisodes(10839671)
  .then(allEpisodes => {
    console.log(allEpisodes)
  })

/*
downloadPodcast('.',16512250)
  .then(() => term.processExit())
*/
