#!/usr/bin/env node

var irc = require('irc')
var sub = require('subleveldown')
var level = require('level-party')
var hypercore = require('hypercore')
var swarm = require('discovery-swarm')
var defaults = require('datland-swarm-defaults')
var minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
  alias: {
    mirror: 'channel',
    tail: 'feed',
    channel: 'c',
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
  console.error('  --webrtc                 Share over webrtc as well.')
  console.error('  --all                    Print the entire channel log.')
  console.error()
  console.error('You must specify either --tail or --mirror')
  console.error()
  process.exit(1)
}

if (argv.channel) argv.channel = argv.channel.replace(/^#/, '')

var lev = level('hyperirc.db')
var dbKey = argv.channel ? argv.channel : argv.feed
var db = sub(lev, dbKey)
var core = hypercore(db)

db.get('!hyperirc!!channels!' + argv.channel, {valueEncoding: 'binary'}, function (_, key) {
  var feed = core.createFeed(key || argv.feed)
  var cnt = 0

  var sw = swarm(defaults({
    hash: false,
    stream: function () {
      return feed.replicate()
    }
  }))

  if (argv.channel) {
    var channel = '#' + argv.channel
    var name = argv.name || 'hyperirc-' + feed.key.toString('hex').slice(0, 12)
    var client = new irc.Client(argv.server, name, {
      channels: [channel]
    })

    feed.open(function (err) {
      if (err) throw err

      if (!feed.blocks) feed.append(channel)

      client.on('message', function (from, to, message) {
        feed.append(from + '> ' + message)
      })

      db.put('!hyperirc!!channels!' + argv.channel, feed.key)
      console.log('Mirroring ' + channel + ' to ' + feed.key.toString('hex'))
    })
  }

  feed.get(0, function (err, channel) {
    if (err) throw err

    if (!argv.channel) {
      console.log('Tailing ' + channel.toString() + ' over hypercore')
    }

    var end = feed.blocks

    if (!argv.all) {
      feed.once('download', function () {
        if (feed.blocks - end > 10) {
          stream.destroy()
          console.log('(skipping to latest messages)')
          tail()
        }
      })
    }

    var stream = tail()

    function tail () {
      var stream = feed.createReadStream({live: true, start: argv.all ? 0 : Math.max(feed.blocks - 10, 1)})
        .on('data', function (data) {
          console.log(data.toString())
        })

      return stream
    }
  })

  sw.join(feed.discoveryKey)
  sw.on('connection', function (peer) {
    console.log('(peer joined, %d total)', ++cnt)
    peer.on('close', function () {
      console.log('(peer left, %d total)', --cnt)
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
      console.log('(webrtc peer joined, %d total', ++cnt)
      var peer = feed.replicate()
      pump(peer, connection, peer, function () {
        console.log('(webrtc peer left, %d total', --cnt)
      })
    })
  }
})
