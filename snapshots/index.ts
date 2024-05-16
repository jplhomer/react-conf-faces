import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request: Request, env: Env) {
    const id = env.BROWSER.idFromName("browser");
    const obj = env.BROWSER.get(id);

    // Send a request to the Durable Object, then await its response.
    const resp = await obj.fetch(request.url);

    return resp;
  },
};

const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;

export class Browser {
  keptAliveInSeconds: number;
  browser: any;
  storage: DurableObjectStorage;

  constructor(public state: DurableObjectState, public env: Env) {
    this.state = state;
    this.env = env;
    this.keptAliveInSeconds = 0;
    this.storage = this.state.storage;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const requestedUsername = url.searchParams.get("username");
    const version = url.searchParams.get("version") ?? "1";

    // Check if the requested URL is allowed
    if (!requestedUsername) {
      return new Response("No URL provided", { status: 400 });
    }

    const key = btoa(requestedUsername) + `-${version}`;
    const path = `snapshots/${key}.jpg`;

    const existingImage = await this.env.BUCKET.get(path);
    if (existingImage !== null) {
      return new Response(await existingImage.blob(), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "max-age=604800",
        },
      });
    }

    //  if there's a browser session open, re-use it
    if (!this.browser || !this.browser.isConnected()) {
      console.log(`Browser DO: Starting new instance`);
      try {
        this.browser = await puppeteer.launch(this.env.MYBROWSER);
      } catch (e) {
        console.log(
          `Browser DO: Could not start browser instance. Error: ${e}`
        );
      }
    }

    const snapshotUrl = `https://react-conf-faces.pages.dev?username=${requestedUsername}&screenshot`;

    // Reset keptAlive after each call to the DO
    this.keptAliveInSeconds = 0;

    const page = await this.browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(snapshotUrl);
    const fileName = "screenshot";
    const sc = await page.screenshot({ path: fileName + ".jpg" });

    await this.env.BUCKET.put(path, sc);

    // Close tab when there is no more work to be done on the page
    await page.close();

    // Reset keptAlive after performing tasks to the DO.
    this.keptAliveInSeconds = 0;

    // set the first alarm to keep DO alive
    let currentAlarm = await this.storage.getAlarm();
    if (currentAlarm == null) {
      console.log(`Browser DO: setting alarm`);
      const TEN_SECONDS = 10 * 1000;
      await this.storage.setAlarm(Date.now() + TEN_SECONDS);
    }

    return new Response(sc, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "max-age=604800",
      },
    });
  }

  async alarm() {
    this.keptAliveInSeconds += 10;

    // Extend browser DO life
    if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
      console.log(
        `Browser DO: has been kept alive for ${this.keptAliveInSeconds} seconds. Extending lifespan.`
      );
      await this.storage.setAlarm(Date.now() + 10 * 1000);
      // You could ensure the ws connection is kept alive by requesting something
      // or just let it close automatically when there  is no work to be done
      // for example, `await this.browser.version()`
    } else {
      console.log(
        `Browser DO: exceeded life of ${KEEP_BROWSER_ALIVE_IN_SECONDS}s.`
      );
      if (this.browser) {
        console.log(`Closing browser.`);
        await this.browser.close();
      }
    }
  }
}
