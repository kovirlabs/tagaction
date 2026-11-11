import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

test.describe('dialog', () => {
  test('a button with commandfor opens the dialog, and a backdrop click closes it', async ({ page }) => {
    await open(page, 'dialog.html');
    await page.getByRole('button', { name: 'Delete file' }).click();
    const dialog = page.locator('#confirm');
    await expect(dialog).toBeVisible();
    // A click inside the dialog keeps it open.
    await page.getByLabel('Type the file name').click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
  });

  test('keyboard: Enter opens, Escape closes, focus returns to the button', async ({ page }) => {
    await open(page, 'dialog.html');
    const opener = page.getByRole('button', { name: 'Delete file' });
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#confirm')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#confirm')).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('closedby and data-tagaction="off" keep the backdrop from closing it', async ({ page }) => {
    await open(page, 'dialog.html');
    await page.getByRole('button', { name: 'Open sticky dialog' }).click();
    await page.mouse.click(5, 5);
    await expect(page.locator('#sticky')).toBeVisible();
    await page.locator('#sticky').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#sticky')).toBeHidden();

    await page.getByRole('button', { name: 'Open opted-out dialog' }).click();
    await page.mouse.click(5, 5);
    await expect(page.locator('#off-dialog')).toBeVisible();
  });

  test('selecting text that ends on the backdrop does not close it', async ({ page }) => {
    await open(page, 'dialog.html');
    await page.getByRole('button', { name: 'Delete file' }).click();
    const box = await page.getByLabel('Type the file name').boundingBox();
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(5, 5);
    await page.mouse.up();
    await expect(page.locator('#confirm')).toBeVisible();
  });
});

