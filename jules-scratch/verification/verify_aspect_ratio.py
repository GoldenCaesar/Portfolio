import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()

        # DM Page
        dm_page = await context.new_page()
        await dm_page.goto(f"file://{'/app/Projects/DnDemicube/dm_view.html'}")

        # Wait for the player view to open when we click the button
        async with context.expect_page() as player_page_info:
            await dm_page.get_by_text("Open Player View").click()
        player_page = await player_page_info.value

        await dm_page.bring_to_front()

        # Upload a map
        async with dm_page.expect_file_chooser() as fc_info:
            await dm_page.locator("#upload-maps-input").click()
        file_chooser = await fc_info.value
        await file_chooser.set_files("assets/project-DnDemicube.png")

        await dm_page.wait_for_timeout(500)

        # Select the map
        await dm_page.get_by_text("project-DnDemicube.png").click()

        # Switch to DM Controls Tab
        await dm_page.locator('[data-tab="tab-dm-controls"]').click()

        await dm_page.wait_for_timeout(500)

        # Switch to View mode
        toggle_switch = dm_page.locator("#mode-toggle-switch")
        await toggle_switch.scroll_into_view_if_needed()
        await toggle_switch.check()

        # Give time for the map to be sent and rendered
        await player_page.wait_for_timeout(1000)

        # Take a screenshot of the player view
        await player_page.screenshot(path="jules-scratch/verification/verification_1.png")

        # Resize the DM window
        await dm_page.set_viewport_size({"width": 800, "height": 1200})

        # Give time for the transform update to be sent and rendered
        await player_page.wait_for_timeout(1000)

        # Take another screenshot to show the aspect ratio is maintained
        await player_page.screenshot(path="jules-scratch/verification/verification_2.png")

        await browser.close()

asyncio.run(main())
