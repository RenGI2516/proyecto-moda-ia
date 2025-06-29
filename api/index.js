// api/index.js - Nuestro backend/puente seguro

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors()); // Permite solicitudes desde cualquier origen
app.use(express.json({ limit: '10mb' })); // Aumenta el límite para las imágenes

// La clave de API vive aquí, segura en el backend.
const PIXELCUT_API_KEY = 'sk_a4e2fe62047342098487c05c508f7ad9';

// La única ruta que necesitamos. Vercel la convertirá en una "función serverless".
app.post('/api/try-on', async (req, res) => {
    console.log('Solicitud recibida en el backend /api/try-on');

    try {
        const { model_image_base64, garment_image_base64 } = req.body;

        if (!model_image_base64 || !garment_image_base64) {
            return res.status(400).json({ error: 'Faltan datos de imagen en la solicitud.' });
        }

        const targetUrl = 'https://api.pixelcut.ai/v1/try-on';

        const pixelcutResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': PIXELCUT_API_KEY,
            },
            body: JSON.stringify({
                model_image: { base64: model_image_base64 },
                garment_image: { base64: garment_image_base64 },
                prompt: "Fotografía de producto, fondo de estudio limpio y neutro."
            }),
        });
        
        // Manejo de la respuesta de Pixelcut
        if (!pixelcutResponse.ok) {
            const errorBody = await pixelcutResponse.json();
            console.error('Error desde la API de Pixelcut:', errorBody);
            return res.status(pixelcutResponse.status).json(errorBody);
        }

        // Si la respuesta es exitosa, es la imagen. La reenviamos al frontend.
        const imageBuffer = await pixelcutResponse.buffer();
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (error) {
        console.error('Error catastrófico en el servidor backend:', error);
        res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
    }
});

// Esto es para que Vercel pueda usar el router de Express.
module.exports = app;
