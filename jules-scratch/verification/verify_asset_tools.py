import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    # Setup
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Get the absolute path to the HTML file
    # This is necessary because `page.goto` needs a proper URL or an absolute file path.
    # The current working directory is the root of the repository.
    html_file_path = os.path.abspath('Projects/DnDemicube/dm_view.html')

    try:
        # 1. Navigate to the page
        page.goto(f'file://{html_file_path}')

        # 2. Open the asset tools
        # Right-click on the canvas to open the map tools context menu
        page.locator('#dm-canvas').click(button='right')
        # Click the "Assets Tool" button
        page.get_by_text('Assets Tool').click()

        # 3. Upload the dummy asset
        # The input is hidden, so we can't use a locator. We need to listen for the
        # file chooser event that is triggered by clicking the upload button.
        with page.expect_file_chooser() as fc_info:
            page.locator('#upload-assets-folder-btn').click()

        file_chooser = fc_info.value
        # We need the absolute path for the asset as well.
        asset_path = os.path.abspath('jules-scratch/verification/dummy_asset.svg')
        file_chooser.set_files(asset_path)

        # 4. Select the uploaded asset from the library
        # The asset should now be visible in the asset explorer.
        page.locator('.asset-item', has_text='dummy_asset.svg').click()

        # 5. Verify the preview pane appears
        asset_preview = page.locator('#asset-preview-container')
        expect(asset_preview).to_be_visible()
        expect(asset_preview.locator('#asset-preview-title')).to_have_text('dummy_asset.svg')

        # 6. Activate the "Stamp" tool
        page.locator('#btn-assets-stamp').click()

        # 7. Click on the canvas to place the asset
        page.locator('#dm-canvas').click(position={'x': 200, 'y': 200})

        # 8. Activate the "Select" tool
        page.locator('#btn-assets-select').click()

        # 9. Click on the placed asset
        # We click on the same coordinates where we placed it.
        page.locator('#dm-canvas').click(position={'x': 200, 'y': 200})

        # 10. Use the opacity slider to change the asset's opacity
        opacity_slider = page.locator('#asset-preview-opacity')
        # To set the slider value, we can use the `fill` method with the desired value.
        opacity_slider.fill('0.5')

        # Add a small delay to ensure the re-render with new opacity is complete
        page.wait_for_timeout(500)

        # 11. Take a screenshot
        page.screenshot(path='jules-scratch/verification/verification.png')

    finally:
        # Teardown
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
