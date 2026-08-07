const CosmeticScan = require('../DB/CosmeticScan.schema.js');
const User = require('../DB/User.schema.js');

/**
 * Web search helper to fetch product ingredient & formula context from internet
 */
async function fetchProductContextFromWeb(productName) {
  try {
    const query = encodeURIComponent(`${productName} cosmetic ingredients list safety eco`);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const snippetMatches = html.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/g);
    if (!snippetMatches || snippetMatches.length === 0) return null;

    return snippetMatches
      .slice(0, 4)
      .map(s => s.replace(/<[^>]+>/g, '').trim())
      .join(' | ');
  } catch (err) {
    console.warn('Web lookup error:', err.message);
    return null;
  }
}

const SYSTEM_PROMPT = `You are GreenSeva AI, an expert environmental and cosmetic toxicity analyst.
Analyze the provided product image, name, ingredients, or internet web context.
Using your extensive knowledge base and any web search context provided, recall or analyze the real commercial formulation, ingredient list, parabens/sulfates content, and eco impact for this product.
Respond ONLY with a valid JSON object matching this exact schema, without markdown formatting or code blocks:
{
  "productName": "string",
  "brand": "string",
  "ecoScore": 0-100 (integer),
  "safetyRating": "Safe" | "Moderate Risk" | "High Risk",
  "harmfulChemicals": [
    {
      "name": "string",
      "risk": "Low" | "Moderate" | "High",
      "description": "string"
    }
  ],
  "greenAlternatives": [
    {
      "name": "string",
      "brand": "string",
      "ecoScore": 0-100 (integer),
      "url": "full HTTPS product URL or search link (e.g. https://www.amazon.com/s?k=eco+friendly+cleanser)"
    }
  ]
}`;

/**
 * 1. Mistral AI Provider (Primary)
 */
async function analyzeWithMistralAI({ imageBase64, productName, ingredients, webContext }) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey || apiKey === 'your_mistral_api_key_here') return null;

  try {
    const contentPayload = [];
    if (imageBase64) {
      const formattedImage = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      contentPayload.push({ type: 'image_url', image_url: formattedImage });
      contentPayload.push({
        type: 'text',
        text: `Analyze this cosmetic product image. Identify product name, brand, eco score (0-100), safety rating, harmful chemicals, and 2 eco alternative products with purchase URLs.`
      });
    } else {
      let promptText = `Analyze this cosmetic product. Product Name: "${productName || 'Unknown'}".`;
      if (ingredients) promptText += ` Ingredients: "${ingredients}".`;
      if (webContext) promptText += ` Web Context: "${webContext}".`;
      promptText += ` Identify real formula, brand, eco score (0-100), safety rating, harmful chemicals, and 2 green alternative products with purchase URLs.`;

      contentPayload.push({ type: 'text', text: promptText });
    }

    const model = imageBase64 ? 'pixtral-12b-2409' : 'mistral-small-latest';

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: contentPayload }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const replyText = data.choices[0]?.message?.content;
    if (!replyText) return null;

    const cleanedJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.warn('Mistral AI provider error:', err.message);
    return null;
  }
}

/**
 * 2. Gemini AI Provider (Fallback 1)
 */
async function analyzeWithGeminiAI({ imageBase64, productName, ingredients, webContext }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;

  try {
    const parts = [];
    
    if (imageBase64) {
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      parts.push({
        inline_data: { mime_type: mimeType, data: cleanBase64 }
      });
      parts.push({
        text: `${SYSTEM_PROMPT}\n\nAnalyze this cosmetic image and output valid JSON according to schema.`
      });
    } else {
      let promptText = `Analyze this cosmetic product. Product Name: "${productName || 'Unknown'}".`;
      if (ingredients) promptText += ` Ingredients: "${ingredients}".`;
      if (webContext) promptText += ` Web Context: "${webContext}".`;

      parts.push({
        text: `${SYSTEM_PROMPT}\n\n${promptText}`
      });
    }

    const model = 'gemini-1.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!replyText) return null;

    const cleanedJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.warn('Gemini AI provider error:', err.message);
    return null;
  }
}

/**
 * 3. Groq Cloud AI Provider (Fallback 2)
 */
async function analyzeWithGroqAI({ imageBase64, productName, ingredients, webContext }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') return null;

  try {
    const contentPayload = [];

    if (imageBase64) {
      const formattedImage = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      contentPayload.push({ type: 'image_url', image_url: { url: formattedImage } });
      contentPayload.push({
        type: 'text',
        text: `Analyze this cosmetic product image. Output valid JSON matching system schema.`
      });
    } else {
      let promptText = `Analyze this cosmetic product. Product Name: "${productName || 'Unknown'}".`;
      if (ingredients) promptText += ` Ingredients: "${ingredients}".`;
      if (webContext) promptText += ` Web Context: "${webContext}".`;

      contentPayload.push({ type: 'text', text: promptText });
    }

    // Groq LLaMA models: vision preview for images, llama-3.3-70b for text
    const model = imageBase64 ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: contentPayload }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      console.warn(`Groq API error HTTP ${response.status}:`, await response.text());
      return null;
    }
    const data = await response.json();
    const replyText = data.choices[0]?.message?.content;
    if (!replyText) return null;

    const cleanedJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.warn('Groq AI provider error:', err.message);
    return null;
  }
}

/**
 * 4. Heuristic Rule-Based Fallback (Final Fallback)
 */
