document.getElementById('clearDrawing').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
});

const maxPages = parseInt(document.body.getAttribute('data-number-of-pages'), 10);

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < maxPages - 1) {
        signatures[currentPage] = canvas.toDataURL('image/jpeg', 1.0);

        console.log("Image Data URL:", signatures[currentPage]);

        currentPage++;
        loadImage();
        //updatePageDisplay();
    }
});

document.getElementById('previousPage').addEventListener('click', () => {
    if (currentPage > 0) {
        signatures[currentPage] = canvas.toDataURL('image/jpeg', 1.0);

        console.log("Image Data URL:", signatures[currentPage]);

        currentPage--;
        loadImage();
        //updatePageDisplay();
    }
});

const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

let currentPage = 0;
var image = new Image();

let signatures = [];

function loadImage() {
    // Load the agreement image
    image.src = '/SelectedAgreementImage/' + currentPage;
    image.onload = () => {
        console.log('Image loaded');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Redraw the signature if it exists for the current page
        if (signatures[currentPage]) {
            let signatureImage = new Image();
            signatureImage.src = signatures[currentPage];
            signatureImage.onload = () => {
                ctx.drawImage(signatureImage, 0, 0, canvas.width, canvas.height);
            }
        }
    }
}

canvas.addEventListener('mousedown', () => {
    isDrawing = true;
    ctx.beginPath();
});

canvas.addEventListener('mousemove', event => {
    if (!isDrawing) return;
    draw(event);
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.closePath();
});

canvas.addEventListener('touchstart', event => {
    isDrawing = true;
    ctx.beginPath();
});

canvas.addEventListener('touchmove', event => {
    if (!isDrawing) return;
    const touch = event.touches[0];
    draw(touch);
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
    ctx.closePath();
});

function draw(event) {
    const position = getCursorPosition(canvas, event);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.lineTo(position.x, position.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
}

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
}

document.getElementById('submitAllSignatures').addEventListener('click', () => {
    signatures[currentPage] = canvas.toDataURL('image/jpeg', 1.0);

    if (signatures.length < maxPages) {
        alert('Please sign all pages before submitting.');
        return;
    }

    sendAllSignatures();
});

function sendAllSignatures() {
    const compressedData = pako.deflate(JSON.stringify(signatures), { to: 'string' });

    fetch('/submitAllSignedSelectedAgreements', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: compressedData
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status === 'success') {
            alert('All signatures saved successfully!');
            setTimeout(() => {
                window.location.href = '/summaryPage';
            }, 1500);
        } else {
            alert('Failed to save the signatures.');
        }
    }).catch((error) => {
        console.error('Error:', error);
    });
}

loadImage();