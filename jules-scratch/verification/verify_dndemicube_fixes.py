import asyncio
import os
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Construct the absolute path to the HTML file
            script_dir = os.path.dirname(os.path.abspath(__file__))
            repo_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
            dm_view_path = os.path.join(repo_root, 'Projects', 'DnDemicube', 'dm_view.html')

            # Navigate to the local DM view file
            await page.goto(f"file://{dm_view_path}")

            # Wait for the page to load by looking for a known element
            await expect(page.get_by_text("Manage Maps")).to_be_visible()
            print("Found 'Manage Maps' text.")
            await page.wait_for_timeout(1000) # 1 second delay

            # --- Verification for Synced Rolls ---

            # 1. Click the Characters tab to make the "Add Character" button visible
            await page.get_by_role("button", name="Characters").click()

            # 2. Add a new character
            await page.get_by_role("button", name="Add Character").click()
            await page.locator("#character-name-input").fill("Briv")
            await page.get_by_role("button", name="Save Character").click()
            print("Character 'Briv' created.")
            await page.wait_for_timeout(1000)

            # 3. Select the character in the list to show the editor
            await page.get_by_role("listitem").filter(has_text="Briv").click()

            # 4. Open the character sheet
            await page.get_by_role("button", name="View Character").click()

            # The character sheet is in an iframe, so we need to get the frame
            iframe = page.frame_locator("#character-sheet-iframe")

            # 5. Add a roll in the character sheet
            await iframe.get_by_label("Roll Name").fill("Axe Swing")
            await iframe.get_by_role("button", name="d20").click()
            await iframe.get_by_label("Modifier").fill("5")
            await iframe.get_by_role("button", name="Save Roll").click()

            # 6. Verify the roll exists in the character sheet
            await expect(iframe.get_by_text("Axe Swing (1d20 + 5)")).to_be_visible()
            await page.screenshot(path="jules-scratch/verification/01_roll_in_character_sheet.png")

            # 7. Go back to the main DM view
            await page.get_by_role("button", name="DM Controls").click()

            # Open the token stat block by right-clicking the character in the list
            await page.get_by_role("listitem").filter(has_text="Briv").click(button="right")

            await expect(page.get_by_text("Axe Swing (1d20 + 5)")).to_be_visible()
            await page.screenshot(path="jules-scratch/verification/02_roll_in_token_menu.png")

            # Close the context menu
            await page.keyboard.press("Escape")


            # --- Verification for Unique Initiative Tokens ---

            # 6. Add the same character to initiative multiple times
            await page.get_by_role("button", name="Open Initiative Tracker").click()

            # Add Briv once
            await page.get_by_role("listitem").filter(has_text="Briv").locator("h4").click()

            # Add Briv a second time
            await page.get_by_role("listitem").filter(has_text="Briv").locator("h4").click()

            # Add Briv a third time
            await page.get_by_role("listitem").filter(has_text="Briv").locator("h4").click()

            # 7. Verify the names in the active initiative list
            active_list = page.locator("#initiative-active-list")
            await expect(active_list.get_by_text("Briv", exact=True)).to_have_count(1)
            await expect(active_list.get_by_text("Token Briv")).to_have_count(2)

            await page.locator("#initiative-tracker-overlay").screenshot(path="jules-scratch/verification/03_unique_initiative_tokens.png")

            print("Verification script completed successfully!")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        finally:
            await browser.close()

asyncio.run(main())
