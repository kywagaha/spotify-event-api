# spotify-event-api
Work in progress.

# Callbacks

```js
require('spotify-event-api').event.on(event, response)
```
current event emitters:
```js
'update-song'
'update-album'
'update-device'
'update-playing-state'
'update-shuffle-state'
'update-repeat-state'
'update-volume'
'update-playing-type'
```

all return full spotify '/player/' body
<br /><br />
`'progress-percent'` will be emitted every update with the current track playback percent