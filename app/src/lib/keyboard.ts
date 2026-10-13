// How far to lift something pinned to the bottom of the screen (like the reply
// box) so it sits just above the keyboard, including the keyboard's suggested
// words row. It listens to the keyboard itself rather than guessing header
// heights, so it stays right on every iPhone and iOS version, and it updates
// when the suggestions row appears, disappears or changes size.

import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, LayoutAnimation, Platform, type KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useKeyboardLift(gap = 6) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const apply = (height: number, e?: KeyboardEvent) => {
      // Slide the box in step with the keyboard instead of jumping.
      if (ios && e?.duration) {
        LayoutAnimation.configureNext({
          duration: e.duration,
          update: { type: LayoutAnimation.Types.keyboard },
        });
      }
      setKeyboardHeight(height);
    };
    // How much of the screen the keyboard covers, measured from where its top
    // edge will end up. When it's closing, its top is at the bottom of the
    // screen, so this comes out as 0.
    const onShow = (e: KeyboardEvent) => {
      const covered = Dimensions.get('screen').height - e.endCoordinates.screenY;
      apply(ios ? Math.max(0, covered) : e.endCoordinates.height, e);
    };
    const onHide = (e: KeyboardEvent) => apply(0, e);

    const subs = ios
      ? [
          Keyboard.addListener('keyboardWillShow', onShow),
          Keyboard.addListener('keyboardWillChangeFrame', onShow),
          Keyboard.addListener('keyboardWillHide', onHide),
        ]
      : [Keyboard.addListener('keyboardDidShow', onShow), Keyboard.addListener('keyboardDidHide', onHide)];
    return () => subs.forEach((s) => s.remove());
  }, []);

  // The screen already leaves room for the home indicator at the bottom; the
  // keyboard covers that area, so only lift by the rest, plus a small gap.
  return keyboardHeight > 0 ? Math.max(0, keyboardHeight - insets.bottom) + gap : 0;
}
