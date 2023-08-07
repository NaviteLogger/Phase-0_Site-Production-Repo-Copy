document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});

const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

const image = new Image();
image.src = '<%= agreementImage %>';
image.onload = () => {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

canvas.addEventListener('mousedown', () => {
    if (isDrawing) {
        ctx.beginPath();
    }
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

document.getElementById('startDrawing').addEventListener('click', () => {
    isDrawing = true;
});

document.getElementById('stopDrawing').addEventListener('click', () => {
    isDrawing = false;
});

document.getElementById('clearDrawing').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
});

document.getElementById('submitSignature').addEventListener('click', () => {
    const dataURL = canvas.toDataURL();
    // Here you can send the dataURL (base64 representation of canvas) to server or handle accordingly.
});

function draw(event) {
    if (!isDrawing) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
}