import { Request, Response } from 'express';
import * as puppeteer from 'puppeteer';
import { LovelaceConfig } from './routes';

export default class LovelaceController {

    private url: string;
    private timezone: string;
    private browser: Promise<any>;

    public constructor(data: LovelaceConfig) {
        this.url = data.url + (data.url.endsWith('/') ? '' : '/');
        this.timezone = data.timezone;
        this.init();
    }

    private async init() {
        this.browser = puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
        const width = parseInt(req.query.width, 10);
        const height = parseInt(req.query.height, 10);
        const zoom = req.query.zoom != null ? parseFloat(req.query.zoom) : 1;

        const browser = await this.browser;
        const page = await browser.newPage();

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
                        .querySelector("home-assistant").shadowRoot
                        .querySelector("ha-store-auth-card")
                )
            );

            const saveButton: any = await page.evaluateHandle(
                `
                Array.from(
                    document
                        .querySelector("home-assistant").shadowRoot
                        .querySelector("ha-store-auth-card").shadowRoot
                        .querySelectorAll("mwc-button")
                ).find((el) => el.textContent.includes('Save login'))
                ` as any);
            await saveButton.click();

            await page.waitFor(
                () => (
                    !document
                        .querySelector("home-assistant").shadowRoot
                        .querySelector("ha-store-auth-card")
                )
            );
        }

        await page.waitFor(1000);

        const buffer = await page.screenshot({
            type: 'png'
        });
    
        res.contentType('image/png');
        res.send(buffer);
    }
}