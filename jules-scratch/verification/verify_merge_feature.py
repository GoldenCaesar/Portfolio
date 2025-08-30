import os
import time
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the new "Merge Assets" feature.
    """
    # Get the absolute path to the HTML file
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    dm_view_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'dm_view.html')

    page.goto(f'file://{dm_view_path}')

    expect(page.get_by_text("Manage Maps")).to_be_visible()

    # 1. Upload a map
    with page.expect_file_chooser() as fc_info:
        page.get_by_label("Upload Map Files:").click()
    map_asset_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'assets', 'd20icon.png')
    fc_info.value.set_files(map_asset_path)
    page.get_by_text("d20icon.png").first.click()
    time.sleep(1)

    # 2. Switch to assets tool
    page.locator("#map-container").click(button="right")
    page.locator("#map-tools-context-menu").get_by_text("Assets").click()
    time.sleep(1)

    # 3. Upload assets
    assets_folder_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'assets')
    page.locator("#assets-folder-input").set_input_files(assets_folder_path)
    time.sleep(1)

    # 4. Place two different assets on the map
    page.locator('.asset-item', has_text='d20icon.png').click()
    page.locator('#btn-assets-stamp').click()
    page.locator('#dm-canvas').click(position={'x': 150, 'y': 150})
    time.sleep(0.5)

    page.locator('.asset-item', has_text='default-portrait.png').click()
    page.locator('#btn-assets-stamp').click()
    page.locator('#dm-canvas').click(position={'x': 250, 'y': 250})
    time.sleep(0.5)

    # 5. Select both assets using marquee selection
    page.locator('#btn-assets-select').click()
    canvas_box = page.locator('#dm-canvas').bounding_box()
    page.mouse.move(canvas_box['x'] + 100, canvas_box['y'] + 100)
    page.mouse.down()
    page.mouse.move(canvas_box['x'] + 300, canvas_box['y'] + 300, steps=5)
    page.mouse.up()
    time.sleep(1)

    # 6. Verify the "Merge" button is visible
    merge_button = page.locator('#btn-assets-merge')
    expect(merge_button).to_be_visible()

    # 7. Click the "Merge" button
    # Handle the alert dialog that appears after merging
    page.on("dialog", lambda dialog: dialog.accept())
    merge_button.click()
    time.sleep(1)

    # 8. Verify the new merged asset is in the favorites view
    # The view should automatically switch to favorites
    expect(page.locator('#asset-path-display')).to_have_text("Assets / Favorites")
    expect(page.locator('.asset-item', has_text='Merged Asset 1.png')).to_be_visible()

    # 9. Take a screenshot for visual confirmation
    page.screenshot(path="jules-scratch/verification/verification_merge_feature.png")
    print("Screenshot for merge feature taken.")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
