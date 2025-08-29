import asyncio
from playwright.sync_api import sync_playwright, Page, expect
import os

def verify_chain_tool(page: Page):
    # Get the absolute path to the HTML file
    # This is necessary because playwright's page.goto() needs a URL or an absolute file path.
    # When running from the repo root, the relative path is just the filename.
    file_path = os.path.abspath('Projects/DnDemicube/dm_view.html')

    page.goto(f'file://{file_path}')

    # 1. Upload and select a map
    # The dummy file needs to exist relative to the execution directory.
    dummy_map_path = os.path.abspath('jules-scratch/verification/map.png')
    page.locator('input#upload-maps-input').set_input_files(dummy_map_path)

    page.locator('li[data-file-name="map.png"]').click()

    # 2. Switch to Edit mode
    # The input itself is hidden, so we click the label associated with it.
    toggle_switch_label = page.locator('label.switch:has(#mode-toggle-switch)')
    toggle_switch_label.wait_for(state='visible')
    toggle_switch_label.click()

    # 3. Open the Assets Tool
    page.locator('#dm-canvas').click(button='right', position={'x': 200, 'y': 200})
    page.get_by_text("Assets Tool").click()

    # 4. Inject a dummy asset using page.evaluate
    asset_path = 'test/asset.png'
    asset_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAADNJREFUGJVjZGRiZqAEnAwgwAgsrCwMDAwsrCwMDAwsLCz/h2ZkYMjPz/8DAnwZkNF/BgB/cAl2eSgFGwAAAABJRU5ErkJggg=='

    page.evaluate(f"""
    () => {{
        window.assetsByPath = {{
            'test': {{
                type: 'folder',
                children: {{
                    'asset.png': {{
                        type: 'file',
                        path: '{asset_path}',
                        url: '{asset_url}',
                        file: new File([""], "asset.png", {{ type: "image/png" }})
                    }}
                }}
            }}
        }};

        const img = new Image();
        img.src = '{asset_url}';
        window.assetImageCache['{asset_path}'] = img;

        // This needs to be defined for the next step to work
        if (typeof window.renderAssetExplorer === 'function') {{
            window.renderAssetExplorer();
        }}
    }}
    """)

    # 5. Navigate asset explorer and select the asset
    # Click the footer tab to make sure the asset explorer is visible
    page.locator('.footer-tab-button[data-tab="footer-assets"]').click()
    page.get_by_text("Assets").click() # Go to root
    page.get_by_text("test").click() # Go into test folder
    page.locator(f'div.asset-item[title="asset.png"]').click()

    # 6. Activate the Chain tool
    page.locator('#btn-assets-chain').click()

    # 7. Perform the chaining action
    canvas = page.locator('#dm-canvas')
    canvas.hover(position={'x': 100, 'y': 100})
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.move(300, 150)
    page.mouse.up()

    # 8. Take screenshot
    page.screenshot(path="jules-scratch/verification/chain_tool_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_chain_tool(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
            # Take a screenshot on failure for debugging
            page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
