import { expect } from 'chai';
import path from 'path';
import { Builder, By, until } from 'selenium-webdriver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for Login
async function login(driver, baseUrl) {
    await driver.get(`${baseUrl}/login`);
    // Debug logging to show what is on screen
    await driver.sleep(2000);
    
    // Fill credentials
    const emailInput = await driver.findElement(By.id('email'));
    await emailInput.sendKeys('test@example.com');
    const pwdInput = await driver.findElement(By.id('password'));
    await pwdInput.sendKeys('password123');
    
    // Submit
    const emailBtn = await driver.findElement(By.xpath('//button[contains(translate(text(), "C", "c"), "continue with email")]'));
    await emailBtn.click();
    
    // Wait for redirect to dashboard or assessment
    await driver.wait(until.urlContains('/'), 10000);
}

describe('Marketplace E2E Tests', function () {
    let driver;
    let baseUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

    // Extend timeout for UI tests
    this.timeout(60000);

    // Run this block before all tests in this suite
    before(async function () {
        // Initialize WebDriver
        driver = await new Builder().forBrowser('chrome').build();
        
        // Authenticate
        try {
            await login(driver, baseUrl);
        } catch (e) {
            console.log('Login failed, possibly no mock user or skipping login requirement', e);
        }
    });

    // Run this block after all tests in this suite
    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    // Run this block before each test
    beforeEach(async function () {
        // Navigate to the marketplace page
        await driver.get(`${baseUrl}/marketplace`);
        
        await driver.wait(until.elementLocated(By.xpath('//body')), 10000);
        await driver.sleep(3000);
        
        // Print the page source so we can see why it's not finding the tabs
        const source = await driver.getPageSource();
        // console.log("PAGE SOURCE LENGTH", source.length);
        // console.log(source.substring(0, 1000));
    });

    it('should switch between Equipment and Installers tabs', async function () {
        // Find using a more general locator
        const allButtons = await driver.findElements(By.tagName('button'));
        let equipBtn = null;
        let instBtn = null;
        
        for (let btn of allButtons) {
            const txt = await btn.getText();
            if (txt.includes('Equipment')) equipBtn = btn;
            if (txt.includes('Vetted Installers')) instBtn = btn;
        }

        if (!equipBtn || !instBtn) {
            const source = await driver.getPageSource();
            console.log("PAGE TEXT:", await driver.findElement(By.tagName('body')).getText());
            throw new Error("Could not find tab buttons");
        }

        // Click on Installers Tab
        await instBtn.click();
        
        // Give time for UI update
        await driver.sleep(1000);

        // Verify we are now seeing installer filters (e.g. "Service Type:")
        const serviceTypeSpans = await driver.findElements(By.xpath('//span[contains(text(), "Service Type")]'));
        expect(serviceTypeSpans.length).to.be.greaterThan(0);

        // Click back to Equipment
        await equipBtn.click();
        
        // Give time for UI update
        await driver.sleep(1000);

        const categorySpans = await driver.findElements(By.xpath('//button[contains(text(), "All")]'));
        expect(categorySpans.length).to.be.greaterThan(0);
    });

    it('should open and close the quotation modal in Installers tab', async function () {
        // Go to installers tab
        const allButtons = await driver.findElements(By.tagName('button'));
        let instBtn = null;
        for (let btn of allButtons) {
            const txt = await btn.getText();
            if (txt.includes('Vetted Installers')) instBtn = btn;
        }
        await instBtn.click();
        await driver.sleep(1000);

        // Click "Request Quotation" on the first installer
        const requestQuoteBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Request Quotation")]')), 5000);
        await requestQuoteBtn.click();
        
        // Modal should appear
        const modalHeader = await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Request Quotation")]')), 5000);
        expect(await modalHeader.isDisplayed()).to.be.true;

        // Click Cancel button
        const cancelBtn = await driver.findElement(By.xpath('//button[contains(text(), "Cancel")]'));
        await cancelBtn.click();
        
        // Give UI time to remove modal
        await driver.sleep(1000);

        // Since it's a v-if, it should be removed from the DOM or hidden
        const modals = await driver.findElements(By.xpath('//*[contains(text(), "Send a handshake request")]'));
        expect(modals.length).to.equal(0);
    });
});
