import type {Page} from '@playwright/test';
import {TUTORIAL_KEY} from '../../src/game/firstFlightTutorial';
// Legacy gameplay/visual tests intentionally exercise the scored catalogue,
// not Flight School. New tutorial tests use a fresh unseeded browser.
export async function bypassTutorial(page:Page){await page.addInitScript(key=>localStorage.setItem(key,'seen'),TUTORIAL_KEY);}
