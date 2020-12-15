import axios from "axios";
import { EventEmitter } from "events";
import * as crypto from 'crypto';
import * as qs from 'querystring';

class MyEmitter extends EventEmitter {}

/**
 * Subscribe to events.
 * `event.on("newSong", callback)`
 */
export const event = new MyEmitter();

interface ApiData {
  client_id: string;
  redirect_uri: string;
  port: number;
  scopes: string[];
}

export class Player {
  timer: any = setInterval(()=>{});
  access_token: string = '';
  refresh_token: string = '';
  codeVerifier: string
  codeState: string
  codeChallenge: string
  
  credentials: ApiData;
  
  constructor(params: ApiData) {
    this.credentials = {
      client_id: params?.client_id,
      redirect_uri: params?.redirect_uri,
      port: params?.port,
      scopes: params?.scopes
    }
    
    this.codeVerifier = base64URLEncode(crypto.randomBytes(32));
    this.codeState = base64URLEncode(crypto.randomBytes(32));
    this.codeChallenge = base64URLEncode(sha256(this.codeVerifier));
  }


  /**
   * @returns Formatted Spotify url with redirect
   */
  getAuthUrl() {
    let authUrl: string
    authUrl = 'https://accounts.spotify.com/authorize' +
    `?response_type=code&client_id=${this.credentials.client_id}&redirect_uri=${this.credentials.redirect_uri}&` +
    `scope=${this.credentials.scopes}&state=${this.codeState}&code_challenge=${this.codeChallenge}&code_challenge_method=S256`;

    return authUrl;
  }

  /**
   * Changes callback port from the default 4444
   * @param port port for callback
   */
  changePort(port: number) {
    this.credentials.port = port;
  }

  getTokensFromCode(code: string) {
    let config: Object = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }

    let requestBody = {
      client_id: this.credentials.client_id,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.credentials.redirect_uri,
      code_verifier: this.codeVerifier
    };

    axios.post('https://accounts.spotify.com/api/token', qs.stringify(requestBody), config)
    .then((response: any) => {
      this.access_token = response.data.access_token;
      this.refresh_token = response.data.refresh_token;
      event.emit('Tokens', response.data);
    })
    .catch((err: any) => {
      console.error(err);
    });
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
      getPlayer(this.access_token).then((response: any) => {
        event.emit("refresh", response);
      })
    }, delay);    
  }

  cancelRefresh() {
    clearInterval(this.timer);
  }
}

function sha256(str: string) {
  return crypto.createHash('sha256')
  .update(str)
  .digest();
};

function base64URLEncode(str: Buffer) {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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
