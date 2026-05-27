/**
 * Selenium Page Object - email and social login page.
 */

import { By, until } from 'selenium-webdriver';
import config from '../helpers/config.js';

export default class LoginPage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.frontend.baseUrl}/login`;
    this.title = By.id('login-title');
    this.googleLink = By.id('google-login');
    this.facebookLink = By.id('facebook-login');
    this.oauthLinks = By.css('.oauth-buttons a');
    this.emailInput = By.id('email');
    this.passwordInput = By.id('password');
    this.submitButton = By.css('.email-submit');
  }

  async navigate() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.title), 10000);
  }

  async getOAuthLinks() {
    return this.driver.findElements(this.oauthLinks);
  }

  async hasPasswordInput() {
    return (await this.driver.findElements(this.passwordInput)).length > 0;
  }

  async login(email, password) {
    await this.navigate();
    await this.driver.findElement(this.emailInput).sendKeys(email);
    await this.driver.findElement(this.passwordInput).sendKeys(password);
    await this.driver.findElement(this.submitButton).click();
  }

  async isDisplayed() {
    return (await this.driver.findElements(this.title)).length > 0;
  }
}
