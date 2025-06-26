
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { VideoControls } from './components/VideoControls';
import { PreviewCanvas } from './components/PreviewCanvas';
import { LoadingSpinner, InfoIcon, WarningIcon } from './components/Icons';
import { Header } from './components/Header';
import AIVideoGenPage from './pages/AIVideoGenPage';
import CombineClipsPage from './pages/CombineClipsPage';
import type { VideoTransform, ChromaKeySettings, RGBColor, PageKey } from './types';
import { GoogleGenAI } from "@google/genai";

interface BackgroundImageDimensions {
  width: number;
  height: number;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('bk-ground-swap');

  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [backgroundImageDimensions, setBackgroundImageDimensions] = useState<BackgroundImageDimensions | null>(null);

  const [userApiKey, setUserApiKey] = useState<string>('');
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false);

  const [videoTransform, setVideoTransform] = useState<VideoTransform>({
    x: 250,
    y: 500,
    width: 1778,
    height: 1000,
  });
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);

  const [chromaKeySettings, setChromaKeySettings] = useState<ChromaKeySettings>({
    color: { r: 255, g: 255, b: 255 },
    hexColor: '#FFFFFF',
    tolerance: 255,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const backgroundImageUrlRef = useRef<string | null>(null);
  const videoUrlRef = useRef<string | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('geminiApiKey');
    if (storedKey) {
      setUserApiKey(storedKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (userApiKey.trim()) {
      localStorage.setItem('geminiApiKey', userApiKey.trim());
    } else {
      localStorage.removeItem('geminiApiKey'); 
    }
  }, [userApiKey]);

  // Update apiKeyAvailable state based on userApiKey
   useEffect(() => {
    setApiKeyAvailable(userApiKey.trim() !== '');
  }, [userApiKey]);


  const handleBackgroundImageUpload = (file: File) => {
    if (backgroundImageUrlRef.current) {
      URL.revokeObjectURL(backgroundImageUrlRef.current);
    }
    const newUrl = URL.createObjectURL(file);
    backgroundImageUrlRef.current = newUrl;
    
    setBackgroundImageFile(file);
    setBackgroundImageUrl(newUrl);
    setBackgroundImageDimensions(null); // Reset dimensions until new image is loaded
  };

  // Load background image dimensions when backgroundImageUrl changes
  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setBackgroundImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        } else {
          console.warn("App.tsx: Background image loaded but dimensions are invalid (0x0).", img.src);
          setBackgroundImageDimensions(null);
        }
      };
      img.onerror = () => {
        console.error("App.tsx: Failed to load background image:", backgroundImageUrl);
        setBackgroundImageDimensions(null);
      };
      img.src = backgroundImageUrl;
    } else {
      setBackgroundImageDimensions(null); 
    }
  }, [backgroundImageUrl]);


  const handleVideoUpload = (file: File) => {
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
    }
    const newVideoUrl = URL.createObjectURL(file);
    videoUrlRef.current = newVideoUrl;

    setVideoFile(file);
    setVideoUrl(newVideoUrl);
    setVideoAspectRatio(null); 
  };

  // Effect for unmount cleanup of any remaining Object URLs
  useEffect(() => {
    return () => {
      if (backgroundImageUrlRef.current) {
        URL.revokeObjectURL(backgroundImageUrlRef.current);
        backgroundImageUrlRef.current = null;
      }
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = null;
      }
    };
  }, []);


  const handleSuggestColor = useCallback(async () => {
    if (!videoRef.current) {
      setGeminiError("Video element not ready for color suggestion.");
      return;
    }
    if (!userApiKey.trim()) {
       setGeminiError("Gemini API Key is missing. Please enter it in the settings below to enable AI color suggestion.");
       return;
    }
    setIsLoadingGemini(true);
    setGeminiError(null);

    const videoNode = videoRef.current;
    
    const awaitVideoMetadata = new Promise<void>((resolve, reject) => {
      if (videoNode.readyState >= 1) { 
        resolve();
      } else {
        const onMeta = () => { videoNode.removeEventListener('loadedmetadata', onMeta); resolve(); };
        const onError = () => { videoNode.removeEventListener('error', onError); reject(new Error("Failed to load video metadata for suggestion.")); };
        videoNode.addEventListener('loadedmetadata', onMeta);
        videoNode.addEventListener('error', onError);
      }
    });

    try {
      await awaitVideoMetadata;
      if (videoNode.videoWidth === 0 || videoNode.videoHeight === 0) {
        throw new Error("Video dimensions are 0, cannot capture frame for AI suggestion.");
      }
      if (videoNode.paused) {
         await videoNode.play().catch((e) => { console.warn("Playback attempt for AI suggestion failed:", e);}); 
      }
      await new Promise(resolve => setTimeout(resolve, 50));


      const tempCanvas = document.createElement('canvas');
      const scale = Math.min(1, 200 / videoNode.videoWidth, 200 / videoNode.videoHeight);
      tempCanvas.width = videoNode.videoWidth * scale;
      tempCanvas.height = videoNode.videoHeight * scale;

      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not create temporary canvas context.");
      }
      ctx.drawImage(videoNode, 0, 0, tempCanvas.width, tempCanvas.height);
      if (videoNode.paused === false) videoNode.pause(); 

      const base64ImageData = tempCanvas.toDataURL('image/jpeg').split(',')[1];

      const ai = new GoogleGenAI({ apiKey: userApiKey.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } },
            { text: "Analyze this video frame. What is the dominant solid background color most suitable for chroma keying? Respond with only the HEX color code (e.g., #00FF00). If no clear solid background, respond with #FFFFFF." }
          ]
        },
      });
      
      let suggestedHex = response.text.trim();
      if (!/^#[0-9A-F]{6}$/i.test(suggestedHex)) {
          console.warn("Gemini suggestion was not a valid HEX color, defaulting to white. Response:", suggestedHex);
          suggestedHex = '#FFFFFF'; 
      }

      setChromaKeySettings(prev => ({ ...prev, hexColor: suggestedHex, color: hexToRgb(suggestedHex) || prev.color }));

    } catch (error) {
      console.error("Error suggesting color with Gemini:", error);
      setGeminiError(`Failed to suggest color: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingGemini(false);
    }
  }, [userApiKey]);

  const hexToRgb = (hex: string): RGBColor | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  };
  
  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const handleChromaKeyChange = (newSettings: Partial<ChromaKeySettings>) => {
    setChromaKeySettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.hexColor) {
        updated.color = hexToRgb(newSettings.hexColor) || prev.color;
      } else if (newSettings.color) { 
        updated.hexColor = rgbToHex(newSettings.color.r, newSettings.color.g, newSettings.color.b);
      }
      return updated;
    });
  };

  const handleStartRecording = () => {
    if (!canvasRef.current) return;
    const stream = canvasRef.current.captureStream(30); 
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    
    recordedChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video_with_new_background.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    const currentVideoElement = videoRef.current; 

    if (videoUrl && currentVideoElement) {
        const handleMetadataLoaded = () => {
            if (currentVideoElement.videoWidth > 0 && currentVideoElement.videoHeight > 0) {
                const aspectRatio = currentVideoElement.videoWidth / currentVideoElement.videoHeight;
                setVideoAspectRatio(aspectRatio);
                
                setVideoTransform(prevTransform => {
                  const currentWidthPx = prevTransform.width; 
                  return {
                    ...prevTransform,
                    width: currentWidthPx,
                    height: Math.round(currentWidthPx / aspectRatio),
                  };
                });
                currentVideoElement.muted = true; 
                currentVideoElement.play().catch(e => console.warn("Video auto-play for preview failed:", e));
            } else {
                console.warn("Video metadata loaded, but dimensions are invalid (0x0). Resetting aspect ratio.", currentVideoElement.currentSrc);
                setVideoAspectRatio(null);
            }
        };

        const handleError = () => {
            console.error("Error loading video source:", currentVideoElement.currentSrc || videoUrl);
            setVideoAspectRatio(null);
        };

        currentVideoElement.src = videoUrl;
        currentVideoElement.load(); 
        currentVideoElement.addEventListener('loadedmetadata', handleMetadataLoaded);
        currentVideoElement.addEventListener('error', handleError);

        return () => { 
            currentVideoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
            currentVideoElement.removeEventListener('error', handleError);
        };
    } else if (!videoUrl) {
        setVideoAspectRatio(null); 
    }
  }, [videoUrl]);


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-indigo-900">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <main className="flex-grow flex flex-col items-center p-4 md:p-8 w-full">
        {currentPage === 'bk-ground-swap' && (
          <div className="w-full flex flex-col items-center">
            <header className="mb-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Video Background Remover AI
              </h1>
              <p className="text-gray-300 mt-2 text-sm md:text-base">
                Upload an image for the background, a video with a solid color backdrop, and watch the magic happen!
              </p>
              {!apiKeyAvailable && (
                <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 text-yellow-300 border border-yellow-400 rounded-md flex items-center text-sm">
                  <WarningIcon className="w-5 h-5 mr-2 shrink-0" />
                  <span>Your Gemini API key is missing. Please enter it in the "Chroma Key Settings" section below to enable AI color suggestion.</span>
                </div>
              )}
            </header>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6 bg-gray-800 p-6 rounded-xl shadow-2xl">
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-indigo-400">1. Upload Files</h2>
                  <FileUploader
                    label="Background Image"
                    onFileUpload={handleBackgroundImageUpload}
                    accept="image/*"
                  />
                  {backgroundImageUrl && <img src={backgroundImageUrl} alt="Background preview" className="mt-2 rounded max-h-32 object-contain mx-auto" />}
                </div>
                <div>
                  <FileUploader
                    label="Video File (with solid background)"
                    onFileUpload={handleVideoUpload}
                    accept="video/*"
                  />
                  {videoUrl && <video ref={videoRef} loop muted playsInline className="hidden" />}
                </div>
                
                <VideoControls
                  transform={videoTransform}
                  onTransformChange={setVideoTransform}
                  videoAspectRatio={videoAspectRatio}
                  backgroundImageDimensions={backgroundImageDimensions}
                  chromaKeySettings={chromaKeySettings}
                  onChromaKeyChange={handleChromaKeyChange}
                  onSuggestColor={handleSuggestColor}
                  isSuggestingColor={isLoadingGemini}
                  geminiError={geminiError}
                  isRecording={isRecording}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  apiKeyAvailable={apiKeyAvailable}
                  userApiKey={userApiKey}
                  onUserApiKeyChange={setUserApiKey}
                />
                {isLoadingGemini && (
                  <div className="flex items-center justify-center mt-4 text-sm text-indigo-300">
                    <LoadingSpinner className="w-5 h-5 mr-2"/>
                    Suggesting color...
                  </div>
                )}
                {geminiError && !isLoadingGemini && <p className="text-red-400 text-xs mt-2">{geminiError}</p>}
              </div>

              <div className="lg:col-span-2 bg-gray-800 p-4 md:p-6 rounded-xl shadow-2xl flex flex-col items-center justify-center">
                <h2 className="text-xl font-semibold mb-3 text-indigo-400">2. Preview & Adjust</h2>
                { (backgroundImageUrl && videoUrl && videoAspectRatio && backgroundImageDimensions && backgroundImageDimensions.width > 0 && backgroundImageDimensions.height > 0 && videoAspectRatio > 0) ? ( 
                  <PreviewCanvas
                    canvasRef={canvasRef}
                    backgroundImageUrl={backgroundImageUrl}
                    backgroundImageDimensions={backgroundImageDimensions}
                    videoElement={videoRef.current} 
                    videoTransform={videoTransform}
                    chromaKeySettings={chromaKeySettings}
                  />
                ) : (
                  <div className="w-full aspect-[16/9] bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400">
                    <InfoIcon className="w-12 h-12 mb-4 text-indigo-400"/>
                    <p>Upload a background image and a video to see the preview.</p>
                     {!backgroundImageUrl && <p className="text-xs mt-1">Background image missing.</p>}
                     {backgroundImageUrl && !backgroundImageDimensions && <p className="text-xs mt-1">Loading background image dimensions or failed to load. Check console for errors.</p>}
                     {backgroundImageUrl && backgroundImageDimensions && (backgroundImageDimensions.width === 0 || backgroundImageDimensions.height === 0) && <p className="text-xs mt-1">Background image loaded, but has invalid dimensions (0x0).</p>}
                     {!videoUrl && <p className="text-xs mt-1">Video missing.</p>}
                     {videoUrl && !videoAspectRatio && <p className="text-xs mt-1">Loading video metadata or video format issue. Check console for errors.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {currentPage === 'ai-video-gen' && <AIVideoGenPage />}
        {currentPage === 'combine-clips' && <CombineClipsPage />}
      </main>
      
      <footer className="w-full text-center text-gray-500 text-sm py-4">
        <p>Powered by React, Tailwind CSS, and Gemini AI.</p>
      </footer>
    </div>
  );
};

export default App;
