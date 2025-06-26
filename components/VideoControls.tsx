
import React from 'react';
import type { VideoTransform, ChromaKeySettings } from '../types';
import { MagicWandIcon, RecordIcon, StopIcon, LoadingSpinner, LockClosedIcon, LinkIcon } from './Icons'; // Added LinkIcon

interface BackgroundImageDimensions {
  width: number;
  height: number;
}

interface VideoControlsProps {
  transform: VideoTransform; 
  onTransformChange: (transform: VideoTransform) => void; 
  videoAspectRatio: number | null;
  backgroundImageDimensions: BackgroundImageDimensions | null; 
  chromaKeySettings: ChromaKeySettings;
  onChromaKeyChange: (settings: Partial<ChromaKeySettings>) => void;
  onSuggestColor: () => void;
  isSuggestingColor: boolean;
  geminiError: string | null;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  apiKeyAvailable: boolean; // True if userApiKey is set
  userApiKey: string;
  onUserApiKeyChange: (key: string) => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  transform,
  onTransformChange,
  videoAspectRatio,
  backgroundImageDimensions,
  chromaKeySettings,
  onChromaKeyChange,
  onSuggestColor,
  isSuggestingColor,
  // geminiError, // This is displayed in App.tsx now directly below controls
  isRecording,
  onStartRecording,
  onStopRecording,
  apiKeyAvailable,
  userApiKey,
  onUserApiKeyChange
}) => {

  const bgWidth = backgroundImageDimensions?.width;
  const bgHeight = backgroundImageDimensions?.height;
  const videoWidthPx = transform.width;
  const videoHeightPx = transform.height;

  const handlePercentageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!backgroundImageDimensions || !videoAspectRatio) return;

    const { name, value } = e.target;
    const numValue = parseFloat(value);

    if (isNaN(numValue)) return;

    let newPixelTransform = { ...transform };

    switch (name) {
      case 'lr_pos_percent': {
        const movableWidth = bgWidth! - videoWidthPx;
        newPixelTransform.x = movableWidth <= 0 ? movableWidth / 2 : Math.round((numValue / 100) * movableWidth);
        break;
      }
      case 'ud_pos_percent': {
        const movableHeight = bgHeight! - videoHeightPx;
        newPixelTransform.y = movableHeight <= 0 ? movableHeight / 2 : Math.round((numValue / 100) * movableHeight);
        break;
      }
      case 'width_percent': {
        const newWidthPx = Math.max(1, Math.round((numValue / 100) * bgWidth!));
        newPixelTransform.width = newWidthPx;
        newPixelTransform.height = Math.max(1, Math.round(newWidthPx / videoAspectRatio));
        break;
      }
      case 'height_percent': {
        const newHeightPx = Math.max(1, Math.round((numValue / 100) * bgHeight!));
        newPixelTransform.height = newHeightPx;
        newPixelTransform.width = Math.max(1, Math.round(newHeightPx * videoAspectRatio));
        break;
      }
      default:
        return;
    }
    onTransformChange(newPixelTransform);
  };

  const getDisplayPercentages = () => {
    if (!backgroundImageDimensions || !videoAspectRatio) { // Also check videoAspectRatio here
      return { lr: 'N/A', ud: 'N/A', width: 'N/A', height: 'N/A' };
    }

    let lrPercent, udPercent;
    const movableWidth = bgWidth! - videoWidthPx;
    if (movableWidth <= 0) {
      lrPercent = 50; 
    } else {
      lrPercent = (transform.x / movableWidth) * 100;
    }

    const movableHeight = bgHeight! - videoHeightPx;
    if (movableHeight <= 0) {
      udPercent = 50; 
    } else {
      udPercent = (transform.y / movableHeight) * 100;
    }
    
    lrPercent = Math.max(0, Math.min(100, lrPercent));
    udPercent = Math.max(0, Math.min(100, udPercent));

    const widthPercent = (videoWidthPx / bgWidth!) * 100;
    const heightPercent = (videoHeightPx / bgHeight!) * 100;

    return {
      lr: lrPercent.toFixed(1),
      ud: udPercent.toFixed(1),
      width: widthPercent.toFixed(1),
      height: heightPercent.toFixed(1),
    };
  };

  const displayPercentages = getDisplayPercentages();
  const controlsEnabled = !!backgroundImageDimensions && !!videoAspectRatio;


  const handleChromaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'hexColor') {
      onChromaKeyChange({ hexColor: e.target.value });
    } else if (e.target.name === 'tolerance') {
      onChromaKeyChange({ tolerance: parseInt(e.target.value, 10) });
    }
  };

  const transformFields: { key: 'lr_pos_percent' | 'ud_pos_percent' | 'width_percent' | 'height_percent'; label: string; value: string }[] = [
    { key: 'lr_pos_percent', label: 'L/R Position (%)', value: displayPercentages.lr },
    { key: 'ud_pos_percent', label: 'U/D Position (%)', value: displayPercentages.ud },
    { key: 'width_percent', label: 'Width (%)', value: displayPercentages.width },
    { key: 'height_percent', label: 'Height (%)', value: displayPercentages.height },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3 text-indigo-400">Chroma Key Settings</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-300">
              Gemini API Key
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="password"
                name="geminiApiKey"
                id="geminiApiKey"
                className="block w-full flex-1 rounded-none rounded-l-md border-gray-600 bg-gray-700 text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
                placeholder="Enter your API Key"
                value={userApiKey}
                onChange={(e) => onUserApiKeyChange(e.target.value)}
                aria-describedby="gemini-api-key-description"
              />
              <a
                href="https://ai.google.dev/gemini-api/docs/api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-r-md border border-l-0 border-gray-600 bg-gray-600 px-3 text-sm text-gray-300 hover:bg-gray-500 hover:text-indigo-300 transition-colors"
                title="Get your Gemini API Key (opens in new tab)"
              >
                <LinkIcon className="w-4 h-4 mr-1"/> Get Key
              </a>
            </div>
             {!apiKeyAvailable && (
               <p id="gemini-api-key-description" className="mt-1 text-xs text-yellow-400">An API key is required for AI color suggestion.</p>
             )}
          </div>

          <div>
            <label htmlFor="hexColor" className="block text-sm font-medium text-gray-300">Key Color (HEX)</label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                id="nativeColorPicker"
                aria-label="Chroma key color picker"
                value={chromaKeySettings.hexColor}
                onChange={(e) => onChromaKeyChange({ hexColor: e.target.value })}
                className="p-0 w-8 h-8 border-none rounded cursor-pointer bg-gray-700 hover:ring-2 hover:ring-indigo-500"
              />
              <input
                type="text"
                name="hexColor"
                id="hexColor"
                aria-label="Chroma key color HEX input"
                value={chromaKeySettings.hexColor}
                onChange={handleChromaInputChange}
                className="block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5"
                placeholder="#00FF00"
              />
            </div>
          </div>
          <button
            onClick={onSuggestColor}
            disabled={isSuggestingColor || !apiKeyAvailable || !controlsEnabled}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              apiKeyAvailable && controlsEnabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-500 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-150`}
            aria-label={!apiKeyAvailable ? 'AI color suggestion disabled: API Key required' : (isSuggestingColor ? 'Suggesting color with AI' : 'Suggest color with AI')}
          >
            {isSuggestingColor ? (
              <LoadingSpinner className="w-5 h-5 mr-2" />
            ) : (
              <MagicWandIcon className="w-5 h-5 mr-2" />
            )}
            Suggest Color with AI
          </button>
          
          <div>
            <label htmlFor="tolerance" className="block text-sm font-medium text-gray-300">Tolerance: {chromaKeySettings.tolerance}</label>
            <input
              type="range"
              name="tolerance"
              id="tolerance"
              min="0"
              max="255"
              value={chromaKeySettings.tolerance}
              onChange={handleChromaInputChange}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-1 accent-indigo-500"
              aria-label={`Chroma key tolerance: ${chromaKeySettings.tolerance}`}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-indigo-400">Video Transform</h3>
            {videoAspectRatio && <LockClosedIcon className="w-5 h-5 text-indigo-400" titleAccessText="Aspect ratio locked" />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {transformFields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="block text-sm font-medium text-gray-300">{field.label}</label>
              <input
                type="number"
                name={field.key}
                id={field.key}
                aria-label={`Video transform ${field.label}`}
                value={field.value === 'N/A' ? '' : field.value}
                onChange={handlePercentageInputChange}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                step="0.1" 
                min="0" 
                disabled={!controlsEnabled}
                placeholder={field.value === 'N/A' ? 'N/A' : ''}
              />
            </div>
          ))}
        </div>
         {!controlsEnabled && videoAspectRatio && <p className="text-xs text-gray-400 mt-2">Upload a background image to enable transform controls.</p>}
         {!videoAspectRatio && <p className="text-xs text-gray-400 mt-2">Upload a video to enable transform controls.</p>}
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2 text-indigo-400">Recording</h3>
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            disabled={!controlsEnabled || !backgroundImageDimensions || !videoAspectRatio } // Ensure all are ready for recording
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            aria-label="Start recording video"
          >
            <RecordIcon className="w-5 h-5 mr-2"/>
            Start Recording
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-150"
            aria-label="Stop recording and download video"
          >
            <StopIcon className="w-5 h-5 mr-2"/>
            Stop Recording & Download
          </button>
        )}
      </div>
    </div>
  );
};
