import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('the documented complete plugin passes every documented fixture', async () => {
  const markdown = await readFile(
    new URL('../../content/docs/zh/plugins/development.mdx', import.meta.url),
    'utf8'
  );
  const source = markdown.match(
    /```js title="plugin\.js"\n([\s\S]*?)\n```/
  )?.[1];
  const fixture = markdown.match(
    /```json title="golden\.json"\n([\s\S]*?)\n```/
  )?.[1];
  assert.ok(
    source && fixture,
    'the complete plugin and its golden fixture must remain copyable'
  );
  const plugin = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  );
  for (const item of JSON.parse(fixture).cases) {
    if (item.expectedError)
      assert.throws(
        () => plugin[item.hook](...item.args),
        { message: item.expectedError },
        item.name
      );
    else
      assert.deepEqual(
        plugin[item.hook](...item.args),
        item.expected,
        item.name
      );
  }
  assert.deepEqual(
    plugin.parseTaskResult({}, { status: 'toString' }, { status: 200 }),
    { status: 'UNKNOWN' }
  );
  assert.deepEqual(
    plugin.buildQueryRequest({
      taskId: 'vendor/a',
      publicTaskId: 'public-b',
      baseUrl: 'https://api.example.com/',
      authHeader: 'Bearer example',
    }),
    {
      url: 'https://api.example.com/jobs/vendor%2Fa',
      method: 'GET',
      headers: { Authorization: 'Bearer example' },
    }
  );
});
