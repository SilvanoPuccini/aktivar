const POST_AUTH_PATH_KEY = 'aktivar_post_auth_path';

export function buildReturnPath(pathname: string, search = '', hash = '') {
  return `${pathname}${search}${hash}`;
}

export function preparePostAuthRedirect(pathname: string, search = '', hash = '') {
  const returnPath = buildReturnPath(pathname, search, hash);
  savePostAuthPath(returnPath);
  return returnPath;
}

export function savePostAuthPath(path: string) {
  if (typeof window === 'undefined' || !path.startsWith('/')) return;
  sessionStorage.setItem(POST_AUTH_PATH_KEY, path);
}

export function consumePostAuthPath(defaultPath = '/') {
  if (typeof window === 'undefined') return defaultPath;

  const savedPath = sessionStorage.getItem(POST_AUTH_PATH_KEY);
  sessionStorage.removeItem(POST_AUTH_PATH_KEY);

  return savedPath && savedPath.startsWith('/') ? savedPath : defaultPath;
}
