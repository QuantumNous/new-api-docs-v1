import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GET } from '../../src/app/api/plugins/[[...path]]/route';
import { catalog, changelog, detail } from './fixtures';

const context = (path: string[] = []) => ({
  params: Promise.resolve({ path }),
});
const request = (query = '') =>
  new Request(`https://docs.newapi.ai/api/plugins${query}`);

test('catalog fetch selects a fixed official origin with bounded requests and cache', async (t) => {
  const calls: {
    url: string;
    init?: RequestInit;
  }[] = [];
  t.mock.method(globalThis, 'fetch', async (input: URL, init: RequestInit) => {
    calls.push({ url: input.toString(), init });
    return Response.json({ success: true, data: catalog });
  });
  for (const site of ['pro', 'ai']) {
    const response = await GET(request(`?site=${site}`), context());
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control')!, /s-maxage=300/);
    assert.equal((await response.json()).data.plugins.length, 2);
  }
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      'https://www.newapi.pro/api/v1/plugins',
      'https://www.newapi.ai/api/v1/plugins',
    ]
  );
  assert.deepEqual(calls[0].init?.next, { revalidate: 300 });
  assert.equal(calls[0].init?.redirect, 'error');
  assert.ok(calls[0].init?.signal instanceof AbortSignal);
  assert.deepEqual(calls[0].init?.headers, {
    Accept: 'application/json',
    'User-Agent': 'new-api-docs-v1',
  });
});

test('only catalog, detail and changelog paths are forwarded', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('must not fetch');
  });
  for (const path of [
    ['..'],
    ['index.json'],
    ['demo', 'plugin.js'],
    ['demo', '2.0.0', 'plugin.js'],
    ['demo', '..', 'changelog'],
    ['demo/other'],
  ]) {
    assert.equal((await GET(request(), context(path))).status, 404);
  }
  assert.equal(
    (await GET(request('?site=https://example.com'), context())).status,
    400
  );
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('detail defaults to .ai and preserves normalized usage and protocol data', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input: URL) => {
    assert.equal(input.href, 'https://www.newapi.ai/api/v1/plugins/demo');
    return Response.json({ success: true, data: detail });
  });
  const response = await GET(request(), context(['demo']));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, detail);
});

test('changelog requests the selected version in Chinese and supports missing historical notes', async (t) => {
  let payload: typeof changelog | null = changelog;
  t.mock.method(globalThis, 'fetch', async (input: URL) => {
    assert.equal(
      input.href,
      'https://www.newapi.pro/api/v1/plugins/demo/2.0.0/changelog?locale=zh'
    );
    return Response.json({ success: true, data: payload });
  });
  const first = await GET(
    request('?site=pro'),
    context(['demo', '2.0.0', 'changelog'])
  );
  assert.deepEqual((await first.json()).data, changelog);
  payload = null;
  assert.deepEqual(
    await (
      await GET(request('?site=pro'), context(['demo', '2.0.0', 'changelog']))
    ).json(),
    { success: true, data: null }
  );
});

test('mismatched plugin or version cannot appear under the selected detail', async (t) => {
  let payload: unknown = { ...detail, key: 'another' };
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ success: true, data: payload })
  );
  assert.equal((await GET(request(), context(['demo']))).status, 502);
  payload = { ...changelog, version: '1.0.0' };
  assert.equal(
    (await GET(request(), context(['demo', '2.0.0', 'changelog']))).status,
    502
  );
});

test('upstream errors, malformed responses and timeouts are uncached failures', async (t) => {
  let result: () => Response | Promise<Response> = () =>
    new Response('', { status: 503 });
  t.mock.method(globalThis, 'fetch', () => result());
  for (const [makeResult, expected] of [
    [() => new Response('', { status: 503 }), 502],
    [() => new Response('', { status: 404 }), 404],
    [() => new Response('<html>error</html>'), 502],
    [() => Response.json({ success: false, message: 'internal details' }), 502],
    [() => Response.json({ success: true, data: { plugins: 'invalid' } }), 502],
    [
      () => {
        throw new DOMException('timeout', 'TimeoutError');
      },
      504,
    ],
  ] as const) {
    result = makeResult;
    const response = await GET(request(), context());
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).success, false);
  }
});
