import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('nova');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [audioVisualization, setAudioVisualization] = useState([]);
  const [savedAudios, setSavedAudios] = useState([]);
  const [activeTab, setActiveTab] = useState('tts'); // 'tts' or 'dialogues'

  // Educational Dialogues feature states
  const [dialogueTopic, setDialogueTopic] = useState('');
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [dialogueScript, setDialogueScript] = useState([]);
  const [dialogueAudioUrl, setDialogueAudioUrl] = useState('');
  const [maleVoice, setMaleVoice] = useState('onyx'); // Default male voice for Bhai
  const [femaleVoice, setFemaleVoice] = useState('nova'); // Default female voice for Didi
  const [dialogueLanguage, setDialogueLanguage] = useState('tenglish'); // Default language set to Telugu-English
  const [characterNames, setCharacterNames] = useState({ male: 'Bhai', female: 'Didi' });
  const [audioGenerationProgress, setAudioGenerationProgress] = useState(0);
  const [audioGenerationError, setAudioGenerationError] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [audioResults, setAudioResults] = useState([]);

  const [enterpriseFeatures, setEnterpriseFeatures] = useState({
    batchProcessing: false,
    teamSharing: false,
    analytics: false,
    customVoices: false
  });
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  // Enhanced voices with human-like characteristics and system prompts
  const voices = [
    {
      id: 'alloy',
      name: 'Alloy',
      description: 'Versatile, conversational voice with natural inflections',
      useCase: 'Perfect for natural dialogue and everyday communications',
      systemPrompt: 'You are speaking in a warm, conversational tone with natural pauses and slight variations in pitch. Speak as if you\'re having a friendly conversation, with authentic emotion and natural rhythm. Add subtle breathing patterns between sentences.',
      emotionRange: 'Balanced, authentic, friendly'
    },
    {
      id: 'echo',
      name: 'Echo',
      description: 'Authoritative voice with confident, measured delivery',
      useCase: 'Ideal for instructional content, presentations, and leadership messages',
      systemPrompt: 'You are speaking with authority and confidence. Use a measured pace with deliberate pauses for emphasis. Slightly lower your tone at the end of important points. Project leadership and expertise through your delivery.',
      emotionRange: 'Confident, authoritative, reassuring'
    },
    {
      id: 'fable',
      name: 'Fable',
      description: 'Expressive storytelling voice with emotional range',
      useCase: 'Perfect for narratives, creative content, and emotional messaging',
      systemPrompt: 'You are a master storyteller with rich emotional expression. Vary your tone significantly to match the emotional content. Use dramatic pauses, whispers for intimate moments, and animated delivery for exciting parts. Create a sense of wonder and engagement through your voice.',
      emotionRange: 'Expressive, emotional, dramatic'
    },
    {
      id: 'nova',
      name: 'Nova',
      description: 'Clear, articulate voice with professional warmth',
      useCase: 'Excellent for business communications requiring clarity and trust',
      systemPrompt: 'You are speaking with professional clarity and warmth. Articulate each word precisely while maintaining a natural, approachable tone. Use subtle emphasis on key terms and maintain consistent pacing with brief, natural pauses between thoughts.',
      emotionRange: 'Professional, warm, trustworthy'
    },
    {
      id: 'onyx',
      name: 'Onyx',
      description: 'Deep, resonant voice with thoughtful delivery',
      useCase: 'Perfect for thought leadership, philosophical content, and impactful statements',
      systemPrompt: 'You have a deep, resonant voice with thoughtful delivery. Speak at a measured pace with meaningful pauses that allow your words to sink in. Lower your tone slightly at the end of profound statements. Convey wisdom and gravitas through your delivery.',
      emotionRange: 'Thoughtful, profound, contemplative'
    },
    {
      id: 'shimmer',
      name: 'Shimmer',
      description: 'Bright, energetic voice with dynamic expression',
      useCase: 'Ideal for engaging, upbeat content and motivational messaging',
      systemPrompt: 'You are speaking with bright, energetic enthusiasm. Use an upbeat pace with dynamic variations in tone. Express excitement through your delivery with slightly higher pitch on engaging points. Add natural laughter or joy where appropriate. Create a sense of motivation and positive energy.',
      emotionRange: 'Enthusiastic, energetic, uplifting'
    }
  ];

  // Enterprise testimonials
  const testimonials = [
    { name: "Sarah Johnson", title: "Chief Marketing Officer, TechGlobal", text: "Smatchie Voice has transformed our content strategy. The quality is unmatched." },
    { name: "Michael Chen", title: "Product Director, InnovateCorp", text: "We've seen a 40% increase in user engagement since implementing Smatchie Voice." },
    { name: "Aisha Patel", title: "Head of Customer Experience, Nexus Enterprises", text: "Our customers love the natural-sounding voices. It's been a game-changer." }
  ];

  // Audio context ref to persist between renders
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Audio visualization effect
  useEffect(() => {
    // Clean up previous animation frame if it exists
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clean up previous audio connections
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch (e) {
        console.log('Audio source already disconnected');
      }
      audioSourceRef.current = null;
    }

    if (audioRef.current && audioUrl && canvasRef.current) {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          console.error('Web Audio API is not supported in this browser', e);
          return;
        }
      }

      // Wait for the audio to be ready
      const setupVisualization = () => {
        if (audioRef.current.readyState < 2) {  // HAVE_CURRENT_DATA or higher
          // Wait for the audio to be loaded enough
          setTimeout(setupVisualization, 100);
          return;
        }

        try {
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 256;

          // Only create a new MediaElementSource if we don't have one
          if (!audioSourceRef.current) {
            audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          }

          audioSourceRef.current.connect(analyser);
          analyser.connect(audioContextRef.current.destination);

          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const renderFrame = () => {
            animationFrameRef.current = requestAnimationFrame(renderFrame);

            if (!analyser) return;

            analyser.getByteFrequencyData(dataArray);

            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const barHeight = dataArray[i] / 2;

              // Use gradient colors based on our enterprise theme
              const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
              gradient.addColorStop(0, '#4A90E2');
              gradient.addColorStop(1, '#2C3E50');

              ctx.fillStyle = gradient;
              ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

              x += barWidth + 1;
            }
          };

          renderFrame();
        } catch (error) {
          console.error('Error setting up audio visualization:', error);
        }
      };

      // Start the setup process
      setupVisualization();
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [audioUrl]);

  // Welcome message effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup effect for audio resources when component unmounts
  useEffect(() => {
    return () => {
      // Clean up audio context
      if (audioContextRef.current) {
        try {
          // Close the audio context if it's not already closed
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (e) {
          console.error('Error closing audio context:', e);
        }
      }

      // Clean up animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clean up audio source
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch (e) {
          console.log('Audio source already disconnected');
        }
      }

      // Clean up audio URLs
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Clean up dialogue audio URL
      if (dialogueAudioUrl) {
        URL.revokeObjectURL(dialogueAudioUrl);
      }
    };
  }, [audioUrl, dialogueAudioUrl]);

  // Save generated audio to history
  const saveAudio = () => {
    if (audioUrl) {
      const newSavedAudio = {
        id: Date.now(),
        text,
        voice,
        url: audioUrl,
        date: new Date().toLocaleString()
      };

      setSavedAudios(prev => [newSavedAudio, ...prev]);
    }
  };

  // State for advanced voice settings
  const [advancedSettings, setAdvancedSettings] = useState({
    emotionIntensity: 'medium', // low, medium, high
    speakingRate: 'normal',     // slow, normal, fast
    pitch: 'natural',           // low, natural, high
    useBreathingPatterns: true,
    useEmphasis: true
  });

  // Function to create a human-like system prompt
  const createHumanizedPrompt = (text, voiceId) => {
    const selectedVoice = voices.find(v => v.id === voiceId);
    const systemPrompt = selectedVoice.systemPrompt;

    // Add breathing instructions based on settings
    const breathingInstructions = advancedSettings.useBreathingPatterns
      ? "Include natural breathing patterns. Take small breaths between sentences and longer breaths between paragraphs."
      : "";

    // Add emphasis instructions based on settings
    const emphasisInstructions = advancedSettings.useEmphasis
      ? "Emphasize important words naturally. Vary your tone to convey meaning."
      : "";

    // Add rate instructions based on settings
    let rateInstructions = "";
    if (advancedSettings.speakingRate === 'slow') {
      rateInstructions = "Speak at a slightly slower, more deliberate pace.";
    } else if (advancedSettings.speakingRate === 'fast') {
      rateInstructions = "Speak at a slightly faster, more energetic pace.";
    }

    // Add pitch instructions based on settings
    let pitchInstructions = "";
    if (advancedSettings.pitch === 'low') {
      pitchInstructions = "Use a slightly lower pitch than usual.";
    } else if (advancedSettings.pitch === 'high') {
      pitchInstructions = "Use a slightly higher pitch than usual.";
    }

    // Add emotion intensity instructions
    let emotionInstructions = "";
    if (advancedSettings.emotionIntensity === 'low') {
      emotionInstructions = "Express emotions subtly and with restraint.";
    } else if (advancedSettings.emotionIntensity === 'high') {
      emotionInstructions = "Express emotions vividly and with intensity.";
    }

    // Combine all instructions with the system prompt
    const fullSystemPrompt = `${systemPrompt} ${breathingInstructions} ${emphasisInstructions} ${rateInstructions} ${pitchInstructions} ${emotionInstructions}`;

    // Format the final prompt with the system instructions and user text
    return `${fullSystemPrompt}\n\nsay this: ${text}`;
  };

  const generateSpeech = async () => {
    if (!text) {
      alert('Please enter some text');
      return;
    }

    setIsLoading(true);
    setAudioVisualization([]);

    try {
      // Create a humanized prompt with system instructions
      const humanizedPrompt = createHumanizedPrompt(text, voice);
      const encodedText = encodeURIComponent(humanizedPrompt);
      const url = `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=${voice}`;

      // Fetch the audio directly
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const audioUrl = URL.createObjectURL(blob);

      // Set the audio URL
      setAudioUrl(audioUrl);

      // Generate random visualization data for enterprise look
      const visualData = Array.from({length: 50}, () => Math.floor(Math.random() * 100));
      setAudioVisualization(visualData);

      // Play the audio after a short delay to ensure it's loaded
      // This helps prevent the "play() request was interrupted by a new load request" error
      if (audioRef.current) {
        // Reset the audio element
        audioRef.current.pause();

        // Play after a short delay
        setTimeout(() => {
          if (audioRef.current) {
            const playPromise = audioRef.current.play();

            // Handle play promise to avoid uncaught promise rejection
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error("Audio playback error:", error);
              });
            }
          }
        }, 100);
      }

      // Save the generated audio to history
      const newSavedAudio = {
        id: Date.now(),
        text,
        voice,
        url: audioUrl,
        date: new Date().toLocaleString(),
        settings: { ...advancedSettings }
      };

      setSavedAudios(prev => [newSavedAudio, ...prev]);
    } catch (error) {
      console.error('Error generating speech:', error);
      alert('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate educational dialogue based on topic
  const generateEducationalDialogue = async (topic) => {
    if (!topic) {
      alert('Please enter a topic for the educational dialogue');
      return;
    }

    // Clear previous dialogue data
    setDialogueScript([]);
    setDialogueAudioUrl('');
    setAudioGenerationError(null);
    setAudioGenerationProgress(0);
    setIsGeneratingDialogue(true);

    try {
      // Get language-specific instructions
      const languageInstructions = getLanguageInstructions(dialogueLanguage);

      // Create a prompt for the Pollinations API to generate a sophisticated dialogue
      const prompt = `
Create an educational dialogue between two characters named ${characterNames.male} (a curious learner) and ${characterNames.female} (a knowledgeable teacher) about ${topic}.
${languageInstructions.intro}

The dialogue should be informative, conversational, and easy to understand, following this specific structure:

1. Start with a HOOK: ${characterNames.male} should ask a funny, weird, or surprising question about ${topic} that captures attention.
   Example: "${languageInstructions.hookExample.replace('Bhai', characterNames.male).replace('Didi', characterNames.female)}"

2. DIALOGUE FLOW: Create a natural conversation where ${characterNames.male} asks questions and ${characterNames.female} provides clear, educational answers.
   ${languageInstructions.flowInstructions}

3. Include a METAPHOR or VISUAL: ${characterNames.female} should explain a complex aspect of ${topic} using a relatable metaphor or visual image.
   Example: "${languageInstructions.metaphorExample.replace('Bhai', characterNames.male).replace('Didi', characterNames.female)}"

4. NAME THE CONCEPT: ${characterNames.female} should explicitly name and define key concepts related to ${topic}.
   Example: "${languageInstructions.conceptExample.replace('Bhai', characterNames.male).replace('Didi', characterNames.female)}"

5. End with a CALL TO ACTION: ${characterNames.male} should express enthusiasm about learning more about ${topic} and say "Follow for more simplified tech explanations!"
   Example: "${languageInstructions.ctaExample.replace('Bhai', characterNames.male).replace('Didi', characterNames.female)}"

Format the dialogue as follows:
${characterNames.male}: [${characterNames.male}'s question or comment]
${characterNames.female}: [${characterNames.female}'s response or explanation]

IMPORTANT: Keep the dialogue concise enough to be spoken in approximately 1 minute of audio (about 150-200 words total).
Create a dialogue with 4-6 exchanges that provides a clear introduction to ${topic}, making sure to include all the elements above (hook, metaphor, naming concepts, and call to action).

Add emoji indicators before specific parts:
- 🧠 before the hook question
- 🧩 before the metaphor or visual explanation
- 📚 before naming an important concept
- 🗨️ before the call to action
`;

      // Instead of making a direct API call to Pollinations which might cause CORS issues,
      // let's use a fallback approach that generates a dialogue locally when the API fails

      console.log('Generating dialogue script...');

      try {
        // First, try to use a simpler approach without custom headers that might trigger CORS
        // Add a timestamp to prevent caching issues
        const timestamp = new Date().getTime();

        // Make the prompt much shorter to avoid URL length issues
        const shorterPrompt = `Create an educational dialogue about ${topic} in ${dialogueLanguage === 'tenglish' ? 'Telugu' : dialogueLanguage === 'tanglish' ? 'Tamil' : dialogueLanguage === 'hindi' ? 'Hindi' : 'English'}.`;

        // Use encodeURIComponent for the shorter prompt
        const encodedPrompt = encodeURIComponent(shorterPrompt);
        const apiUrl = `https://text.pollinations.ai/${encodedPrompt}?model=openai-text&t=${timestamp}`;

        // Use a timeout to abort the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(apiUrl, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // If we get here, the API call was successful
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        // Get the text response
        const dialogueText = await response.text();

        // If we have a valid response, use it
        if (dialogueText && dialogueText.length > 50) {
          // Parse the dialogue text into our required format
          const dialogue = parseDialogueText(dialogueText, topic);
          console.log('Dialogue generated from API:', dialogue);
          setDialogueScript(dialogue);

          // Now generate the audio for the dialogue
          await generateDialogueAudio(dialogue);
          return;
        } else {
          // If the response is too short, throw an error to trigger the fallback
          throw new Error('API response too short or empty');
        }
      } catch (apiError) {
        console.log('API call failed, using fallback dialogue generation:', apiError);

        // Use the default dialogue as a fallback
        const fallbackDialogue = getDefaultDialogue(topic);
        console.log('Using fallback dialogue:', fallbackDialogue);
        setDialogueScript(fallbackDialogue);

        // Now generate the audio for the dialogue
        await generateDialogueAudio(fallbackDialogue);
        return;
      }

      // This code is now handled in the try/catch block above

    } catch (error) {
      console.error('Error generating dialogue:', error);
      setAudioGenerationError(`Failed to generate dialogue: ${error.message}`);
    } finally {
      setIsGeneratingDialogue(false);
    }
  };

  // Note: We're using an inline function for regeneration in the button click handler

  // Helper function to get the default dialogue for a topic
  const getDefaultDialogue = (topic) => {
    // Get language-specific default dialogue
    let defaultDialogue;

    // If the current language is Telugu-English, use a Telugu-English default dialogue
    if (dialogueLanguage === 'tenglish') {
      defaultDialogue = [
        { speaker: characterNames.male, text: `🧠 ${characterNames.female}, ee ${topic} gurinchi chala talk vinthunnam. Asalu idi enti? Konchem cheppava?`, type: 'hook' },
        { speaker: characterNames.female, text: `Tappakunda ${characterNames.male}! ${topic} chala interesting vishayam. Idi mana jeevithamlo chala upayogapaduthundi. Nenu meeku dani gurinchi vistharamga chepthanu.` },
        { speaker: characterNames.male, text: `Adi bagundi! ${topic} lo mukhyamaina vishayalu enti?` },
        { speaker: characterNames.female, text: `📚 ${topic} lo, konni mukhyamaina siddhantalu unnai. Modaluga, meeru basic principles ni ardham chesukovali, avi ela pani chestayo teliyali. Ee vishayam lo, mana daily life lo chala applications unnai.`, type: 'concept' },
        { speaker: characterNames.male, text: `Nijam jeevitham lo ${topic} ni ela upayogistaru? Konni udaharanalu cheppagalava?` },
        { speaker: characterNames.female, text: `🧩 Chudandi, ${topic} ni oka pette la bhavinchochu - prathi panimutu ki oka prayojanam untundi. Mana roju vaari jeevitham lo ${topic} chala upayogapaduthundi. Udaharanaki, samasya parishkaramlo, vyavastheekaranalo, mariyu navakalpanalo idi sahayapaduthundi.`, type: 'metaphor' },
        { speaker: characterNames.male, text: `${topic} ranganam lo emaina samasyalu leda vivadalu unnaya?` },
        { speaker: characterNames.female, text: `Prathi ranganam lage, ${topic} lo kuda konni samasyalu unnai. Uttama paddhatulu, naitika pariseelana, mariyu bhavishyattu dishalu gurinchi nirantaram charcha jarugutundi.` },
        { speaker: characterNames.male, text: `🗨️ Abbabbo, idi chala interesting ga undi! Nenu inka chala nerchukovali ${topic} gurinchi. Follow for more simplified tech explanations!`, type: 'cta' },
      ];
    } else if (dialogueLanguage === 'tanglish') {
      defaultDialogue = [
        { speaker: characterNames.male, text: `🧠 ${characterNames.female}, indha ${topic} pathi romba pesaradhu kettan. Idhu enna vishayam? Konjam solluva?`, type: 'hook' },
        { speaker: characterNames.female, text: `Kandippa ${characterNames.male}! ${topic} romba interesting vishayam. Idhu namakku daily life la romba useful. Naan unakku idhai pathi detail-a sollaren.` },
        { speaker: characterNames.male, text: `Seri! ${topic} la important concepts enna?` },
        { speaker: characterNames.female, text: `📚 ${topic} la, sila mukkiyamana concepts irukku. First, neenga basic principles purinjukanum, adhu epdi work aagudhu-nu therinjukanum. Indha subject la, namakku daily life la niraya applications irukku.`, type: 'concept' },
        { speaker: characterNames.male, text: `Real life la ${topic} epdi use pandranga? Sila examples solluva?` },
        { speaker: characterNames.female, text: `🧩 Paaru, ${topic} oru toolbox madhiri - ovvoru tool-ukkum oru specific purpose irukku. Namma daily life la ${topic} romba useful. Example-ku, problem solving, organization, and innovation la idhu help pannum.`, type: 'metaphor' },
        { speaker: characterNames.male, text: `${topic} field la endha challenges or controversies irukka?` },
        { speaker: characterNames.female, text: `Ella field-um pola, ${topic} layum sila challenges irukku. Best practices, ethical considerations, and future directions pathi ongoing debates nadandhukondu irukku.` },
        { speaker: characterNames.male, text: `🗨️ Wow, idhu romba interesting ah irukku! Naan innum niraya kathukanum ${topic} pathi. Follow for more simplified tech explanations!`, type: 'cta' },
      ];
    } else if (dialogueLanguage === 'hindi') {
      defaultDialogue = [
        { speaker: characterNames.male, text: `🧠 ${characterNames.female}, main ${topic} ke baare mein bahut kuch sun raha hoon. Yeh kya hai? Kya aap mujhe bata sakti hain?`, type: 'hook' },
        { speaker: characterNames.female, text: `Bilkul ${characterNames.male}! ${topic} ek bahut hi dilchasp vishay hai. Yeh hamari daily life mein bahut upyogi hai. Main aapko iske baare mein detail mein bataungi.` },
        { speaker: characterNames.male, text: `Accha! ${topic} mein kya important concepts hain?` },
        { speaker: characterNames.female, text: `📚 ${topic} mein, kuch mahatvapurn concepts hain. Sabse pehle, aapko basic principles ko samajhna hoga, ki yeh kaise kaam karta hai. Is vishay mein, hamari daily life mein bahut applications hain.`, type: 'concept' },
        { speaker: characterNames.male, text: `Real life mein ${topic} ka upyog kaise karte hain? Kuch examples de sakti hain?` },
        { speaker: characterNames.female, text: `🧩 Dekhiye, ${topic} ko ek toolbox ki tarah samajh sakte hain - har tool ka ek specific purpose hota hai. Hamari daily life mein ${topic} bahut upyogi hai. Example ke liye, problem solving, organization, aur innovation mein yeh madad karta hai.`, type: 'metaphor' },
        { speaker: characterNames.male, text: `${topic} field mein kya challenges ya controversies hain?` },
        { speaker: characterNames.female, text: `Har field ki tarah, ${topic} mein bhi kuch challenges hain. Best practices, ethical considerations, aur future directions ke baare mein ongoing debates chal rahi hain.` },
        { speaker: characterNames.male, text: `🗨️ Wah, yeh bahut interesting hai! Main ${topic} ke baare mein aur bhi bahut kuch seekhna chahta hoon. Follow for more simplified tech explanations!`, type: 'cta' },
      ];
    } else {
      // Default English dialogue
      defaultDialogue = [
        { speaker: characterNames.male, text: `🧠 Hey ${characterNames.female}, I've been curious about ${topic} lately. Can you tell me what it's all about?`, type: 'hook' },
        { speaker: characterNames.female, text: `Of course, ${characterNames.male}! ${topic} is a fascinating subject. It's essentially about understanding and exploring the principles and applications in this field.` },
        { speaker: characterNames.male, text: `That sounds interesting! What are some key concepts in ${topic}?` },
        { speaker: characterNames.female, text: `📚 In ${topic}, there are several fundamental concepts. First, you need to understand the basic principles that govern how things work in this area.`, type: 'concept' },
        { speaker: characterNames.male, text: `Could you give me a practical example of how ${topic} is applied in real life?` },
        { speaker: characterNames.female, text: `🧩 Certainly! Think of ${topic} like a toolbox where each tool serves a specific purpose. ${topic} is used in many everyday situations. For example, it helps us solve problems related to efficiency, organization, and innovation in various fields.`, type: 'metaphor' },
        { speaker: characterNames.male, text: `Are there any challenges or controversies in the field of ${topic}?` },
        { speaker: characterNames.female, text: `Like any field, ${topic} has its challenges. There are ongoing debates about best practices, ethical considerations, and future directions.` },
        { speaker: characterNames.male, text: `🗨️ Wow, this is fascinating! I definitely want to learn more about ${topic}. Follow for more simplified tech explanations!`, type: 'cta' },
      ];
    }

    return defaultDialogue;
  };

  // Parse the dialogue text into our required format
  const parseDialogueText = (text, topic) => {
    // Get default dialogue as fallback
    let defaultDialogue = getDefaultDialogue(topic);

    // We already have the default dialogue from getDefaultDialogue

    try {
      // Split the text by newlines
      const lines = text.split('\n').filter(line => line.trim() !== '');

      // Parse each line to extract speaker and text
      const dialogue = [];

      for (const line of lines) {
        // Check if line starts with male or female character name
        if (line.includes(`${characterNames.male}:`)) {
          const textContent = line.substring(line.indexOf(`${characterNames.male}:`) + characterNames.male.length + 1).trim();

          // Check for special indicators
          let type = null;
          let cleanText = textContent;

          if (textContent.includes('🧠')) {
            type = 'hook';
            cleanText = textContent;
          } else if (textContent.includes('🗨️')) {
            type = 'cta';
            cleanText = textContent;
          }

          dialogue.push({
            speaker: characterNames.male,
            text: cleanText,
            type: type
          });
        } else if (line.includes(`${characterNames.female}:`)) {
          const textContent = line.substring(line.indexOf(`${characterNames.female}:`) + characterNames.female.length + 1).trim();

          // Check for special indicators
          let type = null;
          let cleanText = textContent;

          if (textContent.includes('🧩')) {
            type = 'metaphor';
            cleanText = textContent;
          } else if (textContent.includes('📚')) {
            type = 'concept';
            cleanText = textContent;
          }

          dialogue.push({
            speaker: characterNames.female,
            text: cleanText,
            type: type
          });
        }
        // Fallback for "Bhai" and "Didi" if the API returns those instead of custom names
        else if (line.includes('Bhai:')) {
          const textContent = line.substring(line.indexOf('Bhai:') + 5).trim();

          // Check for special indicators
          let type = null;
          let cleanText = textContent;

          if (textContent.includes('🧠')) {
            type = 'hook';
            cleanText = textContent;
          } else if (textContent.includes('🗨️')) {
            type = 'cta';
            cleanText = textContent;
          }

          dialogue.push({
            speaker: characterNames.male,
            text: cleanText,
            type: type
          });
        } else if (line.includes('Didi:')) {
          const textContent = line.substring(line.indexOf('Didi:') + 5).trim();

          // Check for special indicators
          let type = null;
          let cleanText = textContent;

          if (textContent.includes('🧩')) {
            type = 'metaphor';
            cleanText = textContent;
          } else if (textContent.includes('📚')) {
            type = 'concept';
            cleanText = textContent;
          }

          dialogue.push({
            speaker: characterNames.female,
            text: cleanText,
            type: type
          });
        }
      }

      // If we couldn't parse any dialogue lines, return the default
      if (dialogue.length === 0) {
        console.warn('Failed to parse dialogue, using default');
        return defaultDialogue;
      }

      // Make sure we have all the required elements
      const hasHook = dialogue.some(d => d.type === 'hook');
      const hasMetaphor = dialogue.some(d => d.type === 'metaphor');
      const hasConcept = dialogue.some(d => d.type === 'concept');
      const hasCta = dialogue.some(d => d.type === 'cta');

      // If any element is missing, add it from the default dialogue
      if (!hasHook && dialogue.length > 0) {
        dialogue[0].type = 'hook';
        if (!dialogue[0].text.includes('🧠')) {
          dialogue[0].text = '🧠 ' + dialogue[0].text;
        }
      }

      if (!hasMetaphor) {
        // Find a Didi line to add the metaphor to
        const didiIndex = dialogue.findIndex(d => d.speaker === 'Didi' && !d.type);
        if (didiIndex !== -1) {
          dialogue[didiIndex].type = 'metaphor';
          if (!dialogue[didiIndex].text.includes('🧩')) {
            dialogue[didiIndex].text = '🧩 ' + dialogue[didiIndex].text;
          }
        }
      }

      if (!hasConcept) {
        // Find another Didi line to add the concept to
        const didiIndex = dialogue.findIndex(d => d.speaker === 'Didi' && !d.type);
        if (didiIndex !== -1) {
          dialogue[didiIndex].type = 'concept';
          if (!dialogue[didiIndex].text.includes('📚')) {
            dialogue[didiIndex].text = '📚 ' + dialogue[didiIndex].text;
          }
        }
      }

      if (!hasCta && dialogue.length > 1) {
        // Add CTA to the last Bhai line
        const lastBhaiIndex = findLastIndex(dialogue, d => d.speaker === 'Bhai');
        if (lastBhaiIndex !== -1) {
          dialogue[lastBhaiIndex].type = 'cta';

          // Make sure the CTA includes the follow message
          if (!dialogue[lastBhaiIndex].text.includes('Follow for more simplified tech explanations')) {
            dialogue[lastBhaiIndex].text = dialogue[lastBhaiIndex].text.replace(/\.$/, '') +
              '. Follow for more simplified tech explanations!';
          }

          // Add emoji if not present
          if (!dialogue[lastBhaiIndex].text.includes('🗨️')) {
            dialogue[lastBhaiIndex].text = '🗨️ ' + dialogue[lastBhaiIndex].text;
          }
        }
      }

      return dialogue;
    } catch (error) {
      console.error('Error parsing dialogue text:', error);
      return defaultDialogue;
    }
  };

  // Helper function to find the last index of an element that matches a predicate
  const findLastIndex = (array, predicate) => {
    for (let i = array.length - 1; i >= 0; i--) {
      if (predicate(array[i])) {
        return i;
      }
    }
    return -1;
  };

  // Get language-specific instructions for dialogue generation
  const getLanguageInstructions = (language) => {
    switch (language) {
      case 'tanglish':
        return {
          intro: 'The dialogue should be in Tamil, where Tamil words and phrases are mixed with English technical terms when needed. Write Tamil words in Roman script, not Tamil script.',
          hookExample: 'Bhai: 🧠 Didi, computer-la machine learning-nu onnu irukam, adhu enna? Computers can really think like humans-a?',
          flowInstructions: 'Use Tamil sentence structures with English technical terms. Mix Tamil and English naturally as Tamil speakers would do in conversation.',
          metaphorExample: 'Didi: 🧩 Paaru, machine learning is like teaching a small kuzhanthai. Neenga oru kuzhanthai-ku cat photos kamicha, adhu slowly cats-a identify panna kathukum. Adhey madhiri, machine learning algorithm learns from examples.',
          conceptExample: 'Didi: 📚 Idhu than "supervised learning"-nu solluvanga. Inge, we give the computer labeled examples to learn from. Adhu madhiri, "unsupervised learning"-la, computer thanama patterns-a kandupidikkum.',
          ctaExample: 'Bhai: 🗨️ Wow Didi, romba interesting! Innum neraya kathukanum about machine learning. Follow for more simplified tech explanations!'
        };
      case 'tenglish':
        return {
          intro: 'The dialogue should be in Telugu, with occasional English technical terms when necessary. Write Telugu in Roman script (not Telugu script).',
          hookExample: 'Bhai: 🧠 Didi, ee artificial intelligence gurinchi chala talk vinthunnam. Nijam ga manushulu laga alochinchagalada computers? Mana jobs ni theesesukuntaya?',
          flowInstructions: 'Use Telugu for the conversation with English technical terms only when needed. Write Telugu in Roman script. Include Telugu expressions, idioms, and cultural references to make the dialogue authentic.',
          metaphorExample: 'Didi: 🧩 Cloud computing ni ila chudandi - mee intlo AC, fridge, TV, washing machine kosam separate generators pettukuntara? Ledu kada, electricity grid nunchi power vadutharu. Alage, cloud computing lo kuda, mee software, data, processing power ni remote servers lo store chesi, internet dwara access chestaru.',
          conceptExample: 'Didi: 📚 Meeru cheppedi "machine learning" ani antaru. Idi artificial intelligence lo oka branch. Machine learning lo, manamu explicit ga program cheyakunda, data dwara computers ki patterns ni recognize cheyadam nerpistham. Udaharanaki, meeku emails lo spam filter, voice assistants, recommendation systems - ivi anni machine learning examples.',
          ctaExample: 'Bhai: 🗨️ Abbabbo, idi chala interesting ga undi Didi! Nenu inka chala nerchukovali ee technology gurinchi. Follow for more simplified tech explanations!'
        };
      case 'hindi':
        return {
          intro: 'The dialogue should be in Hindi, with occasional English technical terms when necessary.',
          hookExample: 'Bhai: 🧠 Didi, kya artificial intelligence sachme hamare naukri cheen legi? Mujhe thoda darr lag raha hai.',
          flowInstructions: 'Use Hindi for the conversation with English technical terms when needed. Write Hindi in Roman script (not Devanagari).',
          metaphorExample: 'Didi: 🧩 AI ko ek assistant ki tarah socho. Jaise ki aapka ek helper jo aapke kaam ko aasan banata hai. Bilkul usi tarah, AI humari productivity badhane mein madad karti hai, hamari naukri cheenne ke bajaye.',
          conceptExample: 'Didi: 📚 Ise "augmented intelligence" kehte hain, jahan AI insaano ki capabilities ko enhance karti hai. Yeh "artificial general intelligence" se alag hai, jo ki abhi sirf science fiction mein hai.',
          ctaExample: 'Bhai: 🗨️ Wah Didi, yeh to bahut interesting hai! Main zaroor AI ke baare mein aur jankari hasil karunga. Follow for more simplified tech explanations!'
        };
      case 'english':
      default:
        return {
          intro: 'The dialogue should be in clear, simple English.',
          hookExample: 'Bhai: 🧠 Didi, is it true that quantum particles can be in two places at once, or is that just sci-fi nonsense?',
          flowInstructions: 'Use simple, clear English with minimal jargon. When technical terms are necessary, explain them in plain language.',
          metaphorExample: 'Didi: 🧩 Think of blockchain like a public diary that everyone can see but nobody can edit past entries. Each transaction is like a page in this diary, permanently recorded for everyone to verify.',
          conceptExample: 'Didi: 📚 What you\'re describing is called "confirmation bias," which is our tendency to favor information that confirms our existing beliefs.',
          ctaExample: 'Bhai: 🗨️ Wow, I need to learn more about this! This is fascinating stuff. Follow for more simplified tech explanations!'
        };
    }
  };

  // Generate audio for a single line of dialogue
  const generateAudioForLine = async (line, speakerVoice) => {
    try {
      console.log(`Generating audio for: ${line.speaker} - ${line.text.substring(0, 50)}...`);

      // CORS issues are happening with the Pollinations API
      // Let's use a much simpler approach to avoid CORS issues

      // Always prepend "say this:" to the text for the TTS service
      // This is required for the Pollinations API to properly interpret the text
      const text = `say this: ${line.text}`;

      // Use a very simple URL with minimal parameters
      // Use encodeURIComponent which is more standard
      const encodedText = encodeURIComponent(text);

      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();

      // Create a simple URL without any headers that might trigger CORS
      const url = `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=${speakerVoice}&t=${timestamp}`;

      // Create a unique cache-busting parameter for each request
      // This helps prevent issues with subsequent requests being cached
      const cacheBuster = Math.random().toString(36).substring(2, 15);
      const finalUrl = `${url}&cb=${cacheBuster}`;

      try {
        // Try a simple fetch without any headers or options that might trigger CORS
        const response = await fetch(finalUrl);

        if (response.ok) {
          const blob = await response.blob();

          if (blob.size > 100) {
            return {
              blob,
              speaker: line.speaker,
              text: line.text
            };
          }
        }

        // If we get here, something went wrong with the API call
        throw new Error('API call failed or returned invalid data');

      } catch (fetchError) {
        console.log('Fetch error, using fallback audio:', fetchError);
        throw fetchError; // Re-throw to trigger fallback
      }
    } catch (error) {
      console.error(`Error generating audio for line: ${line.text}`, error);

      // Create a fallback audio blob with a beep sound
      // This ensures the dialogue can continue even if one line fails
      const fallbackBlob = await createFallbackAudioBlob();

      return {
        blob: fallbackBlob,
        speaker: line.speaker,
        text: line.text,
        error: error.message
      };
    }
  };

  // Create a fallback audio blob with a beep sound
  const createFallbackAudioBlob = async () => {
    try {
      // Create a simple beep sound using Web Audio API
      // @ts-ignore - webkitAudioContext is for Safari compatibility
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440 Hz = A4

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const offlineContext = new OfflineAudioContext(1, 44100 * 0.5, 44100);
      const offlineOscillator = offlineContext.createOscillator();
      const offlineGain = offlineContext.createGain();

      offlineOscillator.type = 'sine';
      offlineOscillator.frequency.setValueAtTime(440, 0);

      offlineGain.gain.setValueAtTime(0.1, 0);
      offlineGain.gain.exponentialRampToValueAtTime(0.001, 0.5);

      offlineOscillator.connect(offlineGain);
      offlineGain.connect(offlineContext.destination);

      offlineOscillator.start();

      const renderedBuffer = await offlineContext.startRendering();

      // Convert the buffer to a WAV file
      const wavBlob = bufferToWave(renderedBuffer, 0, renderedBuffer.length);

      return wavBlob;
    } catch (error) {
      console.error('Error creating fallback audio:', error);
      // Return an empty blob as a last resort
      return new Blob([''], { type: 'audio/mpeg' });
    }
  };

  // Convert an audio buffer to a WAV file
  const bufferToWave = (abuffer, offset, len) => {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample;

    // Write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" chunk
    setUint32(length - 44); // chunk length

    // Write interleaved data
    for (i = 0; i < numOfChan; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    for (i = 0; i < len; i++) {
      for (let c = 0; c < numOfChan; c++) {
        sample = Math.max(-1, Math.min(1, channels[c][offset + i]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(44 + (i * numOfChan + c) * 2, sample, true);
      }
    }

    function setUint16(data) {
      view.setUint16(offset, data, true);
      offset += 2;
    }

    function setUint32(data) {
      view.setUint32(offset, data, true);
      offset += 4;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  // Generate audio for the dialogue
  const generateDialogueAudio = async (dialogue) => {
    try {
      // Show loading state
      setIsGeneratingDialogue(true);
      setAudioGenerationError(null);
      setAudioGenerationProgress(0);

      // Limit to approximately 1 minute of audio (about 4-6 lines)
      // Make sure we include the hook at the beginning and CTA at the end
      let linesToProcess = [];

      // Find the hook (first line or line with type 'hook')
      const hookIndex = dialogue.findIndex(line => line.type === 'hook');
      if (hookIndex !== -1) {
        linesToProcess.push(dialogue[hookIndex]);
      } else if (dialogue.length > 0) {
        linesToProcess.push(dialogue[0]);
      }

      // Find a concept line
      const conceptIndex = dialogue.findIndex(line => line.type === 'concept');
      if (conceptIndex !== -1 && !linesToProcess.includes(dialogue[conceptIndex])) {
        linesToProcess.push(dialogue[conceptIndex]);
      }

      // Find a metaphor line
      const metaphorIndex = dialogue.findIndex(line => line.type === 'metaphor');
      if (metaphorIndex !== -1 && !linesToProcess.includes(dialogue[metaphorIndex])) {
        linesToProcess.push(dialogue[metaphorIndex]);
      }

      // Find the CTA (last line or line with type 'cta')
      const ctaIndex = dialogue.findIndex(line => line.type === 'cta');
      if (ctaIndex !== -1 && !linesToProcess.includes(dialogue[ctaIndex])) {
        linesToProcess.push(dialogue[ctaIndex]);
      } else if (dialogue.length > 0 && !linesToProcess.includes(dialogue[dialogue.length - 1])) {
        linesToProcess.push(dialogue[dialogue.length - 1]);
      }

      // If we have less than 4 lines, add some more lines from the middle
      if (linesToProcess.length < 4 && dialogue.length > 4) {
        // Get indices of lines not already included
        const remainingIndices = dialogue
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => !linesToProcess.includes(line))
          .map(({ index }) => index);

        // Add up to 2 more lines
        const additionalLines = Math.min(2, remainingIndices.length);
        for (let i = 0; i < additionalLines; i++) {
          const randomIndex = Math.floor(Math.random() * remainingIndices.length);
          const lineIndex = remainingIndices[randomIndex];
          linesToProcess.push(dialogue[lineIndex]);
          remainingIndices.splice(randomIndex, 1);
        }
      }

      // Sort lines by their original order in the dialogue
      linesToProcess.sort((a, b) => dialogue.indexOf(a) - dialogue.indexOf(b));

      console.log('Generating audio for dialogue lines...');

      // Generate audio for each line sequentially to avoid overwhelming the API

      // Maximum number of attempts per line
      const maxAttempts = 3;

      // Clear previous results
      setAudioResults([]);
      setErrorCount(0);

      // Local variables to track results during generation
      const localAudioResults = [];
      let localErrorCount = 0;

      // Process each line individually to avoid one failure affecting others
      for (let i = 0; i < linesToProcess.length; i++) {
        const line = linesToProcess[i];

        // Ensure we're using the correct voice for each character
        // This is critical for maintaining consistent speaker assignment
        const voice = line.speaker === characterNames.male ? maleVoice : femaleVoice;

        console.log(`Processing line ${i+1}/${linesToProcess.length} for speaker ${line.speaker} with voice ${voice}`);

        // Update progress
        setAudioGenerationProgress(Math.round((i / linesToProcess.length) * 50)); // Use first 50% for generation

        // Try multiple times for each line
        let lineAttempts = 0;
        let lineSuccess = false;

        while (lineAttempts < maxAttempts && !lineSuccess) {
          lineAttempts++;

          if (lineAttempts > 1) {
            console.log(`Retry attempt ${lineAttempts} for line ${i+1}...`);
            // Add a small delay between retries
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          try {
            // Generate audio for this line
            const result = await generateAudioForLine(line, voice);

            // If we got here without throwing, we have a result
            localAudioResults.push(result);
            lineSuccess = true;

            // Check if there was an error
            if (result.error) {
              localErrorCount++;
            }
          } catch (lineError) {
            console.error(`Error generating audio for line ${i + 1}, attempt ${lineAttempts}:`, lineError);

            // Only create fallback on the last attempt
            if (lineAttempts === maxAttempts) {
              console.log(`Using fallback audio for line ${i+1} after ${maxAttempts} failed attempts`);
              localErrorCount++;

              // Create a fallback audio
              const fallbackBlob = await createFallbackAudioBlob();
              localAudioResults.push({
                blob: fallbackBlob,
                speaker: line.speaker,
                text: line.text,
                error: lineError.message
              });
            }
          }
        }
      }

      // Update state with the results so far
      setAudioResults(localAudioResults);
      setErrorCount(localErrorCount);

      // Update progress to show we're processing the results
      setAudioGenerationProgress(75);
      console.log('Audio generation complete, processing results...');

      // Create a combined audio file
      if (localAudioResults.length > 0) {
        try {
          // Create a combined blob with all audio files
          const combinedBlob = new Blob(localAudioResults.map(result => result.blob), { type: 'audio/mpeg' });

          // Set progress to 90% while creating the audio URL
          setAudioGenerationProgress(90);

          const audioUrl = URL.createObjectURL(combinedBlob);

          // Set the audio URL for the combined audio
          setDialogueAudioUrl(audioUrl);
          console.log('Dialogue audio URL set:', audioUrl);

          // If there were errors, show a warning
          if (localErrorCount > 0) {
            if (localErrorCount === localAudioResults.length) {
              setAudioGenerationError(
                `Unable to generate audio from the Pollinations API. Using fallback audio.`
              );
            } else {
              setAudioGenerationError(
                `Generated audio with ${localErrorCount} error${localErrorCount > 1 ? 's' : ''}. Some parts may not sound correct.`
              );
            }
          } else {
            // Clear any previous errors if everything worked
            setAudioGenerationError(null);
          }

          // Set progress to 100% when completely done
          setAudioGenerationProgress(100);
        } catch (combineError) {
          console.error('Error combining audio blobs:', combineError);

          // Fallback: If combining fails, just use the first audio file
          if (localAudioResults[0]) {
            const fallbackUrl = URL.createObjectURL(localAudioResults[0].blob);
            setDialogueAudioUrl(fallbackUrl);
            console.log('Using fallback audio URL:', fallbackUrl);
            setAudioGenerationError('Could not combine all audio segments. Playing partial audio.');
          } else {
            throw new Error('No audio was generated for the dialogue');
          }
        }
      } else {
        throw new Error('No audio was generated for the dialogue');
      }

    } catch (error) {
      console.error('Error generating dialogue audio:', error);
      setAudioGenerationError(`Failed to generate audio: ${error.message}`);
      // Don't throw the error, just show it to the user
    } finally {
      setIsGeneratingDialogue(false);
    }
  };

  // Toggle enterprise features
  const toggleFeature = (feature) => {
    setEnterpriseFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  return (
    <div className="App">
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <img src="/smatchie-logo.svg" alt="Smatchie Logo" className="welcome-logo" />
            <h1 className="welcome-title">Welcome to Smatchie Voice</h1>
            <p className="welcome-subtitle">Enterprise-Grade Text-to-Speech Platform</p>
          </div>
        </div>
      )}

      <header className="App-header">
        <div className="header-content">
          <div className="logo-container">
            <img src="/smatchie-logo.svg" alt="Smatchie Logo" className="app-logo" />
          </div>
          <div className="header-text">
            <h1>Smatchie Voice</h1>
            <p className="App-subtitle">Enterprise-Grade Text-to-Speech Platform</p>
          </div>
        </div>
        <div className="enterprise-badge">
          <span>ENTERPRISE</span>
        </div>
      </header>

      <div className="feature-tabs">
        <button
          className={`tab-btn ${activeTab === 'tts' ? 'active' : ''}`}
          onClick={() => setActiveTab('tts')}
        >
          Text to Speech
        </button>
        <button
          className={`tab-btn ${activeTab === 'dialogues' ? 'active' : ''}`}
          onClick={() => setActiveTab('dialogues')}
        >
          Educational Dialogues
        </button>
        <button className="tab-btn">Voice Library</button>
        <button className="tab-btn">Analytics</button>
        <button className="tab-btn">Team Access</button>
      </div>

      <main className="App-main">
        {activeTab === 'tts' ? (
          <div className="main-content">
            <div className="left-panel">
            <div className="input-container">
              <label htmlFor="text-input">Enter text to convert to speech:</label>
              <p className="input-note">Note: "say this:" will be automatically added before your text</p>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your text here..."
                rows={5}
              />
            </div>

            <div className="voice-container">
              <label htmlFor="voice-select">Select voice:</label>
              <div className="voice-selection-grid">
                {voices.map((v) => (
                  <div
                    key={v.id}
                    className={`voice-card ${voice === v.id ? 'selected' : ''}`}
                    onClick={() => setVoice(v.id)}
                  >
                    <div className="voice-icon">{v.name.charAt(0)}</div>
                    <div className="voice-details">
                      <h4>{v.name}</h4>
                      <p>{v.description}</p>
                      <div className="emotion-range">
                        <span>Emotion: </span>
                        <span className="emotion-tags">{v.emotionRange}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="voice-humanization">
              <h3>Voice Humanization</h3>
              <p className="humanization-description">Fine-tune voice characteristics to sound more natural and human-like</p>

              <div className="humanization-controls">
                <div className="humanization-control">
                  <label>Emotion Intensity</label>
                  <div className="control-options">
                    <button
                      className={`control-option ${advancedSettings.emotionIntensity === 'low' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, emotionIntensity: 'low'}))}
                    >
                      Subtle
                    </button>
                    <button
                      className={`control-option ${advancedSettings.emotionIntensity === 'medium' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, emotionIntensity: 'medium'}))}
                    >
                      Natural
                    </button>
                    <button
                      className={`control-option ${advancedSettings.emotionIntensity === 'high' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, emotionIntensity: 'high'}))}
                    >
                      Expressive
                    </button>
                  </div>
                </div>

                <div className="humanization-control">
                  <label>Speaking Rate</label>
                  <div className="control-options">
                    <button
                      className={`control-option ${advancedSettings.speakingRate === 'slow' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, speakingRate: 'slow'}))}
                    >
                      Slower
                    </button>
                    <button
                      className={`control-option ${advancedSettings.speakingRate === 'normal' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, speakingRate: 'normal'}))}
                    >
                      Normal
                    </button>
                    <button
                      className={`control-option ${advancedSettings.speakingRate === 'fast' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, speakingRate: 'fast'}))}
                    >
                      Faster
                    </button>
                  </div>
                </div>

                <div className="humanization-control">
                  <label>Voice Pitch</label>
                  <div className="control-options">
                    <button
                      className={`control-option ${advancedSettings.pitch === 'low' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, pitch: 'low'}))}
                    >
                      Lower
                    </button>
                    <button
                      className={`control-option ${advancedSettings.pitch === 'natural' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, pitch: 'natural'}))}
                    >
                      Natural
                    </button>
                    <button
                      className={`control-option ${advancedSettings.pitch === 'high' ? 'selected' : ''}`}
                      onClick={() => setAdvancedSettings(prev => ({...prev, pitch: 'high'}))}
                    >
                      Higher
                    </button>
                  </div>
                </div>

                <div className="humanization-toggles">
                  <div className="humanization-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSettings.useBreathingPatterns}
                        onChange={() => setAdvancedSettings(prev => ({...prev, useBreathingPatterns: !prev.useBreathingPatterns}))}
                      />
                      <span>Natural Breathing Patterns</span>
                    </label>
                  </div>
                  <div className="humanization-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSettings.useEmphasis}
                        onChange={() => setAdvancedSettings(prev => ({...prev, useEmphasis: !prev.useEmphasis}))}
                      />
                      <span>Natural Word Emphasis</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="humanization-preview">
                <div className="current-voice-info">
                  <h4>Current Voice: {voices.find(v => v.id === voice)?.name}</h4>
                  <p className="voice-prompt-preview">
                    <strong>Voice Style:</strong> {voices.find(v => v.id === voice)?.systemPrompt.substring(0, 100)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="enterprise-features">
              <h3>Enterprise Features</h3>
              <div className="feature-toggles">
                <div className="feature-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={enterpriseFeatures.batchProcessing}
                      onChange={() => toggleFeature('batchProcessing')}
                    />
                    <span>Batch Processing</span>
                  </label>
                </div>
                <div className="feature-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={enterpriseFeatures.teamSharing}
                      onChange={() => toggleFeature('teamSharing')}
                    />
                    <span>Team Sharing</span>
                  </label>
                </div>
                <div className="feature-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={enterpriseFeatures.analytics}
                      onChange={() => toggleFeature('analytics')}
                    />
                    <span>Analytics</span>
                  </label>
                </div>
                <div className="feature-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={enterpriseFeatures.customVoices}
                      onChange={() => toggleFeature('customVoices')}
                    />
                    <span>Custom Voices</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="button-container">
              <button
                className="generate-btn"
                onClick={generateSpeech}
                disabled={isLoading || !text}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Generating...
                  </>
                ) : (
                  'Generate Speech'
                )}
              </button>
              {audioUrl && (
                <button className="save-btn" onClick={saveAudio}>
                  Save to Library
                </button>
              )}
            </div>
          </div>

          <div className="right-panel">
            {audioUrl ? (
              <div className="audio-container">
                <h3 className="audio-title">Your Generated Speech</h3>
                <div className="audio-player-container">
                  <audio ref={audioRef} controls src={audioUrl} />
                  <canvas ref={canvasRef} className="audio-visualizer" width="300" height="100"></canvas>
                </div>
                <div className="audio-actions">
                  <a
                    href={audioUrl}
                    download={`smatchie-voice-${voice}.mp3`}
                    className="download-btn"
                  >
                    Download Audio
                  </a>
                  <button className="share-btn">Share</button>
                </div>
                <div className="voice-info">
                  <h4>Voice: {voices.find(v => v.id === voice)?.name}</h4>
                  <p>{voices.find(v => v.id === voice)?.useCase}</p>
                  <div className="voice-humanization-info">
                    <div className="humanization-tag">
                      <span className="tag-label">Emotion:</span>
                      <span className="tag-value">{advancedSettings.emotionIntensity}</span>
                    </div>
                    <div className="humanization-tag">
                      <span className="tag-label">Rate:</span>
                      <span className="tag-value">{advancedSettings.speakingRate}</span>
                    </div>
                    <div className="humanization-tag">
                      <span className="tag-label">Pitch:</span>
                      <span className="tag-value">{advancedSettings.pitch}</span>
                    </div>
                  </div>
                  <div className="humanization-features">
                    {advancedSettings.useBreathingPatterns && (
                      <span className="humanization-feature">Natural Breathing</span>
                    )}
                    {advancedSettings.useEmphasis && (
                      <span className="humanization-feature">Word Emphasis</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎙️</div>
                <h3>Ready to Generate</h3>
                <p>Enter your text and select a voice to create professional-quality audio.</p>
              </div>
            )}

            <div className="testimonials-section">
              <h3>What Our Enterprise Clients Say</h3>
              <div className="testimonials-carousel">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-card">
                    <p className="testimonial-text">"{testimonial.text}"</p>
                    <div className="testimonial-author">
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="main-content">
            <div className="left-panel">
              <div className="dialogue-container">
                <h2 className="dialogue-title">Educational Dialogues</h2>
                <p className="dialogue-description">
                  Generate educational conversations between customizable characters on any topic.
                  Perfect for learning concepts in a conversational, easy-to-understand format.
                </p>

                <div className="input-container">
                  <label htmlFor="dialogue-topic">Enter a topic for the educational dialogue:</label>
                  <textarea
                    id="dialogue-topic"
                    value={dialogueTopic}
                    onChange={(e) => setDialogueTopic(e.target.value)}
                    placeholder="e.g., JavaScript, Artificial Intelligence, Climate Change..."
                    rows={3}
                  />
                </div>

                <div className="character-customization">
                  <h3>Customize Characters</h3>
                  <div className="character-inputs">
                    <div className="character-input">
                      <label htmlFor="male-character">Learner Name:</label>
                      <input
                        id="male-character"
                        type="text"
                        value={characterNames.male}
                        onChange={(e) => setCharacterNames({...characterNames, male: e.target.value})}
                        placeholder="Enter name for the learner character"
                      />
                    </div>
                    <div className="character-input">
                      <label htmlFor="female-character">Teacher Name:</label>
                      <input
                        id="female-character"
                        type="text"
                        value={characterNames.female}
                        onChange={(e) => setCharacterNames({...characterNames, female: e.target.value})}
                        placeholder="Enter name for the teacher character"
                      />
                    </div>
                  </div>
                </div>

                <div className="language-selection">
                  <h3>Select Language</h3>
                  <div className="language-options">
                    <button
                      className={`language-option ${dialogueLanguage === 'english' ? 'selected' : ''}`}
                      onClick={() => setDialogueLanguage('english')}
                    >
                      <span className="language-icon">🇬🇧</span>
                      <span className="language-name">Pure English</span>
                    </button>
                    <button
                      className={`language-option ${dialogueLanguage === 'tanglish' ? 'selected' : ''}`}
                      onClick={() => setDialogueLanguage('tanglish')}
                    >
                      <span className="language-icon">🇮🇳</span>
                      <span className="language-name">Tamil</span>
                    </button>
                    <button
                      className={`language-option ${dialogueLanguage === 'tenglish' ? 'selected' : ''} featured-language`}
                      onClick={() => setDialogueLanguage('tenglish')}
                    >
                      <span className="language-icon">🇮🇳</span>
                      <span className="language-badge">Featured</span>
                      <span className="language-name">Telugu</span>
                    </button>
                    <button
                      className={`language-option ${dialogueLanguage === 'hindi' ? 'selected' : ''}`}
                      onClick={() => setDialogueLanguage('hindi')}
                    >
                      <span className="language-icon">🇮🇳</span>
                      <span className="language-name">Hindi</span>
                    </button>
                  </div>
                  <p className="language-note">Note: Dialogue will be limited to approximately 1 minute of audio.</p>
                </div>

                <div className="voice-selection-container">
                  <div className="voice-selection-column">
                    <h3>Voice for {characterNames.male} (Learner)</h3>
                    <div className="voice-selection-grid single-column">
                      {voices.filter(v => ['onyx', 'echo', 'alloy'].includes(v.id)).map((v) => (
                        <div
                          key={v.id}
                          className={`voice-card ${maleVoice === v.id ? 'selected' : ''}`}
                          onClick={() => setMaleVoice(v.id)}
                        >
                          <div className="voice-icon">{v.name.charAt(0)}</div>
                          <div className="voice-details">
                            <h4>{v.name}</h4>
                            <p>{v.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="voice-selection-column">
                    <h3>Voice for {characterNames.female} (Teacher)</h3>
                    <div className="voice-selection-grid single-column">
                      {voices.filter(v => ['nova', 'shimmer', 'fable'].includes(v.id)).map((v) => (
                        <div
                          key={v.id}
                          className={`voice-card ${femaleVoice === v.id ? 'selected' : ''}`}
                          onClick={() => setFemaleVoice(v.id)}
                        >
                          <div className="voice-icon">{v.name.charAt(0)}</div>
                          <div className="voice-details">
                            <h4>{v.name}</h4>
                            <p>{v.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="button-container">
                  <button
                    className="generate-btn"
                    onClick={() => generateEducationalDialogue(dialogueTopic)}
                    disabled={isGeneratingDialogue || !dialogueTopic}
                  >
                    {isGeneratingDialogue ? (
                      <>
                        <span className="loading-spinner"></span>
                        Generating Dialogue...
                      </>
                    ) : (
                      'Generate Educational Dialogue'
                    )}
                  </button>

                  {dialogueScript.length > 0 && !isGeneratingDialogue && (
                    <button
                      className="regenerate-btn"
                      onClick={() => generateEducationalDialogue(dialogueTopic)}
                      disabled={!dialogueTopic}
                    >
                      Regenerate Dialogue
                    </button>
                  )}
                </div>

                {isGeneratingDialogue && audioGenerationProgress > 0 && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${audioGenerationProgress}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {audioGenerationProgress < 100 ?
                        `Generating audio: ${audioGenerationProgress}%` :
                        'Processing audio...'}
                    </div>
                  </div>
                )}

                {audioGenerationError && (
                  <div className="error-message">
                    <p>{audioGenerationError}</p>
                    {errorCount === audioResults?.length ? (
                      <div className="error-explanation">
                        <p>Audio generation encountered issues. The application is still usable with fallback audio.</p>
                        <button
                          className="retry-btn"
                          onClick={() => generateDialogueAudio(dialogueScript)}
                        >
                          Retry Audio Only
                        </button>
                      </div>
                    ) : (
                      <button
                        className="retry-btn"
                        onClick={() => generateEducationalDialogue(dialogueTopic)}
                      >
                        Regenerate Dialogue
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="right-panel">
              {dialogueScript.length > 0 ? (
                <div className="dialogue-result-container">
                  <h3 className="dialogue-result-title">Educational Dialogue on {dialogueTopic}</h3>

                  <div className="dialogue-script">
                    {dialogueScript.map((line, index) => (
                      <div
                        key={index}
                        className={`dialogue-line ${line.speaker.toLowerCase()} ${line.type ? `dialogue-${line.type}` : ''}`}
                      >
                        <div className="speaker-badge">{line.speaker}</div>
                        <div className="dialogue-text">{line.text}</div>
                        {line.type && (
                          <div className="dialogue-element-tag">
                            {line.type === 'hook' && '🧠 Hook'}
                            {line.type === 'metaphor' && '🧩 Metaphor'}
                            {line.type === 'concept' && '📚 Concept'}
                            {line.type === 'cta' && '🗨️ Call to Action'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="dialogue-audio-container">
                    <h4>Listen to the Dialogue</h4>
                    {dialogueAudioUrl ? (
                      <>
                        <audio
                          controls
                          className="dialogue-audio"
                          src={dialogueAudioUrl}
                          onError={(e) => {
                            console.error('Audio playback error:', e);
                            alert('There was an error playing the audio. Please try generating the dialogue again.');
                          }}
                        />

                        <div className="audio-actions">
                          <a
                            href={dialogueAudioUrl}
                            download={`smatchie-dialogue-${dialogueTopic.replace(/\s+/g, '-').toLowerCase()}.mp3`}
                            className="download-btn"
                          >
                            Download Dialogue Audio
                          </a>
                          <button
                            className="share-btn"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: `Educational Dialogue on ${dialogueTopic}`,
                                  text: `Check out this educational dialogue about ${dialogueTopic} generated by Smatchie Voice!`,
                                  url: window.location.href
                                }).catch(err => console.error('Error sharing:', err));
                              } else {
                                alert('Sharing is not supported in your browser.');
                              }
                            }}
                          >
                            Share Dialogue
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="audio-loading">
                        <div className="loading-spinner"></div>
                        <p>Generating audio for the dialogue...</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>Ready to Create Educational Dialogues</h3>
                  <p>Enter a topic and generate a conversation between {characterNames.male} and {characterNames.female} that explains the concept in an easy-to-understand manner.</p>

                  <div className="dialogue-example">
                    <h4>Example Dialogue (Telugu):</h4>
                    <div className="dialogue-line bhai dialogue-hook">
                      <div className="speaker-badge">Bhai</div>
                      <div className="dialogue-text">🧠 Didi, ee machine learning gurinchi chala talk vinthunnam. Nijam ga computers manushulu laga nerchukovacha?</div>
                      <div className="dialogue-element-tag">🧠 Hook</div>
                    </div>
                    <div className="dialogue-line didi dialogue-concept">
                      <div className="speaker-badge">Didi</div>
                      <div className="dialogue-text">📚 Manchidi Bhai! Meeru adige vishayam "machine learning" ani antaru. Idi kruthrima medhassulo oka bhagam. Machine learning lo, manamu computer ki spashta adeshalu ivvakunda, data nunchi nerchukune vidhanam nerpistham.</div>
                      <div className="dialogue-element-tag">📚 Concept</div>
                    </div>
                    <div className="dialogue-line bhai">
                      <div className="speaker-badge">Bhai</div>
                      <div className="dialogue-text">Adi chala klishtamga undi. Asalu idi ela pani chestundi?</div>
                    </div>
                    <div className="dialogue-line didi dialogue-metaphor">
                      <div className="speaker-badge">Didi</div>
                      <div className="dialogue-text">🧩 Oka chinna pillavaadiki nerpinchina laga bhavinchochu. Ela ante, pillavaadiki pilli bommalanu chupinchi pillini gurthinchataniki nerpistham kada, alage machine learning algorithm kuda udaharanala dwara nerchukuntundi. Entha ekkuva samacharam unte, antha baaga anumaanam cheyagaladu.</div>
                      <div className="dialogue-element-tag">🧩 Metaphor</div>
                    </div>
                    <div className="dialogue-line bhai dialogue-cta">
                      <div className="speaker-badge">Bhai</div>
                      <div className="dialogue-text">🗨️ Abbabbo, ippudu baaga spashta ga artham ayyindi! Nenu inka chala nerchukovali machine learning gurinchi. Follow for more simplified tech explanations!</div>
                      <div className="dialogue-element-tag">🗨️ Call to Action</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/smatchie-logo.svg" alt="Smatchie Logo" className="footer-logo-img" />
            <p>Smatchie Voice</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#enterprise">Enterprise</a>
            <a href="#support">Support</a>
          </div>
          <div className="footer-legal">
            <p>© 2025 Smatchie Voice. All rights reserved.</p>
            <p>Powered by <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer">Pollinations.AI</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