test.describe('table', () => {
  const column = (page, table, index) => page.locator(`#${table} tbody tr td:nth-child(${index})`).allTextContents();

  test('clicking a header sorts ascending, then descending, with aria-sort', async ({ page }) => {
    await open(page, 'table.html');
    const header = page.locator('#orders th').nth(1);
    await page.getByRole('button', { name: 'Total' }).click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(await column(page, 'orders', 2)).toEqual(['$18', '$95', '$310.50', '$1.2k']);
    await page.getByRole('button', { name: 'Total' }).click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(await column(page, 'orders', 2)).toEqual(['$1.2k', '$310.50', '$95', '$18']);

    await page.getByRole('button', { name: 'Customer' }).click();
    await expect(header).not.toHaveAttribute('aria-sort', /.*/);
    expect(await column(page, 'orders', 1)).toEqual(['alex Chen', 'Bo Ito', 'Maya Lin', 'Zoë Park']);

    await page.getByRole('button', { name: 'Date' }).click();
    expect(await column(page, 'orders', 3)).toEqual(['Dec 31', 'Mar 2', 'Jul 4', 'Nov 20']);
  });

  test('numbers with thousands separators sort as numbers', async ({ page }) => {
    await open(page, 'table.html');
    await page.locator('#numbers').getByRole('button', { name: 'Count' }).click();
    expect(await column(page, 'numbers', 2)).toEqual(['15', '900', '1,200']);
  });

  test('number columns line up on the right, header included; an author\'s align or text-align wins', async ({ page }) => {
    await open(page, 'table.html');
    const align = (selector) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).textAlign);
    const nums = (table) => page.locator(`#${table} thead th`).evaluateAll((els) => els.map((el) => el.dataset.tag === 'num'));
    expect(await nums('orders')).toEqual([false, true, false, false]); // <data value>; dates and names are not numbers
    expect(await nums('aligned')).toEqual([false, false, true, true, false, true, true]); // "−$5.00", "-$12.50", "($3.00)" are amounts // "#1042" is an id // an empty cell doesn't count against a column
    expect(await align('#aligned thead th:nth-child(3)')).toBe('end');
    expect(await align('#aligned tbody td:nth-child(3)')).toBe('end');
    expect(await page.locator('#aligned tbody td:nth-child(3)').first().evaluate((el) => getComputedStyle(el).fontVariantNumeric)).toBe('tabular-nums');
    expect(await align('#aligned tbody td:nth-child(1)')).toBe('start'); // false match: names stay on the left
    expect(await align('#aligned tbody td:nth-child(2)')).toBe('start'); // and ids
    expect(await align('#aligned tbody td:nth-child(5)')).toBe('start'); // "Q1" is a label, not a number
    expect(await align('#aligned tbody td:nth-child(4)')).toMatch(/center/); // align="center" wins
    expect(await align('#aligned tbody td:nth-child(6)')).toMatch(/center/); // style wins
    // Sorting keeps the marks on the moved cells.
    await page.locator('#aligned').getByRole('button', { name: 'Clients' }).click();
    await expect(page.locator('#aligned tbody td:nth-child(3)[data-tag="num"]')).toHaveCount(2);
  });

  test('rows added later line up in number columns, and a late non-number does not un-mark a column', async ({ page }) => {
    await open(page, 'table.html');
    await expect(page.locator('#numbers th[data-tag="num"]')).toHaveText('Count');
    await page.evaluate(() => document.querySelector('#numbers tbody').insertAdjacentHTML('beforeend', '<tr><td>d</td><td>7</td></tr><tr><td>e</td><td>—</td></tr>'));
    await expect(page.locator('#numbers tbody td:nth-child(2)[data-tag="num"]')).toHaveCount(5);
    await expect(page.locator('#numbers th[data-tag="num"]')).toHaveText('Count');
    await expect(page.locator('#numbers tbody td:nth-child(1)[data-tag="num"]')).toHaveCount(0);
    // A table that starts with no rows (rows come from --clone or htmx) is checked when they arrive.
    await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('beforeend',
      '<table id="empty"><thead><tr><th>Item</th><th>Price</th></tr></thead><tbody></tbody></table>'));
    await page.evaluate(() => document.querySelector('#empty tbody').insertAdjacentHTML('beforeend', '<tr><td>Tea</td><td>$4</td></tr>'));
    await expect(page.locator('#empty th[data-tag="num"]')).toHaveText('Price');
  });

  test('a table added later gets its number columns marked', async ({ page }) => {
    await open(page, 'table.html');
    await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('beforeend',
      '<table id="late"><thead><tr><th>Name</th><th>Total</th></tr></thead><tbody><tr><td>A</td><td>$5</td></tr><tr><td>B</td><td>$12</td></tr></tbody></table>'));
    await expect(page.locator('#late th[data-tag="num"]')).toHaveText('Total');
    await expect(page.locator('#late td[data-tag="num"]')).toHaveCount(2);
  });

  test('keyboard: header buttons sort with Enter and Space', async ({ page }) => {
    await open(page, 'table.html');
    await page.locator('#numbers').getByRole('button', { name: 'Item' }).focus();
    await page.keyboard.press('Enter');
    expect(await column(page, 'numbers', 1)).toEqual(['a', 'b', 'c']);
    await page.keyboard.press('Space');
    expect(await column(page, 'numbers', 1)).toEqual(['c', 'b', 'a']);
  });

  test('opted-out columns, one-row tables, and empty headers get no sort button', async ({ page }) => {
    await open(page, 'table.html');
    await expect(page.locator('#orders th[data-tagaction="off"] button')).toHaveCount(0);
    await expect(page.locator('#one-row button')).toHaveCount(0);
  });

  test('a filter that matches nothing says so, and otherwise tells screen readers the count', async ({ page }) => {
    await open(page, 'table.html');
    const status = page.locator('#orders + [role="status"]');
    await expect(status).toHaveText('');
    const filter = page.getByLabel('Filter orders');
    await filter.pressSequentially('zzz');
    await expect(status).toHaveText('No matches for “zzz”');
    await expect(status).toBeVisible();
    expect((await status.boundingBox()).width).toBeGreaterThan(50);
    await filter.fill('maya');
    // The count waits for a pause in typing (about 400 ms), so it isn't announced per keystroke.
    expect(await status.textContent()).not.toBe('1 of 4 shown');
    await expect(status).toHaveText('1 of 4 shown');
    expect((await status.boundingBox()).width).toBeLessThanOrEqual(1); // for screen readers only
    await filter.fill('');
    await expect(status).toHaveText('');
    // A list filtered by a box added later gets its own line.
    await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('beforeend',
      '<input type="search" aria-label="Filter colors" aria-controls="colors"><ul id="colors"><li>Red</li><li>Blue</li></ul>'));
    await page.getByLabel('Filter colors').fill('green');
    await expect(page.locator('#colors + [role="status"]')).toHaveText('No matches for “green”');
  });

  test('a search input with aria-controls filters rows and list items', async ({ page }) => {
    await open(page, 'table.html');
    await page.getByLabel('Filter orders').fill('maya');
    await expect(page.locator('#orders tbody tr:visible')).toHaveCount(1);
    await page.getByLabel('Filter orders').fill('');
    await expect(page.locator('#orders tbody tr:visible')).toHaveCount(4);

    const fruitFilter = page.getByLabel('Filter fruit');
    await expect(fruitFilter).toBeVisible(); // was hidden in the HTML; TagAction shows it
    await fruitFilter.fill('bread banana');
    await expect(page.locator('#fruit li:visible')).toHaveText(['Banana bread']);
  });
});

