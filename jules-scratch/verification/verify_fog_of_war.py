import os
import time
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the fog of war bug fix for the DnDemicube application.
    """
    # Get the absolute path to the HTML file
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    dm_view_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'dm_view.html')

    # Use file:// protocol to open the local HTML file
    page.goto(f'file://{dm_view_path}')

    # Wait for the page to load by looking for a known element
    expect(page.get_by_text("Manage Maps")).to_be_visible()

    # 1. Open Player View
    with page.context.expect_page() as new_page_info:
        page.get_by_role("button", name="Open Player View").click()
    player_page = new_page_info.value
    player_page.wait_for_load_state()
    time.sleep(1) # Give player view a moment to initialize

    # 2. Upload a map to enable the tools
    with page.expect_file_chooser() as fc_info:
        page.get_by_label("Upload Map Files:").click()

    map_asset_path = os.path.join(base_dir, 'Projects', 'DnDemicube', 'assets', 'd20icon.png')
    fc_info.value.set_files(map_asset_path)

    # 3. Click on the map to display it
    page.get_by_text("d20icon.png").first.click()
    time.sleep(1) # Give canvas time to draw

    # 4. Switch to View mode
    # The input itself is invisible, so we click its visible label/slider.
    # Be specific to avoid matching the automation toggle switch.
    page.locator("#tab-dm-controls .mode-toggle-container .slider").click()
    time.sleep(1) # Give time for map to be sent to player

    # 5. Screenshot 1: Initial State (Player View should be black)
    player_page.screenshot(path="jules-scratch/verification/fow_01_initial.png")
    print("Screenshot 1 (Initial State) taken.")

    # 6. Add a character
    page.get_by_role("button", name="Characters").click()
    page.get_by_role("button", name="Add Character").click()
    time.sleep(0.5)

    # 7. Go to DM Tools and open Initiative Tracker
    page.get_by_role("button", name="DM Controls").click()
    page.get_by_role("img", name="d20 icon").click()
    page.get_by_text("Initiative Tracker").click()
    time.sleep(0.5)

    # 8. Add character to initiative
    page.locator('.initiative-character-card').click()
    time.sleep(0.5)

    # 9. Start Wandering to place token on map
    page.get_by_role("button", name="Wander").click()
    time.sleep(1) # Allow token to appear and fog to update

    # 10. Close the initiative tracker to see the map
    page.locator("#initiative-tracker-overlay .overlay-minimize-button").click()
    time.sleep(0.5)

    # 11. Screenshot 2: Revealed State
    player_page.screenshot(path="jules-scratch/verification/fow_02_revealed.png")
    print("Screenshot 2 (Revealed State) taken.")

    # 12. Re-open the initiative tracker to access the button
    page.get_by_role("img", name="d20 icon").click()
    page.get_by_text("Initiative Tracker").click()
    time.sleep(0.5)

    # 13. Stop Wandering to remove vision
    page.get_by_role("button", name="Stop Wandering").click()
    time.sleep(1) # Allow fog to update to memory state

    # 14. Close the initiative tracker again
    page.locator("#initiative-tracker-overlay .overlay-minimize-button").click()
    time.sleep(0.5)

    # 15. Screenshot 3: Memory State
    player_page.screenshot(path="jules-scratch/verification/fow_03_memory.png")
    print("Screenshot 3 (Memory State) taken.")
    print("Verification complete. Please check the screenshots.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        except Exception as e:
            print(f"An error occurred during verification: {e}")
            page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
