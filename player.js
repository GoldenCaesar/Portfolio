document.addEventListener('DOMContentLoaded', () => {
    const playerCanvas = document.getElementById('playerCanvas');
    const ctx = playerCanvas.getContext('2d');
    const backToMainMapBtn = document.getElementById('backToMainMapBtn');

    let mainMapImageDataUrl = null; // Store the main map
    let currentMapImage = null; // This will hold the Image object of the currently displayed map
    let currentMapType = 'main'; // 'main' or 'subMap'

    // Function to resize canvas to fit image and window
    function resizeAndDrawPlayerCanvas(image, mapType = 'main') {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;

        let newWidth = image.width;
        let newHeight = image.height;

        // Adjust size if image is larger than window
        if (newWidth > maxWidth) {
            newHeight = (maxWidth / newWidth) * newHeight;
            newWidth = maxWidth;
        }
        if (newHeight > maxHeight) {
            newWidth = (maxHeight / newHeight) * newWidth;
            newHeight = maxHeight;
        }

        playerCanvas.width = newWidth;
        playerCanvas.height = newHeight;

        ctx.drawImage(image, 0, 0, playerCanvas.width, playerCanvas.height);
    }

    window.addEventListener('message', (event) => {
        // For security, you might want to check event.origin in a real application
        // if (event.origin !== 'expected-origin') return;

        const data = event.data;

        if (data && data.type === 'loadMap' && data.imageDataUrl) { // Main map
            mainMapImageDataUrl = data.imageDataUrl; // Save main map
            const newImg = new Image();
            newImg.onload = () => {
                currentMapImage = newImg;
                resizeAndDrawPlayerCanvas(currentMapImage, 'main');
                backToMainMapBtn.style.display = 'none'; // Hide back button on main map
                currentMapType = 'main';
            };
            newImg.onerror = () => {
                console.error("Player view: Error loading main map image.");
                ctx.clearRect(0,0, playerCanvas.width, playerCanvas.height);
                ctx.fillText("Error loading map. DM may need to resend.", 10, 50);
            };
            newImg.src = mainMapImageDataUrl;

        } else if (data && data.type === 'loadSubMap' && data.imageDataUrl) { // Sub map
            const newSubImg = new Image();
            newSubImg.onload = () => {
                currentMapImage = newSubImg;
                resizeAndDrawPlayerCanvas(currentMapImage, 'subMap');
                if (mainMapImageDataUrl) { // Only show back button if main map exists
                    backToMainMapBtn.style.display = 'block';
                }
                currentMapType = 'subMap';
            };
            newSubImg.onerror = () => {
                console.error(`Player view: Error loading sub-map image: ${data.mapName || data.mapId}`);
                // Don't clear canvas, keep showing previous map or main map
                alert("Error loading the requested detailed map. Please inform the DM.");
            };
            newSubImg.src = data.imageDataUrl;
            console.log(`Player view received submap: ${data.mapName || data.mapId}`);
        }
    });

    backToMainMapBtn.addEventListener('click', () => {
        if (mainMapImageDataUrl) {
            const mainImg = new Image();
            mainImg.onload = () => {
                currentMapImage = mainImg;
                resizeAndDrawPlayerCanvas(currentMapImage, 'main');
                backToMainMapBtn.style.display = 'none';
                currentMapType = 'main';
            };
            mainImg.onerror = () => { // Should ideally not happen if it loaded once
                console.error("Player view: Error reloading main map image.");
                ctx.clearRect(0,0, playerCanvas.width, playerCanvas.height);
                ctx.fillText("Error reloading main map.", 10, 50);
            };
            mainImg.src = mainMapImageDataUrl;
            console.log("Player view: Navigating back to main map.");
        }
    });

    window.addEventListener('resize', () => {
        if (currentMapImage) {
            resizeAndDrawPlayerCanvas(currentMapImage, currentMapType);
        } else {
            // Optional: handle empty state if no map yet
            playerCanvas.width = window.innerWidth * 0.9; // Default size
            playerCanvas.height = window.innerHeight * 0.9;
            ctx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
            ctx.fillStyle = "#555";
            ctx.font = "16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Waiting for map from DM...", playerCanvas.width / 2, playerCanvas.height / 2);
            backToMainMapBtn.style.display = 'none';
        }
    });

    // Initial canvas setup
    window.dispatchEvent(new Event('resize'));

    // Notify DM window that player view is ready
    if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'playerViewReady' }, '*');
    }
});