test.describe('form', () => {
  test('validation messages appear under fields, focus moves to the first, and clear when fixed', async ({ page }) => {
    await open(page, 'form.html');
    await page.getByRole('button', { name: 'Create account' }).click();
    const email = page.getByLabel('Email');
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const message = page.locator('#email + small');
    await expect(message).not.toHaveText('We never share it.');
    await expect(message).not.toBeEmpty();
    const describedBy = await email.getAttribute('aria-describedby');
    expect(await message.getAttribute('id')).toBe(describedBy);

    await expect(page.locator('#name + small[data-tag="error"]')).not.toBeEmpty();
    await expect(page.locator('label:has([name="terms"]) + small[data-tag="error"]')).not.toBeEmpty();
    await expect(page.locator('fieldset > small[data-tag="error"]')).toHaveCount(1);

    await email.fill('maya@example.com');
    await expect(email).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(message).toHaveText('We never share it.');

    await page.getByLabel('Pro').check();
    await expect(page.locator('fieldset > small[data-tag="error"]')).toBeEmpty();
  });

  test('the password message goes under the password row, not inside it', async ({ page }) => {
    await open(page, 'form.html');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.locator('[data-tag="password"] small')).toHaveCount(0);
    await expect(page.locator('[data-tag="password"] + small')).not.toHaveText('At least 8 characters.');
  });

  test('help text after a password field stays under the Show/Hide row, as on the sign-up page', async ({ page }) => {
    await open(page, 'form.html');
    const row = await page.locator('[data-tag="password"]').boundingBox();
    const help = page.locator('[data-tag="password"] + small');
    await expect(help).toHaveText('At least 8 characters.');
    const box = await help.boundingBox();
    expect(await help.evaluate((el) => getComputedStyle(el).display)).toBe('block');
    expect(box.y).toBeGreaterThanOrEqual(row.y + row.height);
    expect(Math.round(box.x)).toBe(Math.round(row.x));
    // The next label starts on its own line below the help text.
    const next = await page.locator('label:has([name="terms"])').boundingBox();
    expect(next.y).toBeGreaterThanOrEqual(box.y + box.height);
  });

  test('the submit button is disabled and busy while the form is sent', async ({ page }) => {
    await open(page, 'form.html');
    await page.route('https://example.test/**', (route) => setTimeout(() => route.fulfill({ body: '<p>Done</p>', contentType: 'text/html' }).catch(() => {}), 500));
    await page.getByLabel('Email').fill('maya@example.com');
    await page.getByLabel('Name').fill('Maya');
    await page.getByLabel('Password', { exact: true }).fill('long enough');
    await page.getByLabel('I accept the terms').check();
    await page.getByLabel('Free').check();
    // Playwright waits for navigations before reading the page, so the page
    // reports the button's state itself while the request is in flight.
    const states = [];
    await page.exposeFunction('report', (state) => states.push(state));
    await page.evaluate(() => {
      const button = document.querySelector('#signup button:not([type])');
      new MutationObserver(() => window.report({ disabled: button.disabled, busy: button.getAttribute('aria-busy') }))
        .observe(button, { attributes: true, attributeFilter: ['disabled', 'aria-busy'] });
    });
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Done')).toBeVisible();
    expect(states).toContainEqual({ disabled: true, busy: 'true' });
  });

  test('a post form with unsent changes asks before leaving; a get form does not', async ({ page }) => {
    await open(page, 'form.html');
    await page.getByLabel('Name').fill('Maya');
    const dialog = page.waitForEvent('dialog');
    page.goto('about:blank').catch(() => {});
    const prompt = await dialog;
    expect(prompt.type()).toBe('beforeunload');
    await prompt.dismiss();

    await page.reload(); // the reload asks too; Playwright dismisses unhandled beforeunload by accepting
    await open(page, 'form.html');
    await page.getByLabel('Search').fill('anything');
    let asked = false;
    page.on('dialog', (d) => { asked = true; d.accept(); });
    await page.goto('about:blank');
    expect(asked).toBe(false);
  });
});

