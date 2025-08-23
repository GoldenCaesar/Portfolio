import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    # Get the absolute path to the HTML file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    html_file_path = os.path.join(project_root, 'Projects', 'DnDemicube', 'dm_view.html')
    html_file_url = f'file://{html_file_path}'

    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(html_file_url)

        # 1. Upload a map
        map_path = os.path.join(project_root, 'assets', 'project-DnDemicube.png')
        page.locator('#upload-maps-input').set_input_files(map_path)

        # 2. Select the map to display it
        page.locator('li.map-list-item').click()

        # 3. Switch to Characters tab and add a character
        page.locator('button[data-tab="tab-characters"]').click()
        page.locator('#add-character-button').click()

        # 4. Switch back to DM Controls tab so the map is visible
        page.locator('button[data-tab="tab-dm-controls"]').click()

        # 5. Add the character to the initiative
        # First, click the dice icon to reveal the footer menu
        page.locator('#dice-roller-icon').click()
        # Then, click the initiative tracker button in the footer
        page.locator('#dm-tools-list li[data-action="open-initiative-tracker"]').click()

        # Click the character card in the master list to add them to the active list
        page.locator('#initiative-master-character-list .initiative-character-card').click()

        # 6. Start wandering to place tokens on the map
        page.locator('#wander-button').click()

        # Close the initiative tracker overlay to see the map
        page.locator('#initiative-tracker-overlay .overlay-minimize-button').click()

        # 7. Right-click the map container where the token should be
        map_container = page.locator('#map-container')
        expect(map_container).to_be_visible()
        # A small delay to ensure rendering is complete
        page.wait_for_timeout(500)
        # Right-click near the top-left where the first token should be
        map_container.click(button='right', position={'x': 100, 'y': 100})

        # 8. Assert that the stat block is visible
        stat_block_locator = page.locator('#token-stat-block')
        expect(stat_block_locator).to_be_visible()

        # 9. Assert that the checkbox is present and take a screenshot
        checkbox_locator = page.locator('#token-stat-block-visibility-checkbox')
        expect(checkbox_locator).to_be_visible()

        screenshot_path = os.path.join(current_dir, 'verification.png')
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)
