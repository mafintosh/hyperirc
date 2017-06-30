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

* #dat on freenode, `hyperirc --tail=4e397d94d0f5df0e2268b2b7b23948b6dddfca66f91c2d452f404202e6d0f626`
* #datland on freenode, `hyperirc --tail=c171af3ab6d6936f8b4d3a9abb19f2f2adccf1c27a6c2bf17e05950f30ac698f`
* #cphftw on freenode, `hyperirc --tail=f93d568521e82722e4473ac0563aa8d4a2e2becb5c6dd2e1276532c5f4e521a0`
* #stackvm on freenode, `hyperirc --tail=9d25a90d0422904b876d226116903809a374dc4156b0b349f55ccf9e19ecfbd4`

If you mirror a channel open a PR and add your key.

## License

MIT