test.describe('textarea, file, password', () => {
  test('a textarea with maxlength shows a counter after its help text', async ({ page }) => {
    await open(page, 'form.html');
    const counter = page.locator('#bio + small[data-tag="count"]');
    await expect(counter).toHaveText('0 / 40');
    await page.getByLabel('Bio').fill('Hello there');
    await expect(counter).toHaveText('11 / 40');
    await expect(counter).not.toHaveAttribute('data-tag-low');
    await page.getByLabel('Bio').fill('x'.repeat(35));
    await expect(counter).toHaveAttribute('data-tag-low', '');
    // With help text, the help stays right after the field and the counter follows it
    await expect(page.locator('#note + small')).toHaveText('Optional.');
    await expect(page.locator('#note + small + small[data-tag="count"]')).toHaveText('0 / 100');
  });

  test('Ctrl+Enter or ⌘+Enter in a textarea sends its form, with validation', async ({ page }) => {
    await open(page, 'form.html');
    await page.getByLabel('Bio').fill('Hello');
    await page.getByLabel('Bio').press('Control+Enter');
    // requestSubmit runs validation: the empty required email is reported and focused.
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Email')).toBeFocused();
    await expect(page.getByLabel('Bio')).toHaveValue('Hello'); // no newline added

    // A form added later sends with ⌘+Enter; plain Enter still types a newline.
    await page.route('https://example.test/**', (route) => route.fulfill({ body: '<p>Sent</p>', contentType: 'text/html' }));
    await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('beforeend',
      '<form id="reply" action="https://example.test/reply"><label for="reply-text">Reply</label><textarea id="reply-text" name="text"></textarea><button>Send</button></form>'));
    const reply = page.getByLabel('Reply');
    await reply.fill('Thanks');
    await reply.press('Enter');
    await expect(reply).toHaveValue('Thanks\n');
    // Not while an input method is composing.
    const composing = await reply.evaluate((el) => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, isComposing: true, cancelable: true, bubbles: true });
      el.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(composing).toBe(false);
    await reply.press('Meta+Enter');
    await expect(page.getByText('Sent')).toBeVisible();
  });

  test('a textarea without rows grows as you type', async ({ page }) => {
    await open(page, 'widgets.html');
    const notes = page.getByLabel('Notes');
    const before = (await notes.boundingBox()).height;
    await notes.fill('line\n'.repeat(12));
    await expect.poll(async () => (await notes.boundingBox()).height).toBeGreaterThan(before + 50);
  });

  test('a multiple file input lists the chosen names, and accepts dropped files', async ({ page }) => {
    await open(page, 'form.html');
    await page.getByLabel('Documents').setInputFiles([
      { name: 'one.txt', mimeType: 'text/plain', buffer: Buffer.from('1') },
      { name: 'two.txt', mimeType: 'text/plain', buffer: Buffer.from('2') },
    ]);
    await expect(page.locator('#docs + small[data-tag="files"]')).toHaveText('one.txt, two.txt');

    const dataTransfer = await page.evaluateHandle(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['3'], 'dropped.pdf', { type: 'application/pdf' }));
      return transfer;
    });
    const label = page.locator('label[for="docs"]');
    await label.dispatchEvent('dragover', { dataTransfer });
    await expect(label).toHaveAttribute('data-tag-drop', '');
    await label.dispatchEvent('drop', { dataTransfer });
    await expect(label).not.toHaveAttribute('data-tag-drop');
    await expect(page.locator('#docs + small[data-tag="files"]')).toHaveText('dropped.pdf');
  });

  test('an image file input shows a thumbnail of the chosen picture, and frees it when the choice changes', async ({ page }) => {
    await open(page, 'form.html');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.evaluate(() => { window.revoked = []; const revoke = URL.revokeObjectURL; URL.revokeObjectURL = (url) => { window.revoked.push(url); revoke(url); }; });
    await page.getByLabel('Avatar').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
    const list = page.locator('#avatar + small[data-tag="files"]');
    await expect(list).toHaveText('me.png');
    const thumb = list.locator('img[data-tag="thumb"]');
    await expect(thumb).toHaveAttribute('alt', '');
    const first = await thumb.getAttribute('src');
    expect(first).toMatch(/^blob:/);
    expect(await thumb.evaluate((img) => img.complete && img.naturalWidth)).toBe(1);
    await page.getByLabel('Avatar').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await expect(list).toHaveText('notes.txt');
    await expect(list.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.revoked)).toContain(first);
    // False match: a single file input that doesn't accept images gets no list.
    await page.evaluate(() => document.querySelector('form').insertAdjacentHTML('beforeend', '<input type="file" id="cv" aria-label="CV" accept=".pdf">'));
    await page.locator('#cv').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') });
    await expect(page.locator('#cv + small')).toHaveCount(0);
  });

  test('a password field gets a labeled Show/Hide toggle', async ({ page }) => {
    await open(page, 'form.html');
    const field = page.getByLabel('Password', { exact: true });
    const toggle = page.getByRole('button', { name: 'Show password' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(field).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveText('Hide');
    await toggle.press('Enter');
    await expect(field).toHaveAttribute('type', 'password');
  });
});

