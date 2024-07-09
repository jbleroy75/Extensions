import express from 'express';
import fetch from 'node-fetch';
import multer from 'multer';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const upload = multer();

// Middleware to enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://dashboard.garantme.fr');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // Intercepter les requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);
    formData.append('purpose', 'assistants'); // Assurez-vous que cette valeur est correcte

    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.statusText}, ${errorText}`);
    }

    const result = await response.json();
    console.log('Response from OpenAI:', result); // Log the response for debugging
    res.json(result); // Send the response back to the client
  } catch (error) {
    console.error('Error uploading to OpenAI:', error);
    res.status(500).json({ error: error.message });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

// Route pour l'URL racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'popup.html'));
});
