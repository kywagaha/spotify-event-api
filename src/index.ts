import axios from "axios";
import { EventEmitter } from "events";

class MyEmitter extends EventEmitter {}

/**
 * Subscribe to events.
 * `event.on("newSong", callback)`
 */
export const event = new MyEmitter();

interface Track {
  uri: string;
  name: string;
  artists: string[];
  art: string;
}

let running = false;

/**
 * Start the event listeners.
 * @param access_token Spotify access token
 */
export function start(access_token: string) {
  if (!running) {
    if (!access_token) {
      console.error("no access token");
    } else {
      checkSong(access_token);
      running = true;
    }
  } else {
    console.error("already running!");
  }
}

function checkSong(access_token: string) {
  let currentSong: Track;
  try {
    getTrack(access_token).then((response) => {
      currentSong = {
        uri: response.data.item.uri,
        name: response.data.item.name,
        artists: response.data.item.artists,
        art: response.data.item.album.images[0].url,
      };
      event.emit("newSong", currentSong);
    });
    setInterval(() => {
      getTrack(access_token).then((response) => {
        let thisSong: Track = {
          uri: response.data.item.uri,
          name: response.data.item.name,
          artists: response.data.item.artists,
          art: response.data.item.album.images[0].url,
        };

        if (thisSong.uri != currentSong?.uri) {
          event.emit("newSong", thisSong);
        }

        currentSong = {
          uri: thisSong.uri,
          name: thisSong.name,
          artists: thisSong.artists,
          art: thisSong.art,
        };
      });
    }, 5000);
  } catch (e) {
    console.error(e);
  }
}

function getTrack(access_token: string) {
  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  };

  return axios.get(
    "https://api.spotify.com/v1/me/player/currently-playing",
    config
  );
}
