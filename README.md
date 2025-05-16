# Pollinations TTS - Text-to-Speech Application

A React-based text-to-speech application that uses the free Pollinations.AI API to convert text to speech without requiring any API keys.

## Features

- Convert text to speech using Pollinations.AI's TTS service
- Automatically adds "say this:" before the user's text
- Choose from multiple voice options
- Download generated audio files
- No API key required
- Simple, clean user interface

## How It Works

This application leverages the Pollinations.AI API, which provides free text-to-speech capabilities without requiring authentication or API keys. The application:

1. Takes user input text
2. Automatically adds "say this:" before the user's text
3. Allows selection of different voice options
4. Sends a request to the Pollinations API
5. Plays the generated audio
6. Provides an option to download the audio file

## Available Voices

The application supports the following voices:

- Alloy
- Echo
- Fable
- Nova
- Onyx
- Shimmer

These voices are provided by the OpenAI TTS model through Pollinations.AI.

## API Usage

The application uses the following API endpoint:

```
https://text.pollinations.ai/[text]?model=openai-audio&voice=[voice]
```

Where:
- `[text]` is the URL-encoded text to convert to speech
- `[voice]` is the selected voice option

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/pollinations-tts.git
```

2. Navigate to the project directory:
```
cd pollinations-tts
```

3. Install dependencies:
```
npm install
```

4. Start the development server:
```
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Building for Production

To create a production build:

```
npm run build
```

This will create an optimized build in the `build` folder that can be deployed to any static hosting service.

## Technologies Used

- React
- JavaScript
- HTML/CSS
- Pollinations.AI API

## About Pollinations.AI

[Pollinations.AI](https://pollinations.ai) is an open-source gen AI startup providing free text and image generation APIs without requiring signups or API keys. They prioritize privacy with zero data storage and completely anonymous usage.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Pollinations.AI](https://pollinations.ai) for providing the free TTS API
- [Create React App](https://create-react-app.dev/) for the React application boilerplate
