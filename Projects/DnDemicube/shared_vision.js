function getLineIntersection(p1, p2) {
    const dX = p1.x2 - p1.x1;
    const dY = p1.y2 - p1.y1;
    const dX2 = p2.x2 - p2.x1;
    const dY2 = p2.y2 - p2.y1;
    const denominator = dX * dY2 - dY * dX2;

    if (denominator === 0) return null;

    const t = ((p2.x1 - p1.x1) * dY2 - (p2.y1 - p1.y1) * dX2) / denominator;
    const u = -((p1.x1 - p2.x1) * dY - (p1.y1 - p2.y1) * dX) / denominator;

    if (t >= 0 && u >= 0 && u <= 1) {
        return { x: p1.x1 + t * dX, y: p1.y1 + t * dY };
    }

    return null;
}

function createDarkvisionMask(imgWidth, imgHeight, gridData, initiativeTokens, activeInitiative) {
    if (!gridData || !gridData.visible || !imgWidth || !imgHeight) {
        return null;
    }

    const darkvisionMaskCanvas = document.createElement('canvas');
    darkvisionMaskCanvas.width = imgWidth;
    darkvisionMaskCanvas.height = imgHeight;
    const maskCtx = darkvisionMaskCanvas.getContext('2d');
    maskCtx.fillStyle = 'black';

    const tokensWithVision = initiativeTokens.filter(token => {
        const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        return character && character.vision === true;
    });

    if (tokensWithVision.length === 0) {
        return null;
    }

    tokensWithVision.forEach(token => {
        const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        if (character && character.sheetData) {
            const visionFt = parseInt(character.sheetData.vision_ft, 10) || 0;
            const gridSqftValue = gridData.sqft || 5;
            const gridPixelSize = gridData.scale || 50;

            if (visionFt > 0 && gridSqftValue > 0) {
                const visionRadiusInGridSquares = visionFt / gridSqftValue;
                const visionRadiusInPixels = visionRadiusInGridSquares * gridPixelSize;

                maskCtx.beginPath();
                maskCtx.arc(token.x, token.y, visionRadiusInPixels, 0, Math.PI * 2, true);
                maskCtx.fill();
            }
        }
    });

    return darkvisionMaskCanvas;
}

function generateVisionMask(imgWidth, imgHeight, overlays, gridData, initiativeTokens, activeInitiative) {
    if (!imgWidth || !imgHeight) return null;

    const visionMaskCanvas = document.createElement('canvas');
    visionMaskCanvas.width = imgWidth;
    visionMaskCanvas.height = imgHeight;
    const visionCtx = visionMaskCanvas.getContext('2d');

    const lightSources = initiativeTokens
        .filter(token => {
            const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
            return character && character.vision === true;
        })
        .map(token => ({
            position: { x: token.x, y: token.y }
        }));

    if (lightSources.length === 0) return null;

    const walls = overlays.filter(o => o.type === 'wall');
    const closedDoors = overlays.filter(o => o.type === 'door' && !o.isOpen);
    const smartObjects = overlays.filter(o => o.type === 'smart_object');

    const allSegments = [];
    walls.forEach(wall => {
        for (let i = 0; i < wall.points.length - 1; i++) {
            allSegments.push({ p1: wall.points[i], p2: wall.points[i + 1], parent: wall });
        }
    });
    closedDoors.forEach(door => {
        allSegments.push({ p1: door.points[0], p2: door.points[1], parent: door });
    });
    smartObjects.forEach(object => {
        for (let i = 0; i < object.polygon.length - 1; i++) {
            allSegments.push({ p1: object.polygon[i], p2: object.polygon[i + 1], parent: object });
        }
         allSegments.push({ p1: object.polygon[object.polygon.length - 1], p2: object.polygon[0], parent: object });
    });

    allSegments.push({ p1: { x: 0, y: 0 }, p2: { x: imgWidth, y: 0 }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: 0 }, p2: { x: imgWidth, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: imgHeight }, p2: { x: 0, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: 0, y: imgHeight }, p2: { x: 0, y: 0 }, parent: { type: 'boundary' } });

    const allVertices = [];
    allSegments.forEach(seg => {
        allVertices.push(seg.p1, seg.p2);
    });

    visionCtx.fillStyle = 'black';
    visionCtx.beginPath();

    lightSources.forEach(light => {
        const visiblePoints = [];
        const angles = new Set();

        let lightIsInsideObject = false;
        for (const so of smartObjects) {
            if (isPointInPolygon(light.position, so.polygon)) {
                lightIsInsideObject = true;
                break;
            }
        }

        allVertices.forEach(vertex => {
            const angle = Math.atan2(vertex.y - light.position.y, vertex.x - light.position.x);
            angles.add(angle - 0.0001);
            angles.add(angle);
            angles.add(angle + 0.0001);
        });

        const sortedAngles = Array.from(angles).sort((a, b) => a - b);

        sortedAngles.forEach(angle => {
            const ray = {
                x1: light.position.x,
                y1: light.position.y,
                x2: light.position.x + (imgWidth + imgHeight) * 2 * Math.cos(angle),
                y2: light.position.y + (imgWidth + imgHeight) * 2 * Math.sin(angle)
            };

            let closestIntersection = null;
            let minDistance = Infinity;

            allSegments.forEach(segment => {
                const intersectionPoint = getLineIntersection(ray, { x1: segment.p1.x, y1: segment.p1.y, x2: segment.p2.x, y2: segment.p2.y });
                if (intersectionPoint) {
                    let ignoreThisIntersection = false;
                    if (segment.parent.type === 'smart_object') {
                        const p1 = segment.p1;
                        const p2 = segment.p2;
                        const normal = { x: p2.y - p1.y, y: p1.x - p2.x };
                        const lightVector = { x: intersectionPoint.x - light.position.x, y: intersectionPoint.y - light.position.y };
                        const dot = (lightVector.x * normal.x) + (lightVector.y * normal.y);
                        if (!lightIsInsideObject && dot > 0) {
                            ignoreThisIntersection = true;
                        }
                    }

                    if (!ignoreThisIntersection) {
                        const distance = Math.sqrt(Math.pow(intersectionPoint.x - light.position.x, 2) + Math.pow(intersectionPoint.y - light.position.y, 2));
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIntersection = intersectionPoint;
                        }
                    }
                }
            });

            if (closestIntersection) {
                visiblePoints.push(closestIntersection);
            } else {
                visiblePoints.push({ x: ray.x2, y: ray.y2 });
            }
        });

        if (visiblePoints.length > 0) {
            const firstPoint = visiblePoints[0];
            visionCtx.moveTo(firstPoint.x, firstPoint.y);
            visiblePoints.forEach(point => {
                visionCtx.lineTo(point.x, point.y);
            });
            visionCtx.closePath();
        }
    });
    visionCtx.fill();

    const darkvisionMask = createDarkvisionMask(imgWidth, imgHeight, gridData, initiativeTokens, activeInitiative);
    if (darkvisionMask) {
        visionCtx.globalCompositeOperation = 'source-in';
        visionCtx.drawImage(darkvisionMask, 0, 0);
        visionCtx.globalCompositeOperation = 'source-over';
    }

    return visionMaskCanvas;
}
