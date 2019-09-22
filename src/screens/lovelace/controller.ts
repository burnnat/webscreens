import { Request, Response } from 'express';
import * as puppeteer from 'puppeteer';
import { LovelaceConfig } from './routes';

export default class LovelaceController {

    private url: string;
    private browser: any;

    public constructor(data: LovelaceConfig) {
        this.url = data.url;
    }

    private async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }

        return this.browser;
    }

    public async index(req: Request, res: Response): Promise<void> {
        // const dashboard = req.query.dashboard;
        const width = parseInt(req.query.width, 10);
        const height = parseInt(req.query.height, 10);

        const browser = await this.initBrowser();
        const page = await browser.newPage();

        await page.setViewport({
            width,
            height,
            deviceScaleFactor: 1
        });

        await page.goto(this.url);
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