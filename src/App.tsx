import { useState, useRef } from "react";

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const VOICES: VoiceOption[] = [
  {
    id: "voice1",
    name: "Voice 1",
    description: "Warm & natural",
    icon: "🎙️",
  },
  {
    id: "voice2",
    name: "Voice 2",
    description: "Clear & confident",
    icon: "🎤",
  },
  {
    id: "voice3",
    name: "Voice 3",
    description: "Smooth & expressive",
    icon: "🎧",
  },
];

// Demo audio URL (a short public domain audio sample)
const DEMO_AUDIO_URL =
  "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";

export default function App() {
  const [selectedVoice, setSelectedVoice] = useState("voice1");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      setStatus("Please enter some text.");
      return;
    }

    if (trimmedText.length > 5000) {
      setStatus("Text is too long. Maximum 5000 characters.");
      return;
    }

    setIsGenerating(true);
    setStatus("Generating speech...");
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("text", trimmedText);
      formData.append("voice", selectedVoice);

      const response = await fetch("/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // If backend is not available, fall back to demo mode
        if (response.status === 0 || response.type === "opaque") {
          throw new Error("BACKEND_UNAVAILABLE");
        }
        const error = await response.json();
        throw new Error(error.detail || "Generation failed");
      }

      const data = await response.json();
      setAudioUrl(data.audio_url);
      setIsDemoMode(false);
      setStatus("Speech generated successfully.");
    } catch (error: any) {
      if (
        error.message === "BACKEND_UNAVAILABLE" ||
        error.message === "Failed to fetch" ||
        error instanceof TypeError
      ) {
        // Demo mode - simulate generation
        await simulateDemoGeneration();
      } else {
        setStatus(error.message || "An error occurred.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const simulateDemoGeneration = async () => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setAudioUrl(DEMO_AUDIO_URL);
    setIsDemoMode(true);
    setStatus(
      "Demo mode — Backend not connected. Connect FastAPI at port 8000 for real generation."
    );
  };

  const charCount = text.length;
  const maxChars = 5000;

  return (
    <div className="min-h-screen bg-[#0b0f0d] text-[#f2f5f3] font-sans">
      <div className="w-[min(850px,92%)] mx-auto py-16 px-2">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#20a968] to-[#0f7a4a] flex items-center justify-center text-xl">
              🧬
            </div>
            <h1 className="text-3xl font-bold tracking-tight">VoiceGene</h1>
          </div>
          <p className="text-[#8f9993] text-base">
            AI Voice Generation powered by CosyVoice
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#111714] border border-[#202a25] rounded-2xl p-6 md:p-8 mb-5">
          {/* Voice Selection */}
          <label className="block mb-3 font-semibold text-sm uppercase tracking-wide text-[#8f9993]">
            Select Voice
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
            {VOICES.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`
                  relative text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer
                  ${
                    selectedVoice === voice.id
                      ? "border-[#28b879] bg-[#10231b] shadow-[0_0_20px_rgba(40,184,121,0.1)]"
                      : "border-[#29352f] bg-[#0d1210] hover:border-[#28b879]/50"
                  }
                `}
              >
                <div className="text-2xl mb-2">{voice.icon}</div>
                <div className="font-semibold text-base mb-1">{voice.name}</div>
                <div className="text-[13px] text-[#7f8b84]">
                  {voice.description}
                </div>
                {selectedVoice === voice.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#28b879] flex items-center justify-center">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <label
            htmlFor="text"
            className="block mb-3 font-semibold text-sm uppercase tracking-wide text-[#8f9993]"
          >
            Text
          </label>

          <div className="relative">
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want VoiceGene to speak..."
              maxLength={maxChars}
              className="w-full min-h-[180px] resize-y border border-[#29352f] rounded-xl bg-[#0b0f0d] text-white p-4 text-base outline-none focus:border-[#28b879] transition-colors placeholder:text-[#4a5650]"
            />
            <div className="absolute bottom-3 right-3 text-xs text-[#4a5650]">
              {charCount}/{maxChars}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`
              w-full mt-5 py-4 rounded-xl text-base font-bold cursor-pointer transition-all duration-200
              ${
                isGenerating
                  ? "bg-[#1a5c3d] text-white/70 cursor-not-allowed"
                  : "bg-[#20a968] text-white hover:bg-[#26bd76] active:scale-[0.99] shadow-[0_4px_20px_rgba(32,169,104,0.3)] hover:shadow-[0_4px_25px_rgba(32,169,104,0.4)]"
              }
            `}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "🎙️ Generate Voice"
            )}
          </button>

          {/* Status */}
          {status && (
            <div
              className={`mt-4 text-sm ${
                status.includes("success") || status.includes("Demo mode")
                  ? "text-[#42d990]"
                  : status.includes("Please") || status.includes("too long")
                  ? "text-[#e8a44a]"
                  : "text-[#8f9993]"
              }`}
            >
              {status}
            </div>
          )}
        </div>

        {/* Result Card */}
        {audioUrl && (
          <div className="bg-[#111714] border border-[#202a25] rounded-2xl p-6 md:p-8 animate-[fadeIn_0.3s_ease-out]">
            <label className="block mb-4 font-semibold text-sm uppercase tracking-wide text-[#8f9993]">
              Generated Audio
            </label>

            {/* Waveform visualization */}
            <div className="bg-[#0b0f0d] rounded-xl p-4 mb-4 border border-[#1a2520]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-[2px] h-10">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-[#28b879] rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 28 + 8}px`,
                        animationDelay: `${i * 0.05}s`,
                        opacity: 0.4 + Math.random() * 0.6,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#4a5650] ml-2">
                  {isDemoMode ? "DEMO" : "READY"}
                </span>
              </div>
            </div>

            {/* Audio Player */}
            <audio ref={audioRef} controls className="w-full mb-4" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>

            {/* Download */}
            <a
              href={audioUrl}
              download="voicegene.wav"
              className="inline-flex items-center gap-2 text-[#42d990] hover:text-[#5aeaa3] transition-colors font-medium"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2v8M4 7l4 4 4-4M2 13h12" />
              </svg>
              Download WAV
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-[#4a5650]">
          <p>
            VoiceGene MVP • CosyVoice Zero-Shot Voice Cloning
          </p>
          <p className="mt-1">
            Backend: FastAPI + CosyVoice-300M •{" "}
            <span className="text-[#28b879]">
              {isDemoMode || (!audioUrl && !isGenerating)
                ? "Demo Mode"
                : "Connected"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
