/**
 * Selenium E2E Test - supported login entry point.
 * @tags e2e, auth, smoke
 */

import { expect } from 'chai';
import { By } from 'selenium-webdriver';
import { createDriver } from '../helpers/driverFactory.js';
import LoginPage from '../pages/LoginPage.js';

describe('E2E > Login', function () {
  let driver;
  let loginPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('@smoke displays email, Google, and Facebook sign-in options', async function () {
    await loginPage.navigate();
    expect(await loginPage.isDisplayed()).to.be.true;

    const links = await loginPage.getOAuthLinks();
    expect(links).to.have.length(2);
    expect(await driver.findElement(loginPage.googleLink).isDisplayed()).to.be.true;
    expect(await driver.findElement(loginPage.facebookLink).isDisplayed()).to.be.true;
    expect(await loginPage.hasPasswordInput()).to.be.true;
  });

  it('@smoke does not display unsupported provider or OTP login paths', async function () {
    await loginPage.navigate();

    const bodyText = await driver.findElement(By.css('body')).getText();
    expect(bodyText).to.not.include('Instagram');
    expect(bodyText).to.not.include('WhatsApp');
    expect(bodyText).to.not.include('Telegram');
    expect(bodyText).to.not.include('Viber');
    expect(bodyText).to.not.include('Forgot your password');
  });

  it('routes signup navigation back to the supported login page', async function () {
    await driver.get(`${loginPage.url.replace('/login', '')}/signup`);
    await driver.wait(untilUrlIncludes('/login'), 10000);
    expect(await driver.getCurrentUrl()).to.include('/login');
  });
});

function untilUrlIncludes(fragment) {
  return async driver => (await driver.getCurrentUrl()).includes(fragment);
}
