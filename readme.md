# spotify-event-api

Event-based Spotify API wrapper. Work in progess.

```
npm i @kywagaha/spotify-event-api
```

```JS
const spotify = require("@kywagaha/spotify-event-api");

spotify.start(access_token)

spotify.event.on("newSong", (song) => {
    console.log(song)
    /*
        {
            uri: 'spotify:track:1NCUe90ZCiWTnWn3umrwqw',
            name: 'Vintage',
            artists: [
                {
                    external_urls: [Object],
                    href: 'https://api.spotify.com/v1/artists/2kxP07DLgs4xlWz8YHlvfh',
                    id: '2kxP07DLgs4xlWz8YHlvfh',
                    name: 'NIKI',
                    type: 'artist',
                    uri: 'spotify: artist: 2kxP07DLgs4xlWz8YHlvfh'
                }
            ],
            art: 'https: //i.scdn.co/image/ab67616d0000b27390642478de0b53dc9c214b83'
        }
    */
})
```

## API

### Initialize/Stop

#### `start(access_token)`

Start the event listeners with your Spotify access token.

#### `stop()`

Stop the event listeners.

### Events

```JS
spotify.event.on("newSong", (song) => {
  console.log(song);
});
```

#### `on("newSong")`

Get the user's current playing song. Event will fire on song change. Right now the refresh rate is five seconds, but later on we will add an option to change that. We will also add a timer to sense when a song is about to end, and contact the Spotify endpoint accordingly. This will make updating nearly instant when a song ends.
