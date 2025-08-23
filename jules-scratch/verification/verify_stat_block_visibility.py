import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:8000/Projects/DnDemicube/dm_view.html")

            # 1. Add a character
            await page.click('#tab-characters')
            await page.click('#add-character-button')
            await page.fill('#character-name-input', 'Test Character')
            await page.click('#save-character-button')

            # 2. Add the character to initiative
            await page.click('[data-tab="tab-dm-controls"]')
            await page.click('[data-action="open-initiative-tracker"]')
            await page.click('.initiative-character-card') # Clicks the first character in the master list

            # 3. Start wandering to put the token on the map
            await page.click('#wander-button')

            # Close initiative tracker
            await page.click('.overlay-minimize-button')


            # 4. Right click the token to open the stat block
            await page.click('#dm-canvas', button='right', position={'x': 50, 'y': 50})

            # 5. Check that the stat block is visible
            await page.wait_for_selector('#token-stat-block', state='visible')
            print("Stat block is visible after right click.")

            # 6. Click the checkbox to hide details
            await page.check('#token-stat-block-visibility-checkbox')

            # 7. Check that the isDetailsVisible property is true for the character
            is_details_visible = await page.evaluate('''() => {
                const character = charactersData.find(c => c.name === 'Test Character');
                return character.isDetailsVisible;
            }''')

            if is_details_visible:
                print("Character details are visible after checking the box.")
            else:
                print("Error: Character details are NOT visible after checking the box.")


            # 8. Click the checkbox again to show details
            await page.uncheck('#token-stat-block-visibility-checkbox')

            # 9. Check that the isDetailsVisible property is false for the character
            is_details_visible = await page.evaluate('''() => {
                const character = charactersData.find(c => c.name === 'Test Character');
                return character.isDetailsVisible;
            }''')

            if not is_details_visible:
                print("Character details are not visible after unchecking the box.")
            else:
                print("Error: Character details are STILL visible after unchecking the box.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
