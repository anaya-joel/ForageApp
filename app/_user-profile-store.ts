let _userName = '';
let _userEmail = '';

export function getUserName(): string {
  return _userName;
}

export function setUserName(name: string): void {
  _userName = name;
}

export function getUserEmail(): string {
  return _userEmail;
}

export function setUserEmail(email: string): void {
  _userEmail = email;
}