test.describe('code, time, abbr, output, template, details, img', () => {
  test('pre gets a Copy button that copies the code', async ({ page, browserName, context }) => {
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, 'widgets.html');
    const button = page.locator('[data-tag="copy"]');
    await expect(button).toHaveAccessibleName('Copy');
    await button.click();
    await expect(button).toHaveText(/Copied|Ctrl\+C/);
    if (browserName === 'chromium') expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npm install tagaction');
    await expect(page.locator('pre')).toHaveText('npm install tagaction'); // the button sits outside the <pre>
  });

  test('time with a zone is localized; relative time; a plain date is left alone', async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: 'America/New_York', locale: 'en-US' });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-11-06T17:00Z'));
    await open(page, 'widgets.html');
    await expect(page.locator('#zoned')).toHaveText(/Nov 6, 2026.*12:00\sPM/);
    await expect(page.locator('#relative')).toHaveText('3 hours ago');
    await expect(page.locator('#relative')).toHaveAttribute('title', /Nov 6, 2026/);
    await expect(page.locator('#date-only')).toHaveText('December 1');
    await context.close();
  });

  test('abbr shows its title on tap and on Enter', async ({ page }) => {
    await open(page, 'widgets.html');
    const abbr = page.locator('abbr');
    await abbr.click();
    await expect(page.locator('abbr + small[data-tag="abbr"]')).toHaveText('(HyperText Markup Language)');
    await abbr.click();
    await expect(page.locator('[data-tag="abbr"]')).toHaveCount(0);
    await abbr.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-tag="abbr"]')).toHaveCount(1);
  });

  test('output mirrors one field and sums several', async ({ page }) => {
    await open(page, 'widgets.html');
    await page.getByLabel('Volume').fill('7');
    await expect(page.locator('#volume-out')).toHaveText('7');
    await expect(page.locator('#total')).toHaveText('17.5');
    await page.getByLabel('Breakfast').check();
    await expect(page.locator('#total')).toHaveText('37.5');
    await page.getByLabel('Nights').fill('3');
    await expect(page.locator('#total')).toHaveText('38.5');
  });

  test('output multiplies with data-tag-calc="product" and formats with data-tag-format', async ({ page }) => {
    await open(page, 'widgets.html');
    const stay = page.locator('#stay');
    await expect(stay).toHaveText('$180.00');
    await page.getByLabel('Deluxe').check(); // unchecked radios are left out of the product
    await expect(stay).toHaveText('$280.00');
    await page.getByLabel('Nights').fill('3');
    await expect(stay).toHaveText('$420.00');
    await page.getByLabel('Standard').focus();
    await page.keyboard.press('Space');
    await expect(stay).toHaveText('$270.00');
    await page.getByLabel('Tip').fill('0.2');
    await expect(page.locator('#tip-out')).toHaveText('20%');
    // Added later (htmx, any script): formatted right away
    await page.evaluate(() => document.querySelector('form').insertAdjacentHTML('beforeend', '<output id="late" for="fee" data-tag-format="number"></output>'));
    await expect(page.locator('#late')).toHaveText('15.5');
  });

  test('a --clone button adds template copies with unique ids and focuses them', async ({ page }) => {
    await open(page, 'widgets.html');
    const add = page.getByRole('button', { name: 'Add guest' });
    await expect(add).toBeVisible();
    await add.click();
    await add.click();
    await expect(page.locator('#guests > li')).toHaveCount(3);
    await expect(page.locator('#guest-3')).toBeFocused();
    await expect(page.locator('label[for="guest-2"]')).toHaveCount(1);
    const ids = await page.locator('#guests [id]').evaluateAll((elements) => elements.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('a --remove button takes its row out, and focus moves to the previous row or the Add button', async ({ page }) => {
    await open(page, 'widgets.html');
    const items = page.locator('#items > li');
    const removes = page.locator('#items').getByRole('button', { name: 'Remove' });
    await expect(removes).toHaveCount(1);
    await expect(removes.first()).toBeVisible(); // written hidden; shown by TagAction
    await page.click('#add-item');
    await page.click('#add-item');
    await expect(items).toHaveCount(3);
    await expect(removes).toHaveCount(3);
    await expect(removes.nth(2)).toBeVisible(); // copies added later are shown too
    await expect(page.locator('#item-3 [commandfor="item-3"]')).toHaveCount(1);
    // Mouse: remove the middle row; focus goes to the row before it.
    await page.locator('#item-2').getByRole('button', { name: 'Remove' }).click();
    await expect(items).toHaveCount(2);
    await expect(page.locator('#item-2')).toHaveCount(0);
    await expect(page.locator('#item-name')).toBeFocused();
    // Keyboard: remove the first row; with no row before it, focus goes to Add.
    await page.locator('#item').getByRole('button', { name: 'Remove' }).focus();
    await page.keyboard.press('Enter');
    await expect(items).toHaveCount(1);
    await expect(page.locator('#add-item')).toBeFocused();
    // An opted-out target stays.
    await page.locator('#item-3').evaluate((el) => { el.dataset.tagaction = 'off'; });
    await page.locator('#item-3').getByRole('button', { name: 'Remove' }).click();
    await expect(items).toHaveCount(1);
  });

  test('data-tag-remember keeps details open across visits; name groups open one at a time', async ({ page }) => {
    await open(page, 'widgets.html');
    await page.getByText('Setup').click();
    await expect(page.locator('#setup')).toHaveAttribute('open', '');
    await expect.poll(() => page.evaluate(() => Object.keys(localStorage).length)).toBe(1);
    await page.reload();
    await expect(page.locator('#setup')).toHaveAttribute('open', '');

    await page.getByText('One', { exact: true }).click();
    await page.getByText('Two', { exact: true }).click();
    await expect(page.locator('#q1')).not.toHaveAttribute('open');
    await expect(page.locator('#q2')).toHaveAttribute('open', '');
  });

  test('a link to an image opens it in a viewer; so does a shrunk figure image', async ({ page }) => {
    await open(page, 'widgets.html');
    await page.getByRole('link', { name: 'A big orange square' }).click();
    const viewer = page.locator('dialog[data-tag="viewer"]');
    await expect(viewer).toBeVisible();
    await expect(viewer.locator('figcaption')).toHaveText('Linked photo');
    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);

    const shrunk = page.locator('#shrunk');
    await expect(shrunk).toHaveAttribute('tabindex', '0');
    await shrunk.focus();
    await page.keyboard.press('Enter');
    await expect(viewer).toBeVisible();
    await viewer.locator('img').click();
    await expect(viewer).toHaveCount(0);

    await expect(page.locator('#small')).not.toHaveAttribute('tabindex');
  });
});

