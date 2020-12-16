var spotifyEventApi = require('../lib/index.js')
var express = require('express');
var app = express();

const port = 4444;

var server = app.listen(port)
console.log('listening on port 4444')

var sPlay = new spotifyEventApi.Player({
    client_id: 'a9ce5b430aca4e87ae43c8e4c243013e',
    redirect_uri: `http://localhost:${port}/callback`,
    port: port,
    scopes: ["user-read-playback-state"]
})

app.get('/callback', (req, res) => {
    server.close()
    var code = req.query.code;
    console.log(code);
    sPlay.getTokensFromCode(code)
    .then((res) => {
        sPlay.begin()
        main()
    })

    res.send('<h1>You may close this window</h1>')
});
console.log(sPlay.getAuthUrl())

sPlay.event.on('update-song', res => {
    console.log('Track:', res.item.name)
})
sPlay.event.on('update-album', res => {
    console.log('Album:', res.item.album.name)
})
sPlay.event.on('update-device', res => {
    console.log('Device:', res.device.name)
})
sPlay.event.on('update-playing-state', res => {
    console.log('Playing:', res.is_playing)
})
sPlay.event.on('update-shuffle-state', res => {
    console.log('Shuffle:', res.shuffle_state)
})
sPlay.event.on('update-repeat-state', res => {
    console.log('Repeat:', res.repeat_state)
})
sPlay.event.on('update-volume', res => {
    console.log('Volume:', res.device.volume_percent)
})
sPlay.event.on('update-playing-type', res => {
    console.log('Playing type:', res.currently_playing_type)
})
/**
 * sPlay.event.on('update', res => {
 *      console.log('Update:', res)
 * })
 */


function main() {
    console.log('\n', sPlay.getAccessToken())
}