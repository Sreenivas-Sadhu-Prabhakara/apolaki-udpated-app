/**
 * E2E Test Suite - Finance Flow & ROI Calculator.
 * Validates the PRD 2 requirements for high-fidelity financial simulation.
 */

import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { createDriver } from '../helpers/driverFactory.js';
import config from '../helpers/config.js';

const FRONTEND = config.frontend.baseUrl;

describe('E2E > Finance Flow', function () {
  let driver;
  this.timeout(60000);

  before(async function () {
    driver = await createDriver();
    // 1. Login
    await driver.get(`${FRONTEND}/login`);
    await driver.findElement(By.id('email')).sendKeys(config.users.homeowner.email);
    await driver.findElement(By.id('password')).sendKeys(config.users.homeowner.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/'), 10000);
    
    // 2. Handle Consent if needed (bypass for now or assume granted in seeds)
    await driver.get(`${FRONTEND}/finance`);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('displays the Solar Financial Advisor with interactive sliders', async function () {
    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Interactive Calculator")]')), 10000);
    expect(await driver.findElement(By.css('h1')).getText()).to.include('Solar Financing');
    
    // Check for sliders
    const sliders = await driver.findElements(By.css('input[type="range"]'));
    expect(sliders.length).to.be.at.least(2, 'Expected at least Monthly Bill and tenure sliders');
  });

  it('updates ROI projections when sliders are moved', async function () {
    const initialRoi = await driver.findElement(By.xpath('//*[contains(text(), "ROI")]/following-sibling::*')).getText();
    
    // Move the first slider (assume Monthly Bill)
    const billSlider = await driver.findElement(By.css('input[type="range"]'));
    await billSlider.sendKeys('ARROW_RIGHT'); // Increment slightly
    
    await driver.sleep(500); // Wait for debounce/calc
    
    const updatedRoi = await driver.findElement(By.xpath('//*[contains(text(), "ROI")]/following-sibling::*')).getText();
    expect(initialRoi).to.not.equal(updatedRoi);
  });

  it('switches to the Transaction Ledger tab', async function () {
    const ledgerTabBtn = await driver.findElement(By.xpath('//button[contains(text(), "Transaction Ledger")]'));
    await ledgerTabBtn.click();
    
    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Net Balance")]')), 5000);
    expect(await driver.findElement(By.xpath('//*[contains(text(), "Net Balance")]')).isDisplayed()).to.be.true;
  });
});
