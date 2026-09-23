import { readInitDataFromHash, readStartParamFromHash } from '../initData';

describe('telegram hash initData', () => {
  const realWindow = global.window;

  afterEach(() => {
    global.window = realWindow;
  });

  test('empty without hash', () => {
    global.window = { location: { hash: '' } };
    expect(readInitDataFromHash()).toBe('');
    expect(readStartParamFromHash()).toBe('');
  });

  test('parses tgWebAppData and start param', () => {
    const data = encodeURIComponent('user={"id":1}&hash=abc');
    global.window = {
      location: { hash: `#tgWebAppVersion=9.6&tgWebAppData=${data}&tgWebAppStartParam=hostess_today` },
    };
    expect(readInitDataFromHash()).toBe('user={"id":1}&hash=abc');
    expect(readStartParamFromHash()).toBe('hostess_today');
  });

  test('no window returns empty', () => {
    delete global.window;
    expect(readInitDataFromHash()).toBe('');
    expect(readStartParamFromHash()).toBe('');
  });
});
