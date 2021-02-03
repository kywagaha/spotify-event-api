import axios from "axios";
import { EventEmitter } from "events";
import * as crypto from "crypto";
import * as qs from "querystring";

const API_URL = "https://api.spotify.com/v1/me";

class MyEmitter extends EventEmitter {}

/**
 * Subscribe to events.
 * `event.on("newSong", callback)`
 */

interface Credentials {
  client_id: string;
  redirect_uri: string;
  scopes: string[];
  access_token: string;
  refresh_token: string;
}

interface Track {
  uri: string;
  artists: string[];
  album_uri: string;
  device_id: string;
  is_playing: boolean;
  shuffle_state: boolean;
  repeat_state: string;
  volume: number;
  type: string;
  context: Object;
}

interface Progress {
  duration_ms: number;
  progress_ms: number;
  progress_percent: number;
  delta_percent: number;
  delta_ms: number;
}

export class Player {
  event = new MyEmitter();
  timer: any = null;
  codeVerifier: string;
  codeState: string;
  codeChallenge: string;
  eventList: any = [
    "update-song",
    "update-album",
    "update-device",
    "update-playing-state",
    "update-shuffle-state",
    "update-repeat-state",
    "update-volume",
    "update-playing-type",
  ];
  credentials: Credentials = {
    client_id: "",
    redirect_uri: "",
    scopes: [],
    access_token: "",
    refresh_token: "",
  };
  songHolder: Track = {
    uri: "",
    artists: [],
    album_uri: "",
    device_id: "",
    is_playing: false,
    shuffle_state: false,
    repeat_state: "off",
    volume: 0,
    type: "track",
    context: {},
  };
  progressData: Progress = {
    duration_ms: 0,
    progress_ms: 0,
    delta_ms: 0,
    delta_percent: 0,
    progress_percent: 0,
  };
  playerData: any = {};

  /**
   *
   * @param params Optional object. 'client_id', 'redirect_uri', 'scopes'
   */
  constructor(params?: any) {
    if (params) {
      (this.credentials.client_id = params.client_id),
        (this.credentials.redirect_uri = params.redirect_uri),
        (this.credentials.scopes = params.scopes);
    }

    this.codeVerifier = base64URLEncode(crypto.randomBytes(32));
    this.codeState = base64URLEncode(crypto.randomBytes(32));
    this.codeChallenge = base64URLEncode(sha256(this.codeVerifier));
  }

