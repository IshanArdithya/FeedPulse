const TOKEN_NAME = "feedpulse_admin_token";

export function getAdminToken() {
  if (typeof window === "undefined") return null;

  const name = TOKEN_NAME + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;

  const d = new Date();
  d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const expires = "expires=" + d.toUTCString();
  document.cookie = `${TOKEN_NAME}=${token};${expires};path=/;SameSite=Lax`;
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  document.cookie = `${TOKEN_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

