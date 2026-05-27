/**
 * Selenium E2E Test - first-time access begins from supported sign-in.
 * @tags e2e, auth
 */

import { expect } from 'chai';
import { By } from 'selenium-webdriver';
import config from '../helpers/config.js';
import { createDriver } from '../helpers/driverFactory.js';

describe('E2E > Signup Redirect', function () {
  let driver;

  before(async function () {
    driver = await createDriver();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('redirects /signup to the email, Google, and Facebook sign-in page', async function () {
    await driver.get(`${config.frontend.baseUrl}/signup`);
    await driver.wait(async () => (await driver.getCurrentUrl()).includes('/login'), 10000);

    expect(await driver.findElements(By.id('google-login'))).to.have.length(1);
    expect(await driver.findElements(By.id('facebook-login'))).to.have.length(1);
    expect(await driver.findElements(By.id('password'))).to.have.length(1);
  });
});
