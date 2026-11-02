# Original sanctuary ambience

Source: `src/game/audio/ambience.ts`, authored for MyZooTwin V1. No downloaded samples, recordings, proprietary imitation, external service or microphone. Original deterministic mono synthesis combines filtered noise with short sine chirps. It is stylized game ambience, not an educational recording of Ara ararauna calls. It carries the project owner's original-code rights; no additional third-party sound license or attribution obligation.

Eight-second loop, 22,050 samples/second, one channel, 176,400 float samples (705,600 bytes in memory). Generated only after explicit unmute/user activation; no audio network payload. One buffer source, gain and analyser under one AudioContext, independent of simulation speed, no audio RAF/timer. Default mute; pause/background/context disposal silence the graph. Existing Three.js MIT notice remains unchanged.

Implementation references: [MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [AudioContext lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext). Actual speaker audibility and physical-device behavior require device tests; running context or nonzero analyser samples alone are not proof of speaker output.
