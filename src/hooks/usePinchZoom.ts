import { useState, useRef, useCallback } from "react";

interface PinchZoomState {
  scale: number;
  position: { x: number; y: number };
  isZoomed: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
}

function getDistance(touch1: TouchPoint, touch2: TouchPoint): number {
  const dx = touch1.x - touch2.x;
  const dy = touch1.y - touch2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMidpoint(touch1: TouchPoint, touch2: TouchPoint): TouchPoint {
  return {
    x: (touch1.x + touch2.x) / 2,
    y: (touch1.y + touch2.y) / 2,
  };
}

export function usePinchZoom(minScale = 1, maxScale = 4) {
  const [state, setState] = useState<PinchZoomState>({
    scale: 1,
    position: { x: 50, y: 50 },
    isZoomed: false,
  });

  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const lastTouchPosition = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
      initialDistance.current = getDistance(touch1, touch2);
      initialScale.current = state.scale;
    } else if (e.touches.length === 1 && state.isZoomed) {
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [state.scale, state.isZoomed]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialDistance.current !== null) {
      e.preventDefault();
      const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
      const currentDistance = getDistance(touch1, touch2);
      const midpoint = getMidpoint(touch1, touch2);
      
      // Calculate new scale
      const scaleChange = currentDistance / initialDistance.current;
      let newScale = initialScale.current * scaleChange;
      newScale = Math.max(minScale, Math.min(maxScale, newScale));
      
      // Calculate position based on pinch midpoint
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((midpoint.x - rect.left) / rect.width) * 100;
      const y = ((midpoint.y - rect.top) / rect.height) * 100;
      
      setState({
        scale: newScale,
        position: { x, y },
        isZoomed: newScale > 1.1,
      });
    } else if (e.touches.length === 1 && state.isZoomed && lastTouchPosition.current) {
      // Pan when zoomed with single finger
      const rect = e.currentTarget.getBoundingClientRect();
      const deltaX = (e.touches[0].clientX - lastTouchPosition.current.x) / rect.width * 100;
      const deltaY = (e.touches[0].clientY - lastTouchPosition.current.y) / rect.height * 100;
      
      setState(prev => ({
        ...prev,
        position: {
          x: Math.max(0, Math.min(100, prev.position.x - deltaX)),
          y: Math.max(0, Math.min(100, prev.position.y - deltaY)),
        },
      }));
      
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [minScale, maxScale, state.isZoomed]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      initialDistance.current = null;
    }
    if (e.touches.length === 0) {
      lastTouchPosition.current = null;
      // Snap back to normal if scale is close to 1
      if (state.scale < 1.2) {
        setState({
          scale: 1,
          position: { x: 50, y: 50 },
          isZoomed: false,
        });
      }
    }
  }, [state.scale]);

  const reset = useCallback(() => {
    setState({
      scale: 1,
      position: { x: 50, y: 50 },
      isZoomed: false,
    });
    initialDistance.current = null;
    lastTouchPosition.current = null;
  }, []);

  const toggleZoom = useCallback(() => {
    setState(prev => ({
      scale: prev.isZoomed ? 1 : 2.5,
      position: { x: 50, y: 50 },
      isZoomed: !prev.isZoomed,
    }));
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      position: { x, y },
    }));
  }, []);

  return {
    scale: state.scale,
    position: state.position,
    isZoomed: state.isZoomed,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset,
    toggleZoom,
    updatePosition,
  };
}
