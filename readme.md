# spotify-event-api
Work in progress.
Requires NodeJS 12

Note: `fromToken.js` example is broken right now.

## Callbacks

```js
var spotifyEventApi = require('@kywagaha/spotify-event-api')
var spotifyApi = new spotifyEventApi.Player();
require('spotify-event-api').event.on(event, response)
```
current event emitters:
```js
'update-song',
'update-album',
'update-device',
'update-playing-state',
'update-shuffle-state',
'update-repeat-state',
'update-volume',
'update-playing-type'
```

all return full spotify '/player' body
<br />
<br />
`'progress'` emits every second (every api update) with an object:

```
{
  duration_ms: number,
  progress_ms: number,
  progress_percent: number,
  delta_percent: number,
  delta_ms: number
}
```

## Authorization
