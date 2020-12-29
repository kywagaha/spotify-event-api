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
<br />
<br />
`'progress'` emits every second (every api update) with an object:

```
{
  progress_percent: float percent between 0 and 1 (number),
  delta_percent: 1000 / song duration in ms (~0.005% accuracy, excuse for api request delay) (number),
  progress_ms: track's progress in ms (number),
  duration_ms: track's duration in ms (number)
}
```