#!/usr/bin/env node

var irc = require('irc')
var hypercore = require('hypercore')
var swarm = require('discovery-swarm')
var defaults = require('dat-swarm-defaults')
var minimist = require('minimist')
var home = require('os-homedir')
var path = require('path')

var argv = minimist(process.argv.slice(2), {
  alias: {
    mirror: 'channel',
    tail: 'feed',
    channel: 'c',
    database: 'd',
    feed: 'f',
    server: 's',
    name: 'n'
  },
  default: {
    server: 'irc.freenode.net',
    signalhub: 'https://signalhub.mafintosh.com'
  }
})

if (!argv.channel && !argv.feed || argv.help) {
  console.error('Usage: hyperirc [options]')
  console.error()
  console.error('  --mirror=[channel-name]  IRC channel to mirror')
  console.error('  --server=[irc-server]    Optional IRC server. Defaults to freenode')
  console.error('  --tail=[feed-key]        A mirrored channel to tail')
  console.error('  --database=[db-path]     Path for database. Defaults to ~/.hyperirc')
  console.error('  --webrtc                 Share over webrtc as well.')
  console.error('  --all                    Print the entire channel log.')
  console.error()
  console.error('You must specify either --tail or --mirror')
  console.error()
  process.exit(1)
}

if (argv.channel) argv.channel = argv.channel.replace(/^#/, '')

var db = argv.database || path.join(home(), '.hyperirc', argv.channel || argv.feed)
var feed = hypercore(db, argv.feed, {valueEncoding: 'json'})
var peerCnt = 0

feed.ready(function () {
  var sw = swarm(defaults({
    hash: false,
    stream: function () {
      return feed.replicate({
        live: true
      })
    }
  }))

  if (argv.channel) {
    var channel = '#' + argv.channel
    var name = argv.name || 'hyperirc-' + feed.key.toString('hex').slice(0, 12)
    var client = new irc.Client(argv.server, name, {
      channels: [channel]
    })

    if (!feed.length) feed.append({channel: channel})

    client.on('message', function (from, to, message) {
      feed.append({ from: from, message: message, timestamp: Date.now() })
    })

    console.log('Mirroring ' + channel + ' to ' + feed.key.toString('hex'))
  }

  feed.get(0, function (err, data) {
    if (err) throw err

    if (!argv.channel) {
      console.log('Tailing ' + data.channel + ' over hypercore')
    }

    var end = feed.length

    if (!argv.all) {
      feed.once('sync', function () {
        if (feed.length - end > 10) {
          stream.destroy()
          console.log('(skipping to latest messages)')
          tail()
        }
      })
    }

    var stream = tail()

    function tail () {
      var stream = feed.createReadStream({live: true, start: argv.all ? 1 : Math.max(feed.length - 10, 1)})
        .on('data', function (data) {
          console.log(`${Date(data.timestamp).toLocaleString()} ${data.from} > ${data.message}`)
        })

      return stream
    }
  })

  sw.join(feed.discoveryKey)
  sw.on('connection', function (peer) {
    console.log('(peer joined, %d total)', ++peerCnt)
    peer.on('close', function () {
      console.log('(peer left, %d total)', --peerCnt)
    })
  })

  if (argv.webrtc) {
    var signalhub = require('signalhub')
    var webrtcSwarm = require('webrtc-swarm')
    var pump = require('pump')
    var wsw = webrtcSwarm(signalhub('hyperirc-' + feed.discoveryKey.toString('hex'), argv.signalhub), {
      wrtc: require('electron-webrtc')({headless: true})
    })

    wsw.on('peer', function (connection) {
      console.log('(webrtc peer joined, %d total', ++peerCnt)
      var peer = feed.replicate()
      pump(peer, connection, peer, function () {
        console.log('(webrtc peer left, %d total', --peerCnt)
      })
    })
  }
})