  _get(path: string, query?: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    };
    let url = API_URL + path;
    if (query) url += qs.stringify(query);
    return axios.get(url, config);
  }

  _put(path: string, data?: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    };
    let url = API_URL + path;
    return axios.put(url, data, config);
  }

  _post(path: string, data?: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    };
    let url = API_URL + path;
    return axios.post(url, qs.stringify(data), config);
  }

  update(callback?: any) {
    this.getCurrentlyPlaying((res: any) => {
      if (res.data) {
        res = res.data;
        if (res.item.uri != this.songHolder.uri)
          this.event.emit("update-song", res);
        if (res.item.album.uri != this.songHolder.album_uri)
          this.event.emit("update-album", res);
        if (res.device.id != this.songHolder.device_id)
          this.event.emit("update-device", res);
        if (res.is_playing != this.songHolder.is_playing)
          this.event.emit("update-playing-state", res);
        if (res.shuffle_state != this.songHolder.shuffle_state)
          this.event.emit("update-shuffle-state", res);
        if (res.repeat_state != this.songHolder.repeat_state)
          this.event.emit("update-repeat-state", res);
        if (res.device.volume_percent != this.songHolder.volume)
          this.event.emit("update-volume", res);
        if (res.currently_playing_type != this.songHolder.type)
          this.event.emit("update-playing-type", res);

        let deltaMs = res.progress_ms - this.progressData.progress_ms;
        let deltaPercent =
          res.progress_ms / res.item.duration_ms -
          this.progressData.progress_percent;
        this.progressData = {
          duration_ms: res.item.duration_ms,
          progress_ms: res.progress_ms,
          progress_percent: res.progress_ms / res.item.duration_ms,
          delta_ms: deltaMs,
          delta_percent: deltaPercent,
        };
        this.event.emit("progress", this.progressData);
        this.songHolder = parseSpotifyResponse(res);
      } else {
        for (let e of this.eventList) {
          this.event.emit(e, null);
          this.songHolder = {
            uri: "",
            artists: [],
            album_uri: "",
            device_id: "",
            is_playing: false,
            shuffle_state: false,
            repeat_state: "off",
            volume: 0,
            type: "track",
            context: {},
          };
        }
      }
      if (callback) callback();
    });
  }

  _catch(error: any) {
    console.error(error.response.data);
  }

  setAccessToken(token: string) {
    this.credentials.access_token = token;
  }

  setRefreshToken(token: string) {
    this.credentials.refresh_token = token;
  }

  getAccessToken() {
    return this.credentials.access_token;
  }

  getRefreshToken() {
    return this.credentials.refresh_token;
  }

  /**
   * @returns Formatted Spotify url with redirect
   */
  getAuthUrl() {
    let authUrl: string;
    authUrl =
      "https://accounts.spotify.com/authorize" +
      `?response_type=code&client_id=${this.credentials.client_id}&redirect_uri=${this.credentials.redirect_uri}&` +
      `scope=${this.credentials.scopes}&state=${this.codeState}&code_challenge=${this.codeChallenge}&code_challenge_method=S256`;

    return authUrl;
  }

  getSavedUserData() {
    return this.songHolder;
  }

  getSavedPlayerData() {
    return this.playerData;
  }

  eventListener(callback: any) {
    for (let e of this.eventList) {
      this.event.on(e, (res) => {
        callback(e, res);
      });
    }
  }

  getTokensFromCode(code: string, callback?: any) {
    let config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    let requestBody = {
      client_id: this.credentials.client_id,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.credentials.redirect_uri,
      code_verifier: this.codeVerifier,
    };

    axios
      .post(
        "https://accounts.spotify.com/api/token",
        qs.stringify(requestBody),
        config
      )
      .then((response) => {
        this.setAccessToken(response.data.access_token);
        this.setRefreshToken(response.data.refresh_token);
        if (callback) callback(response.data);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  getCurrentlyPlaying(callback?: any) {
    this._get("/player")
      .then((res) => {
        if (callback) callback(res);
        if (res.status == 200) {
          if (res.data) this.playerData = res.data;
        }
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  getUserDevices(callback?: any) {
    this._get("/player/devices")
      .then((res) => {
        this.update(callback);
        for (let i = 0; i < res.data.devices.length; i++) {
          if (res.data.devices[i].is_active) {
            this.songHolder.device_id = res.data.devices[i].id;
            this.songHolder.volume = res.data.devices[i].volume_percent;
          }
        }
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  getUserPlaylists(callback: any) {
    this._get("/playlists")
      .then((res) => {
        callback(res);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  getPlaylist(playlist_id: string, callback: any) {
    this._get(`/playlists/${playlist_id}`)
      .then((res) => {
        callback(res.data);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  setDevice(id: string, callback?: any) {
    let body = {
      device_ids: [id],
    };
    this._put("/player/", body)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  addToUserQueue(body: any, callback?: any) {
    let url = "/player/queue/?" + qs.stringify(body);
    this._post(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  play(callback?: any) {
    let url = "/player/play";
    this._put(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  pause(callback?: any) {
    let url = "/player/pause";
    this._put(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  skip(callback?: any) {
    let url = "/player/next";
    this._post(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  previous(callback?: any) {
    let url = "/player/previous";
    this._post(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  repeat(state: string, callback?: any) {
    let url = "/player/repeat?" + qs.stringify({ state: state });
    this._put(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  shuffle(state: boolean, callback?: any) {
    let url = "/player/shuffle?" + qs.stringify({ state: state });
    this._put(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }
  togglePlayback(callback?: any) {
    this.getCurrentlyPlaying((response: any) => {
      console.log(response.data.is_playing);
      if (response.data.is_playing === true) this.pause(callback);
      else if (response.data.is_playing === false) this.play(callback);
    });
  }

  toggleRepeat(callback?: any) {
    this.getCurrentlyPlaying((response: any) => {
      switch (response.data.repeat_state) {
        case "off":
          this.repeat("context", callback);
          break;
        case "context":
          this.repeat("track", callback);
          break;
        case "track":
          this.repeat("off", callback);
      }
    });
  }

  toggleShuffle(callback?: any) {
    this.getCurrentlyPlaying((response: any) => {
      this.shuffle(!response.data.shuffle_state, callback);
    });
  }

  setVolume(value: number, callback?: any) {
    let url = "/player/volume?" + qs.stringify({ volume_percent: value });
    this._put(url)
      .then(() => {
        this.update(callback);
      })
      .catch((error) => {
        this._catch(error);
      });
  }

  /* Commented out because handling an interval in a library was too buggy */
  //
  // /**
  //  * Starts timer, emits changes
  //  * @param delay Time to refresh in ms. Default 1000ms
  //  */
  // begin(delay: number = 1000) {
  //   this.stop();
  //   if (this.getAccessToken() != "") {
  //     this.getCurrentlyPlaying((res: any) => {
  //       if (res != "") {
  //         for (let e of this.eventList) {
  //           this.event.emit(e, res);
  //         }
  //         if (res.data)
  //         this.songHolder = parseSpotifyResponse(res.data);
  //       } else {
  //         for (let e of this.eventList) {
  //           this.event.emit(e, "");
  //         }
  //       }
  //     });

  //     if (this.timer === null) {
  //       console.log(`Updating every ${delay} ms`);
  //       setInterval(() => {
  //         this.update();
  //       }, delay);
  //     }
  //   } else {
  //     console.error("Access token not set!");
  //   }
  // }

  // /**
  //  * Stop timer (and kill program)
  //  */
  // stop() {
  //   clearInterval(this.timer);
  //   this.timer = null;
  // }
}

function sha256(str: string) {
  return crypto.createHash("sha256").update(str).digest();
}

function base64URLEncode(str: Buffer) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function parseSpotifyResponse(data: any) {
  return {
    uri: data.item.uri,
    artists: data.item.artists,
    album_uri: data.item.album.uri,
    device_id: data.device.id,
    is_playing: data.is_playing,
    shuffle_state: data.shuffle_state,
    repeat_state: data.repeat_state,
    volume: data.device.volume_percent,
    type: data.currently_playing_type,
    context: data.context,
  };
}
