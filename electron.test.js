const { Application } = require('spectron');
const path = require('path');

let app;

beforeAll(() => {
  app = new Application({
    path: electron,
    args: [path.join(__dirname, '..')],
  });
  return app.start();
});

afterAll(() => {
  if (app && app.isRunning()) {
    return app.stop();
  }
});

test('shows an initial window', async () => {
  const count = await app.client.getWindowCount();
  expect(count).toBe(1);
});

// Add more tests as needed