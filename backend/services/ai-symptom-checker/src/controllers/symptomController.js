const { sendEvent } = require('../utils/kafka');

const symptomMappings = [
  {
    keywords: ['chest pain', 'palpitations', 'shortness of breath'],
    specialty: 'Cardiologist',
    suggestions: 'Please avoid strenuous activity and seek immediate medical attention if pain persists or radiates to the arm/neck.'
  },
  {
    keywords: ['cough', 'fever', 'sore throat', 'cold', 'flu'],
    specialty: 'General Physician',
    suggestions: 'Rest well, stay hydrated, and monitor your temperature. If fever exceeds 102°F, consult a doctor.'
  },
  {
    keywords: ['rash', 'itching', 'skin', 'redness'],
    specialty: 'Dermatologist',
    suggestions: 'Avoid scratching the affected area. You may apply a soothing calamine lotion, but consult a specialist for a proper diagnosis.'
  },
  {
    keywords: ['headache', 'dizziness', 'seizure', 'numbness'],
    specialty: 'Neurologist',
    suggestions: 'Monitor the frequency and intensity of headaches. Ensure adequate sleep and reduce screen time.'
  },
  {
    keywords: ['stomach pain', 'nausea', 'vomiting', 'bloating'],
    specialty: 'Gastroenterologist',
    suggestions: 'Eat light, bland meals and stay hydrated. Avoid spicy or greasy foods until symptoms subside.'
  },
  {
    keywords: ['joint pain', 'back pain', 'muscle ache'],
    specialty: 'Orthopedic',
    suggestions: 'Apply cold or warm compresses as needed. Avoid heavy lifting and consider gentle stretching.'
  }
];

exports.analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ message: 'Symptoms are required' });

    const input = symptoms.toLowerCase();
    let matchedSpecialty = 'General Physician';
    let matchedSuggestions = 'Take rest and monitor your health. Consult a general physician if symptoms persist.';

    for (const mapping of symptomMappings) {
      if (mapping.keywords.some(keyword => input.includes(keyword))) {
        matchedSpecialty = mapping.specialty;
        matchedSuggestions = mapping.suggestions;
        break;
      }
    }

    // Emit Kafka event
    await sendEvent('symptom-events', {
      type: 'SYMPTOM_CHECK_PERFORMED',
      symptoms: input,
      detectedSpecialty: matchedSpecialty,
      timestamp: new Date()
    });

    res.status(200).json({
      specialty: matchedSpecialty,
      suggestions: matchedSuggestions,
      disclaimer: 'This is a preliminary AI suggestion and not a formal medical diagnosis. Please consult a qualified healthcare professional.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
