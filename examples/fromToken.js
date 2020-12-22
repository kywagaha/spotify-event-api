var spotifyEventApi = require("@kywagaha/spotify-event-api");
var sPlay = new spotifyEventApi.Player();

sPlay.setAccessToken("token");

// sPlay.begin()

// sPlay.event.on('update-song', res => {
//     console.log('Track:', res.item.name)
// })
// sPlay.event.on('update-album', res => {
//     console.log('Album:', res.item.album.name)
// })
// sPlay.event.on('update-device', res => {
//     console.log('Device:', res.device.name)
// })
// sPlay.event.on('update-playing-state', res => {
//     console.log('Playing:', res.is_playing)
// })
// sPlay.event.on('update-shuffle-state', res => {
//     console.log('Shuffle:', res.shuffle_state)
// })
// sPlay.event.on('update-repeat-state', res => {
//     console.log('Repeat:', res.repeat_state)
// })
// sPlay.event.on('update-volume', res => {
//     console.log('Volume:', res.device.volume_percent)
// })
// sPlay.event.on('update-playing-type', res => {
//     console.log('Playing type:', res.currently_playing_type)
// })
// /**
//  * sPlay.event.on('update', res => {
//  *      console.log('Update:', res)
//  * })
//  */

// sPlay.getUserDevices(function(data) {
//     // console.log(data)
// })

// sPlay.getUserPlaylists(function(res) {
//     for (var i=0; i<res.items.length; i++) {
//         console.log(res.items[i].name)
//     }
// })

// sPlay.getCurrentlyPlaying(res => {
//     // console.log(res)
// })

sPlay.begin();

sPlay.eventListener(function (myEvent, myEventResponse) {
  console.log(myEvent, "");
});

// sPlay.event.on('update-song', res => {
//     console.log(res.item.name)
// })

// sPlay.eventListener((eName, data) => {
//     console.log(eName, data)
// })

// sPlay.addToUserQueue({
//     uri: 'spotify:track:2BHj31ufdEqVK5CkYDp9mA'
// }, function (data) {
//    console.log(data)
// })

// sPlay.setDevice("")
