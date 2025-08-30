import os
import time
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies three bug fixes for the DnDemicube application.
    """
    # Get the absolute path to the HTML file
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    dm_view_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'dm_view.html')

    # Use file:// protocol to open the local HTML file
    page.goto(f'file://{dm_view_path}')

    # Wait for the page to load by looking for a known element
    expect(page.get_by_text("Manage Maps")).to_be_visible()

    # 1. Upload a map to enable the tools
    with page.expect_file_chooser() as fc_info:
        page.get_by_label("Upload Map Files:").click()

    map_asset_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'assets', 'd20icon.png')
    fc_info.value.set_files(map_asset_path)

    # 2. Click on the map to display it
    page.get_by_text("d20icon.png").first.click()
    time.sleep(1) # Give canvas time to draw

    # 3. Switch to assets tool
    page.locator("#map-container").click(button="right")
    page.locator("#map-tools-context-menu").get_by_text("Assets").click()
    time.sleep(1)

    # 4. Upload assets
    assets_folder_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'assets')
    # The input is hidden, but the button click should trigger it.
    # We set the files on the input directly.
    page.locator("#assets-folder-input").set_files([
        os.path.join(assets_folder_path, 'd20icon.png'),
        os.path.join(assets_folder_path, 'default-portrait.png')
    ])
    time.sleep(1)

    # --- Verification 1: Select Tool Resizing ---

    # 5. Click the asset to select it for stamping
    page.locator('.asset-item', has_text='default-portrait.png').click()

    # 6. Activate stamp tool and place the asset
    page.locator('#btn-assets-stamp').click()
    page.locator('#dm-canvas').click(position={'x': 200, 'y': 200})
    time.sleep(1)

    # 7. Activate select tool and click the asset to select it
    page.locator('#btn-assets-select').click()
    page.locator('#dm-canvas').click(position={'x': 200, 'y': 200})
    time.sleep(1)

    # 8. Drag a resize handle. The bug was that this was ignored.
    # We will drag from a corner of the canvas where the handle should be.
    canvas_box = page.locator('#dm-canvas').bounding_box()
    # Position of the asset + an offset for the handle
    handle_x = canvas_box['x'] + 200 + 30
    handle_y = canvas_box['y'] + 200 + 30

    page.mouse.move(handle_x, handle_y)
    page.mouse.down()
    page.mouse.move(handle_x + 50, handle_y + 50, steps=5)
    page.mouse.up()

    page.screenshot(path="jules-scratch/verification/verification_select_tool.png")
    print("Screenshot for select tool taken.")

    # --- Verification 2: Favorites Folder ---

    # 9. Favorite the asset
    page.locator('.asset-item', has_text='default-portrait.png').locator('.asset-favorite-btn').click()

    # 10. Click on the "Favorites" folder
    page.locator('.asset-item', has_text='Favorites').click()

    # 11. Check if the favorited asset is visible
    expect(page.locator('.asset-item', has_text='default-portrait.png')).to_be_visible()

    page.screenshot(path="jules-scratch/verification/verification_favorites.png")
    print("Screenshot for favorites folder taken.")

    # --- Verification 3: Chain Tool Preview ---

    # 12. Go back to the root asset folder
    page.locator('#asset-path-display a').click()

    # 13. Select the asset for chaining
    page.locator('.asset-item', has_text='default-portrait.png').click()

    # 14. Activate chain tool
    page.locator('#btn-assets-chain').click()

    # 15. Move mouse to a position on the canvas to show the preview
    page.locator('#dm-canvas').hover(position={'x': 300, 'y': 300})
    time.sleep(1) # Wait for preview to render

    page.screenshot(path="jules-scratch/verification/verification_chain_tool.png")
    print("Screenshot for chain tool taken.")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
