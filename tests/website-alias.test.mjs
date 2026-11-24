import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import config from '../next.config.ts';
const { unstable_getResponseFromNextConfig } = createRequire(import.meta.url)('next/experimental/testing/server');

async function location(host, path) {
  const response = await unstable_getResponseFromNextConfig({
    url: 'https://' + host + path, headers: { host }, nextConfig: config,
  });
  return response.headers.get('location');
}

test('public pages share the canonical employee login on both homepage aliases', async () => {
  for (const host of ['www.exventure.co.kr', 'exventure-website.vercel.app']) {
    assert.equal(await location(host, '/'), 'https://exventure.co.kr/');
    assert.equal(await location(host, '/activities/example?lang=ko'), 'https://exventure.co.kr/activities/example?lang=ko');
    assert.equal(await location(host, '/auth/company/callback?code=fixture'), null);
  }
  assert.equal(await location('exventure.co.kr', '/tools'), null);
  assert.equal(await location('preview.example.org', '/tools'), null);
});
