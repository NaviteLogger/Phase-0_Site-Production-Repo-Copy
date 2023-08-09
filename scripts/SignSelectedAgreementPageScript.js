document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});

document.getElementById('clearDrawing').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

const image = new Image();
image.src = '/SelectedAgreementImage';
image.onload = () => {
    console.log('Image loaded');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

document.getElementById('submitSignature').addEventListener('click', () => {
    const dataURL = canvas.toDataURL();

    //Send this to the server
    fetch('/submitSignedSelectedAgreement', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: dataURL })
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status === 'success') {
            alert('Signature saved successfully!');
            setTimeout(() => {
                window.location.href = '/summaryPage';
              }, 1500); //Redirect to the clients portal page after 1,5 seconds      
        } else {
            alert('Failed to save the signature.');
        }
    }).catch((error) => {
        console.error('Error:', error);
    });
});
