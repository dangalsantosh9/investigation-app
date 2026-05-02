const BASE = 'http://localhost:7715';

interface ApiResult<T> {
  status: number;
  ok: boolean;
  data: T;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE}${url}`, options);
    let data: T;
    const text = await res.text();
    try {
      data = text ? (JSON.parse(text) as T) : (null as T);
    } catch {
      data = text as unknown as T;
    }
    return { status: res.status, ok: res.ok, data };
  } catch {
    return { status: 0, ok: false, data: null as T };
  }
}

export function get<T>(url: string): Promise<ApiResult<T>> {
  return request<T>('GET', url);
}

export function post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>('POST', url, body);
}

export function patch<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>('PATCH', url, body);
}

export function del<T>(url: string): Promise<ApiResult<T>> {
  return request<T>('DELETE', url);
}

export async function postForm<T>(url: string, formData: FormData): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${url}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    let data: T;
    const text = await res.text();
    try {
      data = text ? (JSON.parse(text) as T) : (null as T);
    } catch {
      data = text as unknown as T;
    }
    return { status: res.status, ok: res.ok, data };
  } catch {
    return { status: 0, ok: false, data: null as T };
  }
}
