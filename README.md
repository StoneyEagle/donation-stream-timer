# Donation Stream Timer

A lightweight, overlay-ready countdown timer for charity marathons, subathons, and other livestream events. The timer supports automatic adjustments from Streamer.bot, Twitch, and Ko-fi events and can be controlled via Twitch chat commands.

## Features

- Accurate countdown using Date.now() to avoid long-term drift
- WebSocket integration for Streamer.bot events
- Twitch support: new subs, resubs, gifted subs, and bits (cheers)
- Ko-fi support: donations, subscriptions, and shop orders
- Twitch chat commands to add, remove, pause, resume, or set the timer
- Smart time parsing (examples: `5:00`, `30m`, `1h 25m 30s`)
- All behavior configurable via a `setup` object in `script.js`

## Files

- `index.html` — overlay UI
- `styles.css` — styling for the timer
- `script.js` — timer logic, WebSocket handling, and command parsing

## Getting started

1. Clone or download this repository.
2. Open `index.html` in a browser or add it to OBS as a Browser Source.
3. Edit the `setup` object in `script.js` to configure behavior and integrations.
4. Connect Streamer.bot to the timer via WebSocket (if used).

## Configuration (in `script.js`)

All runtime behavior is controlled by a `setup` object. Below are common settings grouped by integration — see `script.js` for full details and defaults.

### WebSocket

| Setting | Type | Default | Description |
|---|---:|---|---|
| `webSocketUrl` | string | `ws://localhost:8080/` | WebSocket endpoint for receiving Streamer.bot events |
| `allowMods` | boolean | `true` | Allow moderators to use `!time` chat commands. Set to `false` to restrict commands to the broadcaster only. |

### Ko-fi settings (examples)

| Setting | Type | Description |
|---|---:|---|
| `kofiDonationTimeIncrement` | number | Minutes added per $1 donated |
| `kofiSubscriptionTimeIncrement` | number | Flat minutes added for Ko-fi subscriptions/resubscriptions |
| `kofiShopOrderTimeIncrement` | number | Flat minutes added for Ko-fi shop orders |

### Twitch settings (examples)

#### Subscriptions (new subs)

| Setting | Type | Description |
|---|---:|---|
| `twitchSubTier1TimeIncrement` | number | Minutes added for a Tier 1 subscription |
| `twitchSubTier2TimeIncrement` | number | Minutes added for a Tier 2 subscription |
| `twitchSubTier3TimeIncrement` | number | Minutes added for a Tier 3 subscription |

#### Resubscriptions

| Setting | Type | Description |
|---|---:|---|
| `twitchReSubTier1TimeIncrement` | number | Minutes added for a Tier 1 resub |
| `twitchReSubTier2TimeIncrement` | number | Minutes added for a Tier 2 resub |
| `twitchReSubTier3TimeIncrement` | number | Minutes added for a Tier 3 resub |

#### Gifted subs & shared chat

| Setting | Type | Description |
|---|---:|---|
| `twitchGiftSubTimeIncrement` | number | Minutes added per gifted sub |
| `twitchSharedChatSubTimeIncrement` | number | Minutes added for shared chat subscriptions |
| `twitchSharedChatResubTimeIncrement` | number | Minutes added for shared chat resubscriptions |
| `twitchSharedChatSubGiftTimeIncrement` | number | Minutes added per shared chat gifted sub |

#### Bits (cheers)

| Setting | Type | Description |
|---|---:|---|
| `twitchCheerTimeIncrement` | function | Function(bits) → minutes; maps bits (cheer) to minutes added |

Example function mapping bits to minutes:

```js
twitchCheerTimeIncrement: (bits) => Math.floor(bits / 100) * 1
```

By default the project uses 1 minute per 100 bits; adjust the function to change that.

## Twitch chat commands

Only the broadcaster and moderators should be permitted to use these commands. Commands are case-insensitive and accept a duration argument where noted.

| Command | Argument | Effect | Example |
|---|---|---|---|
| `!time pause` | — | Pause the countdown at current value | `!time pause` |
| `!time resume` | — | Resume a paused countdown | `!time resume` |
| `!time start [<duration>]` | duration (optional) | Start the timer. With a duration argument, set the countdown to that value and start immediately; without an argument, starts only if there is a non-zero remaining time. | `!time start` or `!time start 1:00` |
| `!time add <duration>` | duration | Add the given duration to the remaining time | `!time add 5:00` → adds 5 minutes |
| `!time sub <duration>` | duration | Subtract the given duration from the remaining time | `!time sub 2:00` → subtracts 2 minutes |
| `!time set <duration>` | duration | Set the countdown to the exact duration provided and start the timer | `!time set 1h 15m` → sets timer to 1h15m |

### Time formats and parsing

The timer accepts several common duration formats. The parser aims to be forgiving while staying predictable.

| Format | Meaning | Examples |
|---|---|---|
| `MM:SS` or `M:SS` | Minutes and seconds | `5:00` → 5 minutes; `7:30` → 7 minutes 30 seconds |
| `Xs`, `Xm`, `Xh` | Seconds / minutes / hours (single unit) | `30s` → 30 seconds; `45m` → 45 minutes; `2h` → 2 hours |
| Combined units | Multiple units in any order | `1h 25m 30s`, `25m 1h` |
| Space or no-space between number and unit | Accepted | `1h30m`, `1h 30m`, `90m` |

Parsing rules and notes

- Units supported: `h` (hours), `m` (minutes), `s` (seconds). Units are case-insensitive.
- If a value is supplied without a unit but contains `:` it is treated as `MM:SS`.
- Numeric values without unit are treated as minutes (e.g., `5` → 5 minutes) unless the input contains `:`.
- Negative results are clamped to 0 seconds; the timer will not go below zero.
- Invalid or ambiguous inputs are ignored and will not change the timer; the command issuer will not be granted time.
- Whitespace is allowed; extra spaces are ignored.

Common examples

- `!time add 5:00` → adds 5 minutes
- `!time add 30m` → adds 30 minutes
- `!time add 1h 15m` → adds 1 hour 15 minutes
- `!time sub 90s` → subtracts 90 seconds (1 minute 30 seconds)

For exact parsing behavior and any additional accepted variants, see the parser implementation in `script.js`.

## Permissions

Commands are accepted only from the Broadcaster and Moderators. Other users are ignored by default.

## OBS / Overlay usage

1. Add a Browser Source in OBS.
2. Point it to `index.html` (local file or hosted URL).
3. Set the source size and any CSS scaling as needed.
4. (Optional) Enable "Refresh browser when scene becomes active" to ensure the overlay resets when switching scenes.

## Customization

- Styling: edit `styles.css`.
- Timing rules and integrations: edit the `setup` object in `script.js`.
- You can add animations, sounds, or additional Streamer.bot events in `script.js`.

## License

This project is released under the MIT License. Feel free to use, modify, and distribute.
