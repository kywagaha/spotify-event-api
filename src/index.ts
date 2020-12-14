import axios from "axios";
import { EventEmitter } from "events";

class MyEmitter extends EventEmitter {}
export const emitter = new MyEmitter();

interface Track {
  uri: string;
  name: string;
  artists: string[];
  art: string;
}

export function start(access_token: string) {
  checkSong(access_token);
}

function checkSong(access_token: string) {
  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  };

  try {
    let currentSong: Track;
    setInterval(() => {
      axios
        .get("https://api.spotify.com/v1/me/player/currently-playing", config)
        .then((response) => {
          let thisSong: Track = {
            uri: response.data.item.uri,
            name: response.data.item.name,
            artists: response.data.item.artists,
            art: response.data.item.album.images[0].url,
          };

          if (thisSong.uri != currentSong?.uri) {
            emitter.emit("newSong", thisSong);
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
