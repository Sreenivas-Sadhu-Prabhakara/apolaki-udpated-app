/**
 * E2E Test Suite - Consent Workflow.
 * Validates the PRD 11 requirements for feature gating and consent management.
 */

import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { createDriver } from '../helpers/driverFactory.js';
import config from '../helpers/config.js';

const FRONTEND = config.frontend.baseUrl;

describe('E2E > Consent Workflow', function () {
  let driver;
  this.timeout(60000);

  before(async function () {
    driver = await createDriver();
    // Use a fresh user or ensure consent is revoked for this test if possible
    await driver.get(`${FRONTEND}/login`);
    await driver.findElement(By.id('email')).sendKeys(config.users.homeowner.email);
    await driver.findElement(By.id('password')).sendKeys(config.users.homeowner.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/'), 10000);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('redirects to Consent Unlock page when accessing gated features', async function () {
    // Navigate directly to monitoring
    await driver.get(`${FRONTEND}/monitoring`);
    
    // Should be redirected to /consent?required=...
    await driver.wait(until.urlContains('/consent'), 5000);
    expect(await driver.getCurrentUrl()).to.include('required=installation_monitoring');
    
    const pageTitle = await driver.findElement(By.css('h1')).getText();
    expect(pageTitle).to.include('Set up your workspace');
  });

  it('enables feature access after granting specific consent', async function () {
    // Locate the Monitoring consent toggle (assume it exists on the page)
    // and click "Accept" or toggle it
    const monitoringToggle = await driver.findElement(By.xpath('//*[contains(text(), "Performance Monitoring")]/following-sibling::*//input'));
    if (!(await monitoringToggle.isSelected())) {
      await monitoringToggle.click();
    }
    
    const continueBtn = await driver.findElement(By.xpath('//button[contains(text(), "Continue")]'));
    await continueBtn.click();
    
    // Should now allow navigation back to monitoring or continue to dashboard
    await driver.wait(until.urlContains('/'), 10000);
    
    await driver.get(`${FRONTEND}/monitoring`);
    expect(await driver.getCurrentUrl()).to.include('/monitoring');
  });
});
