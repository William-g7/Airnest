function decodeBase64Url(input: string) {
    let s = input.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return Buffer.from(s, 'base64').toString('utf8');
  }
  
  export function parseJwt<T = any>(token: string): T {
    const payload = token.split('.')[1] ?? '';
    return JSON.parse(decodeBase64Url(payload));
  }