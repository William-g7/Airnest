export const getCsrfToken = (): string => {
  if (typeof document === 'undefined') return '';

  const csrfCookie = document.cookie
    .split(';')
    .find(cookie => cookie.trim().startsWith('csrftoken='));

  if (!csrfCookie) return '';

  return csrfCookie.split('=')[1].trim();
};

export const initCsrfToken = async (): Promise<string> => {
  const existingToken = getCsrfToken();
  if (existingToken) return existingToken;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/csrf/`, {
      method: 'GET',
      credentials: 'include',
    });

    return getCsrfToken();
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return '';
  }
};

export const csrfService = {
  getCsrfToken,
  initCsrfToken,
};
