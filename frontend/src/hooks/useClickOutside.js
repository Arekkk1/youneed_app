import { useEffect } from 'react';

/**
 * Custom hook that triggers a callback when a click occurs outside of the referenced element.
 *
 * @param {React.RefObject} ref - A React ref attached to the element to monitor for outside clicks.
 * @param {Function} handler - The function to call when a click outside the element is detected.
 */
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    // Using 'mousedown' event listener to catch the click before potential state changes
    // that might remove the element before the 'click' event fires.
    document.addEventListener('mousedown', listener);
    // Also listen for touchstart for mobile devices
    document.addEventListener('touchstart', listener);

    // Cleanup function to remove the event listeners when the component unmounts
    // or when the ref/handler dependencies change.
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Re-run the effect if ref or handler function changes
}

export default useClickOutside;