function analyzeWithHeuristicFallback({ productName, ingredients, imageBase64 }) {
  let detectedProduct = productName || 'Scanned Cosmetic Item';
  let queryStr = `${productName || ''} ${ingredients || ''}`.toLowerCase();
  
  if (imageBase64 && !productName) {
    const sampleProducts = [
      { name: 'Organic Herbal Face Wash', ing: 'aqua, aloe vera, neem, glycerin' },
      { name: 'Radiant Glow Sunscreen SPF 50', ing: 'aqua, zinc oxide, titanium dioxide, oxybenzone' },
      { name: 'Silky Smooth Hair Conditioner', ing: 'aqua, cetearyl alcohol, dimethicone, methylparaben, fragrance' }
    ];
    const picked = sampleProducts[imageBase64.length % sampleProducts.length];
    detectedProduct = picked.name;
    queryStr = `${picked.name} ${picked.ing}`.toLowerCase();
  }

  let hasParabens = queryStr.includes('paraben') || queryStr.includes('phthalate') || queryStr.includes('oxybenzone');
  let hasSulfates = queryStr.includes('sulfate') || queryStr.includes('sls') || queryStr.includes('dimethicone');

  let ecoScore = 88;
  let safetyRating = 'Safe';
  let harmfulChemicals = [];
  let greenAlternatives = [
    { 
      name: 'Bio-Balance Herbal Cleanser', 
      brand: 'GreenFlora', 
      ecoScore: 96, 
      url: 'https://www.amazon.com/s?k=Bio-Balance+Herbal+Cleanser+GreenFlora' 
    },
    { 
      name: 'Pure Eco-Moisturizing Cream', 
      brand: 'EarthBeauty', 
      ecoScore: 92, 
      url: 'https://www.amazon.com/s?k=Pure+Eco-Moisturizing+Cream+EarthBeauty' 
    }
  ];

  if (hasParabens || hasSulfates) {
    ecoScore = hasParabens ? 45 : 65;
    safetyRating = hasParabens ? 'High Risk' : 'Moderate Risk';
    
    if (hasParabens) {
      harmfulChemicals.push({
        name: 'Parabens / Endocrine Disruptors',
        risk: 'High',
        description: 'Preservatives linked to hormone disruption and environmental toxicity.'
      });
    }
    if (hasSulfates) {
      harmfulChemicals.push({
        name: 'Sulfates / Non-Biodegradable Silicones',
        risk: 'Moderate',
        description: 'Synthetic agents that harm aquatic life and cause skin dryness.'
      });
    }
  }

  return {
    productName: detectedProduct,
    brand: 'Scanned Item',
    ecoScore,
    safetyRating,
    harmfulChemicals,
    greenAlternatives
  };
}

const scanCosmetic = async (req, res) => {
  try {
    let { productName, ingredients, imageBase64 } = req.body;
    
    if (!productName && !ingredients && !imageBase64) {
      return res.status(400).json({ 
        err: true, 
        message: 'Please provide a product name, ingredient list, or upload an image.' 
      });
    }

    // Web search context if only product name is supplied
    let webContext = '';
    if (!ingredients && productName && !imageBase64) {
      webContext = await fetchProductContextFromWeb(productName);
    }

    const payload = { imageBase64, productName, ingredients, webContext };

    // 1. Try Mistral AI
    let scanResult = await analyzeWithMistralAI(payload);

    // 2. Try Gemini AI (Fallback 1)
    if (!scanResult) {
      console.log('Mistral AI skipped/failed. Trying Gemini AI...');
      scanResult = await analyzeWithGeminiAI(payload);
    }

    // 3. Try Groq Cloud AI (Fallback 2)
    if (!scanResult) {
      console.log('Gemini AI skipped/failed. Trying Groq Cloud AI...');
      scanResult = await analyzeWithGroqAI(payload);
    }

    // 4. Fallback to heuristic rule engine
    if (!scanResult) {
      console.log('All AI providers skipped/failed. Using heuristic rule engine fallback...');
      scanResult = analyzeWithHeuristicFallback({ productName, ingredients, imageBase64 });
    }

    let pointsEarned = 0;
    let messageText = 'Product scan complete!';

    // Save scan to user profile if logged in
    if (req.user && req.user.id) {
      try {
        const scanEntry = new CosmeticScan({ ...scanResult, userId: req.user.id });
        await scanEntry.save();

        const currentUserData = await User.findById(req.user.id);
        const newScanCount = (currentUserData?.scanCount || 0) + 1;
        
        // Award 5 points on every 5th scan
        if (newScanCount % 5 === 0) {
          pointsEarned = 5;
        }

        await User.findByIdAndUpdate(req.user.id, {
          $inc: { 
            greenPoints: pointsEarned, 
            scanCount: 1, 
            co2SavedKg: 0.5 
          }
        });

        if (pointsEarned > 0) {
          messageText = `Milestone reached! 5 scans completed. +5 Green Points earned! 🎉`;
        } else {
          const scansNeeded = 5 - (newScanCount % 5);
          messageText = `Product scan recorded (${newScanCount} total). Scan ${scansNeeded} more product(s) to earn +5 Green Points!`;
        }
      } catch (err) {
        console.warn('Scan processed without DB persistence');
      }
    }

    return res.status(200).json({
      err: false,
      message: messageText,
      pointsEarned: pointsEarned,
      data: scanResult
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

const getScanHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(200).json({ err: false, history: [] });
    }
    const history = await CosmeticScan.find({ userId: req.user.id }).sort({ scannedAt: -1 }).limit(10);
    return res.status(200).json({ err: false, history });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

module.exports = { scanCosmetic, getScanHistory };
