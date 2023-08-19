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

var currentIndex = 0;

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
    console.log("Signatures array:", signatures);

    if (signatures.length < maxPages) {
        alert('Proszę podpisać wszystkie strony (jeśli nie ma wyznaczonego miejsca to na dole strony).');
        return;
    }

    for (let i = 0; i < signatures.length; i++) {
        console.log(`Signature ${i + 1} Length: ${signatures[i].length}`);
    }    

    sendNextSignature();
});

function sendNextSignature() {
    let totalUploadedImages = signatures.length;

    if(currentIndex >= signatures.length) {
        // All signatures have been sent. Notify server to finalize processing.
        fetch('/mergeSelectedAgreement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ totalUploadedImages: totalUploadedImages })
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                alert('Wszystkie podpisy zostały pomyślnie zapisane!');
                setTimeout(() => {
                    window.location.href = '/displayInterview';  // Redirect to the home page
                }, 1000);
            } else {
                console.error('Failed to process signatures.');
            }
        }).catch((error) => {
            console.error('Error:', error);
        });
        return;
    }

    fetch('/uploadSelectedAgreementSignature', {  // Updated the endpoint name here
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: signatures[currentIndex], pageIndex: currentIndex })
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status === 'success') {
            console.log(`Signature ${currentIndex + 1} uploaded successfully!`);
            currentIndex++;
            sendNextSignature();  // Recursive call to send the next signature
        } else {
            console.error(`Failed to upload signature ${currentIndex + 1}.`);
        }
    }).catch((error) => {
        console.error('Error:', error);
    });
}

loadImage();