const { sendEvent } = require('../utils/kafka');
const SymptomCheck = require('../models/SymptomCheck');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// ───── Expanded Symptom Mappings with Urgency Levels ─────
const symptomMappings = [
  {
    keywords: ['chest pain', 'palpitations', 'shortness of breath', 'heart racing', 'tightness in chest'],
    specialty: 'Cardiologist',
    urgency: 'high',
    suggestions: 'Please avoid strenuous activity and seek immediate medical attention if pain persists or radiates to the arm, jaw, or neck. Monitor your blood pressure if possible.'
  },
  {
    keywords: ['cough', 'fever', 'sore throat', 'cold', 'flu', 'runny nose', 'body aches', 'chills'],
    specialty: 'General Physician',
    urgency: 'low',
    suggestions: 'Rest well, stay hydrated, and monitor your temperature. If fever exceeds 102°F (39°C) or symptoms persist beyond 3 days, consult a doctor.'
  },
  {
    keywords: ['rash', 'itching', 'skin', 'redness', 'acne', 'eczema', 'hives', 'blisters'],
    specialty: 'Dermatologist',
    urgency: 'low',
    suggestions: 'Avoid scratching the affected area. You may apply a soothing calamine lotion, but consult a specialist for a proper diagnosis. Keep the area clean and dry.'
  },
  {
    keywords: ['headache', 'dizziness', 'seizure', 'numbness', 'tingling', 'memory loss', 'confusion', 'fainting'],
    specialty: 'Neurologist',
    urgency: 'medium',
    suggestions: 'Monitor the frequency and intensity of symptoms. Ensure adequate sleep and reduce screen time. Seek immediate care if you experience sudden severe headache, loss of consciousness, or seizures.'
  },
  {
    keywords: ['stomach pain', 'nausea', 'vomiting', 'bloating', 'diarrhea', 'constipation', 'acid reflux', 'heartburn'],
    specialty: 'Gastroenterologist',
    urgency: 'medium',
    suggestions: 'Eat light, bland meals and stay hydrated. Avoid spicy, greasy, or acidic foods until symptoms subside. Seek immediate care if you notice blood in stool or vomit.'
  },
  {
    keywords: ['joint pain', 'back pain', 'muscle ache', 'fracture', 'sprain', 'swelling in joints', 'stiffness'],
    specialty: 'Orthopedic',
    urgency: 'medium',
    suggestions: 'Apply cold or warm compresses as needed. Avoid heavy lifting and consider gentle stretching. If pain is severe or follows an injury, seek medical evaluation.'
  },
  {
    keywords: ['ear pain', 'hearing loss', 'tinnitus', 'sinus', 'nasal congestion', 'nosebleed', 'throat infection', 'hoarseness'],
    specialty: 'ENT Specialist',
    urgency: 'low',
    suggestions: 'Avoid loud noises if experiencing ear issues. Use saline nasal sprays for congestion. If symptoms persist or worsen, consult an ENT specialist.'
  },
  {
    keywords: ['blurred vision', 'eye pain', 'red eyes', 'watery eyes', 'vision loss', 'floaters', 'sensitivity to light'],
    specialty: 'Ophthalmologist',
    urgency: 'medium',
    suggestions: 'Avoid straining your eyes with screens. If you experience sudden vision changes or eye pain, seek immediate medical attention.'
  },
  {
    keywords: ['anxiety', 'depression', 'insomnia', 'panic attacks', 'mood swings', 'stress', 'suicidal thoughts', 'hallucinations'],
    specialty: 'Psychiatrist',
    urgency: 'high',
    suggestions: 'Please reach out to a mental health professional. If you are experiencing suicidal thoughts, contact a crisis helpline immediately. You are not alone.'
  },
  {
    keywords: ['urinary pain', 'frequent urination', 'blood in urine', 'kidney pain', 'urinary incontinence'],
    specialty: 'Urologist',
    urgency: 'medium',
    suggestions: 'Increase water intake and avoid caffeine. If you notice blood in urine or severe pain, seek medical attention promptly.'
  },
  {
    keywords: ['wheezing', 'asthma', 'persistent cough', 'difficulty breathing', 'bronchitis', 'chest congestion'],
    specialty: 'Pulmonologist',
    urgency: 'high',
    suggestions: 'Avoid exposure to smoke, dust, and allergens. If you experience severe difficulty breathing, use your inhaler if prescribed and seek emergency care.'
  },
  {
    keywords: ['diabetes', 'excessive thirst', 'frequent hunger', 'weight changes', 'thyroid', 'hormonal imbalance', 'fatigue'],
    specialty: 'Endocrinologist',
    urgency: 'medium',
    suggestions: 'Monitor your blood sugar levels regularly. Maintain a balanced diet and regular exercise. Consult a specialist for hormone-related symptoms.'
  },
  {
    keywords: ['severe bleeding', 'unconscious', 'stroke', 'heart attack', 'poisoning', 'choking', 'anaphylaxis', 'severe burn'],
    specialty: 'Emergency Medicine',
    urgency: 'emergency',
    suggestions: 'CALL EMERGENCY SERVICES IMMEDIATELY (1990 in Sri Lanka, 911 in US). Do not delay seeking help. If someone is unconscious, check for breathing and begin CPR if trained.'
  }
];

