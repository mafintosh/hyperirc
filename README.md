# hyperirc

Read IRC through hypercore.

## What is it?

[Hypercore](https://github.com/mafintosh/hypercore) is the underlying p2p network that powers [Dat](https://dat-data.com)

Hyperirc is a bot that mirrors irc channels to a hypercore append-only log.
This allows you to read an IRC channel using the hypercore p2p network. Anyone who is reading the irc logs is also helping hosting them.

## Usage

```
npm install -g hyperirc
```

## Usage

First, somewhere, start a mirror.

``` sh
hyperirc --mirror=an-irc-channel
```

This will mirror `an-irc-channel` on freenode into a hyperdrive feed.
The feed key is printed out.

Then on a couple of other computers run this to tail the channel

``` sh
hyperirc --tail=the-key-printed-out-above
```

Thats it! Every peer tailing (and the peer mirroring) will join the p2p network and help eachother host the irc logs.

By default, hyperirc will save its database under `~/.hyperirc`. You may choose your own location.

```sh
hyperirc --mirror=an-irc-channel --database=/path/to/db
```

For more options run `hyperirc --help`.

## Browser support

You can also seed the irc logs to the browser by adding the `--webrtc` option. This will make hyperirc join a p2p webrtc swarm
as well.

``` sh
hyperirc --tail=the-key-printed-out-above --webrtc
```

To view the logs in the browser visit the static website hosted here, https://github.com/mafintosh/hyperirc-www

## Mirrored IRC channels

* #dat on freenode, `hyperirc --tail=227d9212ee85c0f14416885c5390f2d270ba372252e781bf45a6b7056bb0a1b5`
* #sciencefair on freenode, `hyperirc --tail=d5ec4f72d2dfde000510b1d84912242a2c10400bbd9721311a548a1e3a7913b5`
* #beakerbrowser on freenode, `hyperirc --tail=18bab41fd4cfd47425226bebf6030ef270091481b39a1959768c2ccc90db02a3`
* #cphftw on freenode, `hyperirc --tail=f93d568521e82722e4473ac0563aa8d4a2e2becb5c6dd2e1276532c5f4e521a0`
* #stackvm on freenode, `hyperirc --tail=9d25a90d0422904b876d226116903809a374dc4156b0b349f55ccf9e19ecfbd4`

If you mirror a channel open a PR and add your key.

## License

MIT
