import { useState, useRef } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('nova');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef(null);

  // Available voices from OpenAI
  const voices = [
    { id: 'alloy', name: 'Alloy' },
    { id: 'echo', name: 'Echo' },
    { id: 'fable', name: 'Fable' },
    { id: 'nova', name: 'Nova' },
    { id: 'onyx', name: 'Onyx' },
    { id: 'shimmer', name: 'Shimmer' }
  ];

  const generateSpeech = async () => {
    if (!text) {
      alert('Please enter some text');
      return;
    }

    setIsLoading(true);
    try {
      // Add "say this:" before the user's text
      const processedText = `say this: ${text}`;
      const encodedText = encodeURIComponent(processedText);
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

      // Set the audio URL and play it
      setAudioUrl(audioUrl);

      // Play the audio
      if (audioRef.current) {
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      alert('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Text-to-Speech with Pollinations API</h1>
        <p className="App-subtitle">Free TTS without API keys</p>
      </header>

      <main className="App-main">
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
          <select
            id="voice-select"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
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
        </div>

        {audioUrl && (
          <div className="audio-container">
            <h3 className="audio-title">Your Generated Speech</h3>
            <audio ref={audioRef} controls src={audioUrl} />
            <a
              href={audioUrl}
              download={`speech-${voice}.mp3`}
              className="download-btn"
            >
              Download Audio
            </a>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Powered by <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer">Pollinations.AI</a></p>
      </footer>
    </div>
  );
}

export default App;