test.describe('nav and headings', () => {
  test('the current page link gets aria-current="page"; existing marks are kept', async ({ page }) => {
    await open(page, 'nav.html');
    await expect(page.locator('header nav a[aria-current="page"]')).toHaveText('Guide');
    await expect(page.locator('header a[href^="https"]')).not.toHaveAttribute('aria-current');
    await expect(page.locator('footer a[aria-current]')).toHaveText('Top');
  });

  test('data-tag-toc builds a nested table of contents with unique ids', async ({ page }) => {
    await open(page, 'nav.html');
    const toc = page.locator('nav[data-tag-toc]');
    await expect(toc).toBeVisible(); // hidden in the HTML, shown once it has links
    await expect(toc).toHaveAttribute('aria-label', 'On this page');
    await expect(toc.locator(':scope > ul > li > a')).toHaveText(['Install', 'Use it', 'Install']);
    await expect(toc.locator('ul ul a')).toHaveText(['From npm']);
    expect(await toc.locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href')))).toEqual(['#install', '#from-npm', '#use', '#install-2']);
  });

  test('a hidden element around a table of contents added later is shown with it', async ({ page }) => {
    await open(page, 'nav.html');
    await page.evaluate(() => document.querySelector('article').insertAdjacentHTML('afterbegin', '<div id="box" hidden><nav data-tag-toc aria-label="Contents"></nav></div>'));
    await expect(page.locator('#box')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Contents' }).getByRole('link', { name: 'From npm' })).toBeVisible();
  });

  test('h2 and h3 with ids get anchor links', async ({ page }) => {
    await open(page, 'nav.html');
    const anchor = page.locator('#use > a[data-tag="anchor"]');
    await expect(anchor).toHaveAttribute('href', '#use');
    await expect(anchor).toHaveAttribute('aria-label', 'Link to section: Use it');
    await expect(page.locator('h1 a')).toHaveCount(0);
  });

  test('the table of contents follows the scroll', async ({ page }) => {
    await open(page, 'nav.html', { height: 600 });
    const current = page.locator('nav[data-tag-toc] a[aria-current="true"]');
    await expect(current).toHaveText('Install');
    await page.locator('#use').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('use').scrollIntoView());
    await expect(current).toHaveText('Use it');
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(current).toHaveAttribute('href', '#install-2');
  });
});

test.describe('menus', () => {
  test('a button with aria-expanded and aria-controls toggles its list', async ({ page }) => {
    await open(page, 'menu.html');
    const button = page.getByRole('button', { name: 'Account' });
    const list = page.locator('#account');
    await expect(list).toBeHidden();
    await expect(list).toHaveAttribute('data-tag', 'dropdown'); // a top-bar list drops down below its button
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(list).toBeVisible();
    await page.getByRole('heading', { name: 'Menus' }).click(); // outside
    await expect(list).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('a dropdown list stays on screen: under its button, flipping up near the bottom edge', async ({ page, browserName }) => {
    await open(page, 'menu.html', { width: 700, height: 330 });
    test.skip(!(await page.evaluate(() => CSS.supports('position-area: block-end'))), `${browserName}: no anchor positioning; the list keeps its place under the button`);
    const box = (sel) => page.locator(sel).boundingBox();
    await page.getByRole('button', { name: 'Account' }).click();
    let [button, list] = [await box('[aria-controls="account"]'), await box('#account')];
    expect(list.y).toBeGreaterThanOrEqual(button.y + button.height - 1);
    expect(list.x + list.width).toBeLessThanOrEqual(700);
    expect(list.x).toBeGreaterThan(300); // under the button at the end of the bar, not at the start
    expect(list.x).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Escape');
    // A dropdown at the bottom of the window opens upward.
    await page.locator('[aria-controls="lang"]').evaluate((el) => el.scrollIntoView({ block: 'end' }));
    await page.getByRole('button', { name: 'Language' }).click();
    [button, list] = [await box('[aria-controls="lang"]'), await box('#lang')];
    expect(list.y + list.height).toBeLessThanOrEqual(button.y + 1);
  });

  test('keyboard: ArrowDown opens and moves, Escape closes and returns focus', async ({ page }) => {
    await open(page, 'menu.html');
    const button = page.getByRole('button', { name: 'Account' });
    await button.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: 'Profile' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: 'Billing' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('link', { name: 'Sign out' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: 'Profile' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
    await expect(page.locator('#account')).toBeHidden();
  });

  test('arrow keys move through a popover menu', async ({ page }) => {
    await open(page, 'menu.html');
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('link', { name: 'Alpha' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: 'Beta' })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('link', { name: 'Gamma' })).toBeFocused();
  });
});

test.describe('dynamic content', () => {
  test('content added after load is enhanced, as with an htmx swap', async ({ page }) => {
    await open(page, 'blank.html');
    await page.evaluate(() => {
      document.querySelector('main').innerHTML = `
        <pre><code>added later</code></pre>
        <table id="late"><thead><tr><th>N</th></tr></thead><tbody><tr><td>2</td></tr><tr><td>1</td></tr></tbody></table>
        <label for="pw">Password</label><input type="password" id="pw">
        <button aria-expanded="false" aria-controls="late-menu">Menu</button><ul id="late-menu"><li><a href="#x">X</a></li></ul>`;
    });
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
    await expect(page.locator('#late-menu')).toBeHidden();
    await page.getByRole('button', { name: 'N', exact: true }).click();
    await expect(page.locator('#late tbody td')).toHaveText(['1', '2']);
  });

  test('init() is idempotent', async ({ page }) => {
    await open(page, 'form.html');
    const count = () => page.locator('[data-tag]').count();
    const before = await count();
    expect(before).toBeGreaterThanOrEqual(3);
    await page.evaluate(() => { TagAction.init(); TagAction.init(document.body); });
    expect(await count()).toBe(before);
  });

  test('data-tagaction="off" on <html> turns everything off', async ({ page }) => {
    await open(page, 'blank.html');
    await page.evaluate(() => {
      document.documentElement.dataset.tagaction = 'off';
      document.querySelector('main').innerHTML = '<pre>x</pre>';
    });
    await expect(page.getByRole('button', { name: 'Copy' })).toHaveCount(0);
  });
});

test.describe('dropdown details in the header nav', () => {
  test('Escape, an outside click, and following a link close it; arrow keys move through it', async ({ page }) => {
    await open(page, 'extras.html');
    const services = page.locator('#services');
    await page.locator('#services > summary').click();
    await expect(services).toHaveJSProperty('open', true);
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#grants-link')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(services).toHaveJSProperty('open', false);
    await expect(page.locator('#services > summary')).toBeFocused();

    await page.locator('#services > summary').click();
    await page.mouse.click(600, 700);
    await expect(services).toHaveJSProperty('open', false);

    await page.locator('#services > summary').click();
    await page.locator('#grants-link').click();
    await expect(services).toHaveJSProperty('open', false);
  });

  test('a details outside the header nav is left alone', async ({ page }) => {
    await open(page, 'extras.html');
    await page.locator('#plain > summary').click();
    await page.mouse.click(600, 10);
    await expect(page.locator('#plain')).toHaveJSProperty('open', true);
  });
});

test.describe('phone menu', () => {
  test('following a link in the popover closes it', async ({ page }) => {
    await open(page, 'extras.html', { width: 390 });
    await page.click('#menu-button');
    await expect(page.locator('#menu')).toBeVisible();
    await page.click('#faq-link');
    await expect(page.locator('#menu')).toBeHidden();
  });
});

test.describe('links into a closed details', () => {
  test('a link to an answer opens its details, on load and on hash change', async ({ page }) => {
    await open(page, 'extras.html');
    await expect(page.locator('#q-free')).toHaveJSProperty('open', false);
    await page.evaluate(() => { location.hash = '#free-answer'; });
    await expect(page.locator('#q-free')).toHaveJSProperty('open', true);
    await page.goto(page.url().replace(/#.*$/, '') + '#q-offline');
    await expect(page.locator('#q-offline')).toHaveJSProperty('open', true);
  });
});

test.describe('copy and share commands', () => {
  test('--copy copies a field value or an element\'s text and says so', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are granted in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, 'extras.html');
    await expect(page.locator('#copy-invite')).toBeVisible();
    await page.click('#copy-invite');
    await expect(page.locator('#copy-invite')).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://lumen.example/join/4F7Q');
    await page.click('#copy-key');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('sk_live_51H8');
    await expect(page.locator('#copy-invite')).toHaveText('Copy', { timeout: 3000 });
  });

  test('--share uses the share sheet with the section link, or copies it', async ({ page }) => {
    await open(page, 'extras.html');
    await page.evaluate(() => {
      window.shared = null;
      navigator.share = async (data) => { window.shared = data; };
    });
    await page.click('#share');
    await expect.poll(() => page.evaluate(() => window.shared?.url)).toMatch(/extras\.html#grants$/);
    await page.evaluate(() => { delete navigator.share; Object.defineProperty(navigator, 'share', { value: undefined }); });
    await page.click('#share');
    await expect(page.locator('#share')).toHaveText(/Link copied|Copy failed/);
  });
});

test.describe('theme switch', () => {
  test('a select and a button set data-theme on html and remember it', async ({ page }) => {
    await open(page, 'extras.html');
    await expect(page.locator('#theme-select')).toBeVisible();
    await page.selectOption('#theme-select', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-button')).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-select')).toHaveValue('dark');
    await page.click('#theme-button');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.selectOption('#theme-select', '');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
  });

  test('the saved theme is on <html> before the body is parsed, with the script in <head> without defer', async ({ page }) => {
    await page.route(/tagaction@[^/]+\/tagaction(\.min)?\.js/, (route) => route.fulfill({ path: 'tagaction.js', contentType: 'text/javascript' }));
    await page.route('https://example.test/theme.html', (route) => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en"><head>
      <script src="https://cdn.jsdelivr.net/npm/tagaction@0/tagaction.min.js"></script></head>
      <body><script>window.atFirstParse = document.documentElement.dataset.theme ?? null;</script>
      <select data-tag-theme aria-label="Color scheme" hidden><option value="">Auto</option><option value="light">Light</option><option value="dark">Dark</option></select></body></html>` }));
    await page.goto('https://example.test/theme.html');
    expect(await page.evaluate(() => window.atFirstParse)).toBe(null);
    await page.selectOption('select', 'dark');
    await page.reload();
    expect(await page.evaluate(() => window.atFirstParse)).toBe('dark');
    await expect(page.locator('select')).toHaveValue('dark');
  });
});

test.describe('keyboard shortcuts', () => {
  test('aria-keyshortcuts: "/" focuses the search box, Control+K clicks a button, typing in a field is left alone', async ({ page }) => {
    await open(page, 'extras.html');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('/');
    await expect(page.locator('#quick-search')).toBeFocused();
    await expect(page.locator('#quick-search')).toHaveValue(''); // the "/" isn't typed
    // While typing in a field, a key without a modifier types as usual.
    await page.locator('#note-field').click();
    await page.keyboard.type('a/b');
    await expect(page.locator('#note-field')).toHaveValue('a/b');
    // With a modifier it works from inside a field too.
    await page.keyboard.press('Control+k');
    await expect(page.locator('#palette')).toHaveAttribute('data-clicked', '1');
    await page.keyboard.press('Meta+K');
    await expect(page.locator('#palette')).toHaveAttribute('data-clicked', '2');
    // Disabled elements are skipped.
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('g');
    await expect(page.locator('#off-shortcut')).not.toBeFocused();
  });

  test('a shortcut on content added later works', async ({ page }) => {
    await open(page, 'extras.html');
    await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<input id="late-field" aria-label="Late" aria-keyshortcuts="Alt+L">'));
    await page.keyboard.press('Alt+l');
    await expect(page.locator('#late-field')).toBeFocused();
  });
});

test.describe('tabs', () => {
  test('only the selected panel shows, and arrow keys, Home and End move between tabs', async ({ page }) => {
    await open(page, 'extras.html');
    await expect(page.locator('#cdn')).toBeVisible();
    await expect(page.locator('#npm')).toBeHidden();
    await expect(page.locator('#tab-cdn')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#cdn')).toHaveAttribute('aria-labelledby', 'tab-cdn');
    await page.locator('#tab-cdn').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-download')).toBeFocused();
    await expect(page.locator('#download')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-npm')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('#download')).toBeVisible();
    await page.click('#tab-npm');
    await expect(page.locator('#npm')).toBeVisible();
    await expect(page.locator('#tab-npm')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#tab-cdn')).toHaveAttribute('tabindex', '-1');
  });
});

test.describe('matching fields', () => {
  test('a confirm field is invalid until it matches, and the message clears when it does', async ({ page }) => {
    await open(page, 'extras.html');
    await page.fill('#password', 'correct horse');
    await page.fill('#confirm', 'correct hose');
    expect(await page.locator('#confirm').evaluate((f) => f.validationMessage)).toBe("Doesn't match Password.");
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.locator('#confirm')).toHaveAttribute('aria-invalid', 'true');
    await page.fill('#password', 'correct hose');
    await expect(page.locator('#confirm')).not.toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('search results list', () => {
  test('a list written hidden shows only matches, and only while there is a search', async ({ page }) => {
    await open(page, 'extras.html');
    await expect(page.locator('#site-search')).toBeVisible();
    await expect(page.locator('#pages')).toBeHidden();
    await page.fill('#site-search', 'install');
    await expect(page.locator('#pages')).toBeVisible();
    await expect(page.locator('#pages li:visible')).toHaveCount(1);
    await page.fill('#site-search', '');
    await expect(page.locator('#pages')).toBeHidden();
  });
});
