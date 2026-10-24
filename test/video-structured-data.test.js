import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Roof AI video structured data has a valid timezone-qualified uploadDate', async () => {
  const html = await readFile(new URL('../public/roofing-missed-call-demo/index.html', import.meta.url), 'utf8');
  const structuredData = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  const videos = structuredData.filter((item) => item['@type'] === 'VideoObject');
  assert.equal(videos.length, 1);
  const [video] = videos;
  assert.match(video.uploadDate, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  assert.ok(Number.isFinite(Date.parse(video.uploadDate)));
  assert.equal(video.contentUrl, 'https://www.roofaileadrecovery.com/media/roof-ai-demo-20261014-polished.mp4');
  assert.match(html, /href="\/#inquiry"/);
});
