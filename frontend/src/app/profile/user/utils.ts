export function getUserAvatarUrl(username: string | null): string {
  if (!username) {
    return "/assets/telegram-ico.svg";
  }
  return `https://t.me/i/userpic/320/${username}.jpg`;
}
