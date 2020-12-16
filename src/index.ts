import axios from "axios"
import { EventEmitter } from "events"
import * as crypto from 'crypto'
import * as qs from 'querystring'

const API_URL = "https://api.spotify.com/v1/me"

class MyEmitter extends EventEmitter {}

/**
 * Subscribe to events.
 * `event.on("newSong", callback)`
 */
export const event = new MyEmitter()

interface ApiData {
  client_id: string
  redirect_uri: string
  port: number
  scopes: string[]
}

interface Track {
  uri: string
  artists: string[]
  album_uri: string
  device_id: string
  is_playing: boolean
  shuffle_state: boolean
  repeat_state: string
  volume: number
  type: string
}

export class Player {
  timer: any
  access_token: string = ''
  refresh_token: string = ''
  codeVerifier: string
  codeState: string
  codeChallenge: string
  
  credentials: ApiData
  event = event
  songHolder: Track = {
    uri: '',
    artists: [],
    album_uri: '',
    device_id: '',
    is_playing: false,
    shuffle_state: false,
    repeat_state: "off",
    volume: 0,
    type: "track"
  }
  
  constructor(params: ApiData) {
    this.credentials = {
      client_id: params?.client_id,
      redirect_uri: params?.redirect_uri,
      port: params?.port,
      scopes: params?.scopes
    }
    
    this.codeVerifier = base64URLEncode(crypto.randomBytes(32))
    this.codeState = base64URLEncode(crypto.randomBytes(32))
    this.codeChallenge = base64URLEncode(sha256(this.codeVerifier))
  }

  async _get(path: string, query?: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.access_token}` 
      }
    }
    let url = API_URL + path
    if (query)
    url += qs.stringify(query)
    return await axios.get(url, config)
    .catch(error => {
      this._catch_err(error.response)
    })
  }

  async _put(path: string, data: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.access_token}` 
      }
    }
    let url = API_URL + path
    return await axios.put(url, data, config)
    .catch(error => {
      this._catch_err(error.response)
    })
  }
  
  async _post(path: string, data: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.access_token}` 
      }
    }
    let url = API_URL + path
    return await axios.post(url, data, config)
  }

  _catch_err(error: any) {
    event.emit('error', error)
    if (error.response.status == 401) {
      clearInterval()
      console.error('Bad Api Token')
    } else if (error.response.status == 429) {
      console.log('Rate limiting response')
    } else {
      console.error(error.data)
    }
  }

  /**
   * Set new access token for class
   * @param token Spotify API access token
   */
  setAccessToken(token: string) {
    this.access_token = token
  }

  /**
   * Set new refresh token for class
   * @param token Spotify API refresh token
   */
  setRefreshToken(token: string) {
    this.refresh_token = token
  }

  /**
   * Get access token for class
   * @param token Spotify API access token
   */
  getAccessToken() {
    return this.access_token
  }

  /**
   * Get refresh token for class
   * @param token Spotify API refresh token
   */
  getRefreshToken() {
    return this.refresh_token
  }


  /**
   * @returns Formatted Spotify url with redirect
   */
  getAuthUrl() {
    let authUrl: string
    authUrl = 'https://accounts.spotify.com/authorize' +
    `?response_type=code&client_id=${this.credentials.client_id}&redirect_uri=${this.credentials.redirect_uri}&` +
    `scope=${this.credentials.scopes}&state=${this.codeState}&code_challenge=${this.codeChallenge}&code_challenge_method=S256`

    return authUrl
  }

  /**
   * Async. Emits on channel 'Tokens' when completed
   * @param code Authorization code from Spotify
   */
  async getTokensFromCode(code: string) {
    let config = {headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
    let requestBody = {
      client_id: this.credentials.client_id,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.credentials.redirect_uri,
      code_verifier: this.codeVerifier
    }

    return await axios.post('https://accounts.spotify.com/api/token', qs.stringify(requestBody), config)
    .then((response: any) => {
      this.access_token = response.data.access_token
      this.refresh_token = response.data.refresh_token
      event.emit('Tokens', response.data)
    })
    .catch((err: any) => {
      throw (err)
    })
  }

  async getCurrentlyPlaying() {
    let data: any
    data = await this._get('/player')

    return data
  }

  async setDevice(id: string) {
    let data: any
    data = await this._put('/player', {
      "devices_ids": [id]
    })

    return data
  }

  /**
   * Starts timer, emits song, artist, and album changes
   * @param delay Time to refresh in ms. Default 1000ms
   */
  begin(delay: number = 1000) {
    clearInterval(this.timer)
    if (this.access_token) {
      this.getCurrentlyPlaying()
      .then(res => {
        let d = res.data

        this.songHolder = parseSpotifyResponse(d)
        event.emit('update-song', d)
        event.emit('update-artists', d)
        event.emit('update-album', d)
      })
      .catch((err: any) => {
        throw (err)
      })

      this.timer = setInterval(() => {
        this.getCurrentlyPlaying()
        .then(res => {
          let d = res.data

          if (d.item.uri != this.songHolder.uri)
            event.emit('update-song', d)
          if (d.item.album.uri != this.songHolder.album_uri)
            event.emit('update-album', d)
          if (d.device.id != this.songHolder.device_id)
            event.emit('update-device', d)
          if (d.is_playing != this.songHolder.is_playing)
            event.emit('update-playing-state', d)
          if (d.shuffle_state != this.songHolder.shuffle_state)
            event.emit('update-shuffle-state', d)
          if (d.repeat_state != this.songHolder.repeat_state)
            event.emit('update-repeat-state', d)
          if (d.device.volume_percent != this.songHolder.volume)
            event.emit('update-volume', d)
          if (d.currently_playing_type != this.songHolder.type)
            event.emit('update-playing-type', d)
          
          this.songHolder = parseSpotifyResponse(d)
          event.emit('update', res.data)
        })
        .catch((err: any) => {
          throw (err)
        })
      }, delay)
    } else {
      console.error("Access token not set!")
    }
  }
}


function sha256(str: string) {
  return crypto.createHash('sha256')
  .update(str)
  .digest()
}

function base64URLEncode(str: Buffer) {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
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
    type: data.currently_playing_type
  }
}