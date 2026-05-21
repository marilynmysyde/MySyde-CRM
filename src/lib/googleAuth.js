// src/lib/googleAuth.js
// Google Identity Services (GIS) OAuth helper.
// Loads the GIS script lazily and manages the access token in sessionStorage.
//
// Usage:
//   import { requestGoogleToken, getGoogleToken, isGoogleConnected } from '../lib/googleAuth'
//   await requestGoogleToken()          // opens the Google sign-in popup
//   const token = getGoogleToken()      // null if not connected / expired
//   isGoogleConnected()                 // boolean

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ')

const TOKEN_KEY  = 'google_access_token'
const EXPIRY_KEY = 'google_token_expiry'

// ─── Load GIS script ────────────────────────────────────────────────────────

let _scriptLoaded = false
let _tokenClient  = null

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (_scriptLoaded) { resolve(); return }
    const script  = document.createElement('script')
    script.src    = 'https://accounts.google.com/gsi/client'
    script.async  = true
    script.onload = () => { _scriptLoaded = true; resolve() }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getGoogleToken() {
  const token  = sessionStorage.getItem(TOKEN_KEY)
  const expiry = Number(sessionStorage.getItem(EXPIRY_KEY) ?? 0)
  if (!token || Date.now() >= expiry) return null
  return token
}

export function isGoogleConnected() {
  return !!getGoogleToken()
}

export function clearGoogleToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRY_KEY)
}

export async function requestGoogleToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID not set')

  await loadGisScript()

  return new Promise((resolve, reject) => {
    if (!_tokenClient) {
      // @ts-ignore — global injected by GIS script
      _tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:     SCOPES,
        callback:  (response) => {
          if (response.error) { reject(response); return }
          const expiresIn = Number(response.expires_in ?? 3600)
          sessionStorage.setItem(TOKEN_KEY,  response.access_token)
          sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000 - 60_000))
          resolve(response.access_token)
        },
      })
    }
    _tokenClient.requestAccessToken({ prompt: '' })
  })
}