// Determine the highest urgency level from matches
const urgencyOrder = { low: 0, medium: 1, high: 2, emergency: 3 };
const getHighestUrgency = (matches) => {
  let highest = 'low';
  for (const match of matches) {
    if (urgencyOrder[match.urgency] > urgencyOrder[highest]) {
      highest = match.urgency;
    }
  }
  return highest;
};

// ───── Analyze Symptoms (Multi-Match) ─────
exports.analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms, patientId } = req.body;
    if (!symptoms) return res.status(400).json({ message: 'Symptoms are required' });

    let matchedResults = [];
    let overallUrgency = 'low';
    let aiSummary = '';
    const input = symptoms.toLowerCase();

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('No Gemini API key provided');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const prompt = `
      You are a specialized medical triage AI assistant. A patient has described the following symptoms:
      "${symptoms}"

      Analyze the symptoms and provide recommendations. Your response MUST be valid JSON matching this exact structure:
      {
        "aiSummary": "A helpful, empathetic summary of what these symptoms might indicate and general advice (2-3 sentences max).",
        "overallUrgency": "low" | "medium" | "high" | "emergency",
        "results": [
          {
            "specialty": "Name of the recommended medical specialty (e.g., Cardiologist, General Physician)",
            "urgency": "low" | "medium" | "high" | "emergency",
            "suggestions": "Specific advice for this specialty (1-2 sentences).",
            "matchedKeywords": ["list", "of", "extracted", "symptoms"]
          }
        ]
      }
      
      Rules:
      1. ONLY return the raw JSON object. Do not include markdown codeblocks (\`\`\`json) or any other text before or after the JSON.
      2. If symptoms are life-threatening (chest pain, stroke signs, severe bleeding, unconsciousness, etc.), set overallUrgency to "emergency".
      3. If no specific specialty is needed, recommend "General Physician".
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Remove markdown codeblock formatting if the model still includes it
      const jsonString = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(jsonString);

      matchedResults = parsedData.results || [];
      overallUrgency = parsedData.overallUrgency || 'low';
      aiSummary = parsedData.aiSummary || '';
      
    } catch (aiError) {
      console.warn('Gemini API failed or not configured, falling back to local keyword matching:', aiError.message);
      
      // Multi-specialty matching fallback
      for (const mapping of symptomMappings) {
        const matchedKeywords = mapping.keywords.filter(keyword => input.includes(keyword));
        if (matchedKeywords.length > 0) {
          matchedResults.push({
            specialty: mapping.specialty,
            suggestions: mapping.suggestions,
            urgency: mapping.urgency,
            matchedKeywords: matchedKeywords
          });
        }
      }

      if (matchedResults.length === 0) {
        matchedResults.push({
          specialty: 'General Physician',
          suggestions: 'Based on your symptoms, we recommend consulting a General Physician for a thorough evaluation. Take rest and monitor your health closely.',
          urgency: 'low',
          matchedKeywords: []
        });
      }

      overallUrgency = getHighestUrgency(matchedResults);
      aiSummary = 'Based on the keywords in your symptoms, we have provided some preliminary specialty recommendations below.';
    }

    // Persist to MongoDB
    const symptomCheck = new SymptomCheck({
      patientId: patientId || null,
      symptoms: input,
      results: matchedResults.map(r => ({ specialty: r.specialty, suggestions: r.suggestions, urgency: r.urgency })),
      overallUrgency: overallUrgency
    });
    await symptomCheck.save();

    // Emit Kafka event
    await sendEvent('symptom-events', {
      type: 'SYMPTOM_CHECK_PERFORMED',
      checkId: symptomCheck._id,
      symptoms: input,
      detectedSpecialties: matchedResults.map(r => r.specialty),
      urgency: overallUrgency,
      patientId: patientId || null,
      timestamp: new Date()
    });

    res.status(200).json({
      results: matchedResults,
      overallUrgency: overallUrgency,
      aiSummary: aiSummary,
      disclaimer: 'This is a preliminary AI-powered suggestion and not a formal medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.',
      checkId: symptomCheck._id
    });
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ message: error.message });
  }
};

// ───── Get Symptom History ─────
exports.getHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const history = await SymptomCheck.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(20);

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
