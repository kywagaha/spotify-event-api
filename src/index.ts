import axios from "axios";
import { EventEmitter } from "events";

class MyEmitter extends EventEmitter {}

/**
 * Subscribe to events.
 * `event.on("newSong", callback)`
 */
export const event = new MyEmitter();

interface Item {
  songURI: string;
  artists: Object;
  albumURI: string;
}


/**
 * Start the event listeners.
 * @param access_token Spotify access token
 */
export function start(access_token: string) {
  if (!access_token) {
    console.error("no access token");
  } else {

  }
}

export class Player {
  timer: Object = setInterval(()=>{});
  access_token: string;

  
  constructor() {
    this.access_token = '';
  }

  

  /**
   * Spotify API token with scopes for /player
   * @param token Spotify API Token
   */
  setAccessToken(token: string) {
    this.access_token = token;
  }

  /**
   * Starts timer, emits song, artist, and album changes
   * @param number Time to refresh in ms. Default 1000ms
   */
  checkRefresh(delay: number = 1000) {
    this.timer = setInterval(() => {
      getPlayer(this.access_token).then((response) => {
        event.emit("refresh", response);
      })
    }, delay);    
  }

  cancelRefresh() {
    clearInterval(this.timer);
  }
}


function getPlayer(access_token: string) {
  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  };

  return axios.get(
    "https://api.spotify.com/v1/me/player/",
    config
  );
}
