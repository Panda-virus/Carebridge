export function getFileNameFromContentDisposition(response: Response): string | undefined {
  const contentDisposition = response.headers.get('Content-Disposition');
  if (!contentDisposition) {
    return undefined;
  }

  const match = /filename\*?=(?:UTF-8''?)?["']?([^"';]+)/i.exec(contentDisposition);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function downloadProtectedFile(url: string, defaultFilename?: string) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = 'Unable to download file.';
    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = getFileNameFromContentDisposition(response) || defaultFilename || url.split('/').pop() || 'download';
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}
