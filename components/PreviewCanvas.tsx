
import React, { useEffect, useRef } from 'react';
import type { VideoTransform, ChromaKeySettings } from '../types';

interface BackgroundImageDimensions {
  width: number;
  height: number;
}

interface PreviewCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  backgroundImageUrl: string | null;
  backgroundImageDimensions: BackgroundImageDimensions | null; // Added
  videoElement: HTMLVideoElement | null;
  videoTransform: VideoTransform;
  chromaKeySettings: ChromaKeySettings;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  canvasRef,
  backgroundImageUrl,
  backgroundImageDimensions, // Added
  videoElement,
  videoTransform,
  chromaKeySettings,
}) => {
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load background image into an Image object for drawing
  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image();
      img.onload = () => {
        bgImageRef.current = img;
        // No need to call onBackgroundLoad, App.tsx handles dimensions
      };
      img.onerror = () => {
        console.error("Failed to load background image into Image object for PreviewCanvas:", backgroundImageUrl);
        bgImageRef.current = null;
      }
      img.src = backgroundImageUrl;
    } else {
      bgImageRef.current = null;
    }
  }, [backgroundImageUrl]);
  
  // Setup offscreen canvas
  useEffect(() => {
    offscreenCanvasRef.current = document.createElement('canvas');
  }, []);

  // Animation loop for drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    
    if (!canvas || !videoElement || !offscreenCanvas) {
      return;
    }

    // Use dimensions from props to set canvas size
    if (backgroundImageDimensions && backgroundImageDimensions.width > 0 && backgroundImageDimensions.height > 0) {
      if (canvas.width !== backgroundImageDimensions.width) {
        canvas.width = backgroundImageDimensions.width;
      }
      if (canvas.height !== backgroundImageDimensions.height) {
        canvas.height = backgroundImageDimensions.height;
      }
    } else {
      // If no valid background dimensions, don't attempt to draw or clear to a specific size.
      // Or, clear to a default/previous size if desired, but for now, just return.
      return; 
    }
    
    // Ensure bgImageRef.current is loaded before trying to use it
    if (!bgImageRef.current || bgImageRef.current.naturalWidth === 0 || bgImageRef.current.naturalHeight === 0) {
       // If the image object isn't ready, attempt to draw background from URL if canvas dimensions are set
       // but ideally, we wait for bgImageRef.current
       const ctx = canvas.getContext('2d');
       if(ctx && backgroundImageDimensions) { // Draw a placeholder or clear
           ctx.fillStyle = '#374151'; // gray-700
           ctx.fillRect(0,0, canvas.width, canvas.height);
       }
       // console.log("bgImageRef.current not ready or has no dimensions");
       // Keep the requestAnimationFrame loop going if you expect it to load
       // For now, let's just return to avoid drawing with incomplete data
       // return; 
    }


    const ctx = canvas.getContext('2d');
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

    if (!ctx || !offscreenCtx) return;
    
    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        if(offscreenCanvas.width !== videoElement.videoWidth) offscreenCanvas.width = videoElement.videoWidth;
        if(offscreenCanvas.height !== videoElement.videoHeight) offscreenCanvas.height = videoElement.videoHeight;
    }


    let animationFrameId: number;

    const render = () => {
      // Ensure canvas has valid dimensions before drawing
      if (canvas.width === 0 || canvas.height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background image if available and loaded
      if (bgImageRef.current && bgImageRef.current.complete && bgImageRef.current.naturalWidth > 0) {
        ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
      } else if (backgroundImageDimensions) { // Fallback to gray if image object not ready but dimensions known
        ctx.fillStyle = '#374151'; // gray-700
        ctx.fillRect(0,0, canvas.width, canvas.height);
      }


      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        // Ensure offscreen canvas is sized for video
        if(offscreenCanvas.width !== videoElement.videoWidth) offscreenCanvas.width = videoElement.videoWidth;
        if(offscreenCanvas.height !== videoElement.videoHeight) offscreenCanvas.height = videoElement.videoHeight;

        offscreenCtx.clearRect(0,0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.drawImage(videoElement, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

        try {
          const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const data = imageData.data;
          const keyColor = chromaKeySettings.color;
          const tolerance = chromaKeySettings.tolerance;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const distance = Math.sqrt(
              Math.pow(r - keyColor.r, 2) +
              Math.pow(g - keyColor.g, 2) +
              Math.pow(b - keyColor.b, 2)
            );

            if (distance < tolerance) {
              data[i + 3] = 0; 
            }
          }
          offscreenCtx.putImageData(imageData, 0, 0);
        } catch (error) {
          console.error("Error processing video frame (getImageData):", error);
          // Draw video directly if processing fails
          ctx.drawImage(
              videoElement,
              videoTransform.x,
              videoTransform.y,
              videoTransform.width,
              videoTransform.height
          );
          animationFrameId = requestAnimationFrame(render);
          return; 
        }
        
        ctx.drawImage(
          offscreenCanvas,
          videoTransform.x,
          videoTransform.y,
          videoTransform.width,
          videoTransform.height
        );
      } else if (backgroundImageDimensions) { // If video not ready, but background is, ensure background is drawn
         // Already drawn above, but this can be a placeholder spot if needed
      }


      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoElement, bgImageRef, canvasRef, videoTransform, chromaKeySettings, offscreenCanvasRef, backgroundImageDimensions, backgroundImageUrl]);


  return (
    <canvas 
        ref={canvasRef} 
        className="w-full h-auto object-contain rounded-lg border border-indigo-500 shadow-lg" 
        style={{maxWidth: '100%', maxHeight: 'calc(100vh - 200px)'}} 
    />
  );
};
