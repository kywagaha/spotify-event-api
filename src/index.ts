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

interface Credentials {
  client_id: string
  redirect_uri: string
  scopes: string[]
  access_token: string
  refresh_token: string
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
  context: Object
}

export class Player {
  event = new MyEmitter()
  timer: any
  codeVerifier: string
  codeState: string
  codeChallenge: string
  credentials: Credentials = {
    client_id: '',
    redirect_uri: '',
    scopes: [],
    access_token: '',
    refresh_token: '',
  }
  songHolder: Track = {
    uri: '',
    artists: [],
    album_uri: '',
    device_id: '',
    is_playing: false,
    shuffle_state: false,
    repeat_state: "off",
    volume: 0,
    type: "track",
    context: {}
  }
  
  /**
   * 
   * @param params Optional object. Requires 'client_id', 'redirect_uri'
   */
  constructor(params?: any) {
    if (params) {
      this.credentials.client_id = params.client_id,
      this.credentials.redirect_uri = params.redirect_uri,
      this.credentials.scopes = params.scopes
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
        Authorization: `Bearer ${this.getAccessToken()}` 
      }
    }
    let url = API_URL + path
    if (query)
    url += qs.stringify(query)
    return await axios.get(url, config)
  }

  async _put(path: string, data?: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAccessToken()}` 
      }
    }
    let url = API_URL + path
    return await axios.put(url, data, config)
  }
  
  async _post(path: string, data?: any) {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAccessToken()}` 
      }
    }
    let url = API_URL + path
    return await axios.post(url, qs.stringify(data), config)    
  }


  setAccessToken(token: string) {
    this.credentials.access_token = token
  }

  setRefreshToken(token: string) {
    this.credentials.refresh_token = token
  }

  getAccessToken() {
    return this.credentials.access_token
  }

  getRefreshToken() {
    return this.credentials.refresh_token
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
  async getTokensFromCode(code: string, callback?: any) {
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

    return await axios.post(
      'https://accounts.spotify.com/api/token', qs.stringify(requestBody), config
    )
    .then((response: any) => {
      this.setAccessToken(response.data.access_token)
      this.setRefreshToken(response.data.refresh_token)
      if (callback)
        callback(response.data)
    })
    .catch((err: any) => {
      throw (err)
    })
  }

  getSavedUserData() {
    return this.songHolder
  }


  /**
   * @returns GET /player
   */
  async getCurrentlyPlaying(callback?: any) {
    let data: any
    data = await this._get('/player')
    .then(res => {
      this.songHolder = parseSpotifyResponse(res.data)

      if (callback)
        callback(res)
    })
    .catch(error => {
      console.log(error.response.data)
    })
    return data
  }

  /**
   * @returns GET /player/devices
   */
  async getUserDevices(callback?: any) {
    let data: any
    data = await this._get('/player/devices')
    .then(res => {
      if (callback)
        callback(res.data)
    })
    .catch(error => {
      console.error(error.response.data)
    })
    return data
  }

  async getUserPlaylists(callback?: any) {
    let data: any
    data = await this._get('/playlists')
    .then(res => {
      if (callback)
        callback(res.data)
    })
    .catch(error => {
      console.error(error.response.data)
    })
    return data
  }

  async getPlaylist(playlist_id: string, callback?: any) {
    let data: any
    data = await this._get(`/playlists/${playlist_id}`)
    .then(res => {
      if (callback)
        callback(res)
    })
    .catch(error => {
      console.error(error.response.data)
    })
    return data
  }
  
  /**
   * 
   * @param id 
   */
  async setDevice(id: string, callback?: any) {
    let data: any
    let body = {
      device_ids: [id]
    }

    data = await this._put('/player/', body)
    .then(res => {
      if (callback)
        callback(res.data)
    })
    .catch(error => {
      console.error(error.response.data)
    })
    return data
  }

  async addToUserQueue(body: any, callback?:any) {
    let data: any
    let url = '/player/queue/?' + qs.stringify(body)
    data = await this._post(url)
    .then(function() {
      if (callback)
        callback()
    })
    .catch(error => {
      console.error(error.response.data)
    })
    return data
  }



  /**
   * Starts timer, emits song, artist, and album changes
   * @param delay Time to refresh in ms. Default 1000ms
   */
  begin(delay: number = 1000) {
    clearInterval(this.timer)
    if (this.getAccessToken() != '') {
      this.getCurrentlyPlaying()
      .then(res => {
        let d = res.data

        this.songHolder = parseSpotifyResponse(d)
        this.event.emit('update-song', d)
        this.event.emit('update-artists', d)
        this.event.emit('update-album', d)
      })
      .catch(error => {
        console.error(error.response.data)
      })

      this.timer = setInterval(() => {
        this.getCurrentlyPlaying()
        .then(res => {
          let d = res.data

          if (d.item.uri != this.songHolder.uri)
            this.event.emit('update-song', d)
          if (d.item.album.uri != this.songHolder.album_uri)
            this.event.emit('update-album', d)
          if (d.device.id != this.songHolder.device_id)
            this.event.emit('update-device', d)
          if (d.is_playing != this.songHolder.is_playing)
            this.event.emit('update-playing-state', d)
          if (d.shuffle_state != this.songHolder.shuffle_state)
            this.event.emit('update-shuffle-state', d)
          if (d.repeat_state != this.songHolder.repeat_state)
            this.event.emit('update-repeat-state', d)
          if (d.device.volume_percent != this.songHolder.volume)
            this.event.emit('update-volume', d)
          if (d.currently_playing_type != this.songHolder.type)
            this.event.emit('update-playing-type', d)
          
          this.songHolder = parseSpotifyResponse(d)
          this.event.emit('update', res.data)
        })
        .catch(error => {
          console.error(error.response.data)
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
    type: data.currently_playing_type,
    context: data.context
  }
}