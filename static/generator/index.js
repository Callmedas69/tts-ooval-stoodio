const canvas = document.getElementById("meme-canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const fistImageTemplate = createImage("./fist.png");
const laserImageTemplate = createImage("./laser.png");

let canvasImage = new Image();
let fists = [];
let lasers = [];
let isDragging = false;
let currentElement = null;
let offsetX, offsetY;

canvas.width = 350;
canvas.height = 350;

document.getElementById("image-upload").addEventListener("change", handleImageUpload);
document.getElementById("add-fist-button").addEventListener("click", () => addElement(fistImageTemplate, fists));
document.getElementById("add-laser-button").addEventListener("click", () => addElement(laserImageTemplate, lasers));
document.getElementById("resize-fist-slider").addEventListener("input", (e) => debounce(resizeElements, 50)(e, fists));
document.getElementById("rotate-fist-slider").addEventListener("input", (e) => debounce(rotateElements, 50)(e, fists));
document.getElementById("resize-laser-slider").addEventListener("input", (e) => debounce(resizeElements, 50)(e, lasers));
document.getElementById("rotate-laser-slider").addEventListener("input", (e) => debounce(rotateElements, 50)(e, lasers));
document.getElementById("delete-fist-button").addEventListener("click", () => deleteLastElement(fists));
document.getElementById("delete-laser-button").addEventListener("click", () => deleteLastElement(lasers));
document.getElementById("reset-button").addEventListener("click", resetCanvas);
document.getElementById("download-button").addEventListener("click", downloadCanvas);

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd);

function createImage(src) {
    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    return img;
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            displayButtonContainer();
            canvasImage.onload = () => drawCanvasImage(event.target.result);
            canvasImage.onerror = () => console.error('Failed to load image');
            canvasImage.src = event.target.result;
        };
        reader.onerror = () => console.error('Failed to read file');
        reader.readAsDataURL(file);
    } else {
        console.warn('No file selected');
    }
}

function displayButtonContainer() {
    const buttonContainer = document.getElementById("button-container");
    buttonContainer.style.display = "flex";
}

function drawCanvasImage(src) {
    const scale = Math.min(canvas.width / canvasImage.width, canvas.height / canvasImage.height);
    const scaledWidth = canvasImage.width * scale;
    const scaledHeight = canvasImage.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    canvasImage.width = scaledWidth;
    canvasImage.height = scaledHeight;
    clearCanvas();
    ctx.drawImage(canvasImage, x, y, scaledWidth, scaledHeight);
    drawCanvas();
}

function addElement(template, elementsArray) {
    const element = {
        image: template,
        width: (canvas.width / 5) * 3,
        height: (canvas.height / 5) * 3,
        x: canvas.width / 2 - (canvas.width / 5) * 3 / 2,
        y: canvas.height / 2 - (canvas.height / 5) * 3 / 2,
        rotation: 0,
    };
    elementsArray.push(element);
    drawCanvas();
}

function resizeElements(e, elementsArray) {
    const scale = e.target.value;
    elementsArray.forEach(element => {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        element.width = (canvas.width / 5) * scale * 2;
        element.height = (canvas.height / 5) * scale * 2;
        element.x = centerX - element.width / 2;
        element.y = centerY - element.height / 2;
    });
    drawCanvas();
}

function rotateElements(e, elementsArray) {
    const rotation = (e.target.value * Math.PI) / 180;
    elementsArray.forEach(element => {
        element.rotation = rotation;
    });
    drawCanvas();
}

function deleteLastElement(elementsArray) {
    elementsArray.pop();
    drawCanvas();
}

function resetCanvas() {
    fists = [];
    lasers = [];
    drawCanvas();
}

function downloadCanvas() {
    const imageDataUrl = canvas.toDataURL();
    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = "fist-studio.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    drawCanvas();
}

function handleMouseDown(e) {
    const { mouseX, mouseY } = getMousePosition(e);
    currentElement = findElement(mouseX, mouseY);

    if (currentElement) {
        isDragging = true;
        offsetX = mouseX - currentElement.x;
        offsetY = mouseY - currentElement.y;
        currentElement.isDragging = true;
    }
}

function handleMouseMove(e) {
    if (isDragging && currentElement) {
        const { mouseX, mouseY } = getMousePosition(e);
        currentElement.x = mouseX - offsetX;
        currentElement.y = mouseY - offsetY;
        drawCanvas();
    }
}

function handleMouseUp() {
    if (currentElement) {
        currentElement.isDragging = false;
        isDragging = false;
        currentElement = null;
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const { mouseX, mouseY } = getTouchPosition(e);
    currentElement = findElement(mouseX, mouseY);

    if (currentElement) {
        isDragging = true;
        offsetX = mouseX - currentElement.x;
        offsetY = mouseY - currentElement.y;
        currentElement.isDragging = true;
    }
}

function handleTouchMove(e) {
    if (isDragging && currentElement) {
        e.preventDefault();
        const { mouseX, mouseY } = getTouchPosition(e);
        currentElement.x = mouseX - offsetX;
        currentElement.y = mouseY - offsetY;
        drawCanvas();
    }
}

function handleTouchEnd() {
    if (currentElement) {
        currentElement.isDragging = false;
        isDragging = false;
        currentElement = null;
    }
}

function getMousePosition(e) {
    return { mouseX: e.offsetX, mouseY: e.offsetY };
}

function getTouchPosition(e) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        mouseX: (touch.clientX - rect.left) * scaleX,
        mouseY: (touch.clientY - rect.top) * scaleY,
    };
}

function findElement(mouseX, mouseY) {
    return fists.concat(lasers).find(element =>
        mouseX > element.x &&
        mouseX < element.x + element.width &&
        mouseY > element.y &&
        mouseY < element.y + element.height
    );
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCanvas() {
    clearCanvas();
    if (canvasImage.src) {
        ctx.drawImage(canvasImage, 0, 0, canvasImage.width, canvasImage.height);
    }
    applyGradientMapFilter();

    drawElements(fists);
    drawElements(lasers);
}

function drawElements(elementsArray) {
    elementsArray.forEach(element => {
        ctx.save();
        ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        ctx.rotate(element.rotation);
        ctx.drawImage(element.image, -element.width / 2, -element.height / 2, element.width, element.height);
        ctx.restore();
    });
}

function applyGradientMapFilter() {
    // Implement gradient mapping logic if needed.
}

// Debounce function to limit the rate at which a function is executed
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}