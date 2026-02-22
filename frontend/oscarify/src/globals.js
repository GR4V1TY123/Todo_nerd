export let username = sessionStorage.getItem('username') || ''
export let password = sessionStorage.getItem('password') || ''

export function setUsername(value) {
  username = value
  sessionStorage.setItem('username', value)
}

export function setPassword(value) {
  password = value
  sessionStorage.setItem('password', value)
}

export function clearSession() {
  username = ''
  password = ''
  sessionStorage.removeItem('username')
  sessionStorage.removeItem('password')
}
