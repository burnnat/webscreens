import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { LovelaceConfig } from './routes.js';

export default class LovelaceController {

    private url: string;
    private timezone: string;
    private delay: number;
    private browser: Promise<any> | null;

    public constructor(data: LovelaceConfig) {
        this.url = data.url + (data.url.endsWith('/') ? '' : '/');
        this.timezone = data.timezone;
        this.delay = data.screenshotDelay != null ? data.screenshotDelay : 1200;
        this.browser = null;
        this.init();
    }

    private async init() {
        this.browser = puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: 'new',
            env: {
                TZ: this.timezone,
                ...process.env
            }
        });

        const browser = await this.browser;

        console.log(`Started Puppeteer with pid ${browser.process().pid}`);
        browser.on('disconnected', () => this.init());
    }

    public async index(req: Request, res: Response): Promise<void> {
        const dashboard = this.url + req.query.dashboard;
        const width = parseInt(req.query.width as string, 10);
        const height = parseInt(req.query.height as string, 10);
        const zoom = req.query.zoom != null ? parseFloat(req.query.zoom as string) : 1;

        const browser = await this.browser;
        const page = await browser.newPage();
        page.setDefaultTimeout(5000);

        try {
            await page.goto(dashboard);

            await page.setViewport({
                width:  Math.floor(width / zoom),
                height: Math.floor(height / zoom),
                deviceScaleFactor: zoom
            });

            await page.waitForSelector('ha-authorize, home-assistant');

            const root = await page.$eval('ha-authorize, home-assistant', (el) => el.tagName.toLowerCase());

            // Check for login dialog and trigger login flow if present.
            if (root === 'ha-authorize') {
                const localButton: any = await page.evaluateHandle(
                    `
                    Array.from(
                        document
                            .querySelector("ha-authorize").shadowRoot
                            .querySelector("ha-pick-auth-provider").shadowRoot
                            .querySelectorAll("paper-item")
                    ).find((el) => el.textContent.includes('Trusted Networks'))
                    ` as any);
                await localButton.click();

                await page.waitForSelector('home-assistant')
                await page.waitFor(
                    () => (
                        document
                            .querySelector("home-assistant")
                            ?.shadowRoot
                            ?.querySelector("ha-store-auth-card")
                    )
                );

                const saveButton: any = await page.evaluateHandle(
                    `
                    Array.from(
                        document
                            .querySelector("home-assistant").shadowRoot
                            .querySelector("ha-store-auth-card").shadowRoot
                            .querySelectorAll("mwc-button")
                    ).find((el) => el.textContent.includes('Yes'))
                    ` as any);
                await saveButton.click();

                await page.waitFor(
                    () => (
                        !document
                            .querySelector("home-assistant")
                            ?.shadowRoot
                            ?.querySelector("ha-store-auth-card")
                    )
                );
            }

            await page.waitFor(this.delay);
        }
        finally {
            const buffer = await page.screenshot({
                type: 'png'
            });

            res.contentType('image/png');
            res.send(buffer);

            await page.close();
        }
    }
}