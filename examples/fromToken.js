var spotifyEventApi = require('../lib/index.js')
var sPlay = new spotifyEventApi.Player()

sPlay.setAccessToken(
    'BQCL3Tpik8JCXO4TbCfbzfEVdGOBEoASTwZsYlng2OmnhKv8Wu5Hi_A9-hE8cLWtqcw_MOwUBrATO9S5sjGkIaddB3IhoB0udHs1lkJUjUdmUvg0Q4q5MAYcuGgiuah6b530-g20kWpkN2rAaScWWrUZ4w9pOxdyiC5i1_SNNzPT7Q'
)

sPlay.begin()

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