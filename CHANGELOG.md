# Changelog

All notable changes to the **Regalia Announcements** mobile application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-05-27

### Changed
- **Full Splash Playback**: Adjusted the splash experience to allow the video to play entirely to completion, ensuring the full high-fidelity cinematic splash intro is presented.
- **Intelligent Loading Screen Fallback**: Hidden the static fallback loading screen by default on startup, displaying it dynamically only if network delays or video loading issues trigger the fallback timeout.
- **Visual Cleanups**: Cleaned up empty feed markup and container skeletons during transition states to ensure a cleaner visual presentation.

### Fixed
- **Flicker Mitigation**: Resolved splash screen flicker and visibility glitches on load by hiding the video element until it is fully loaded and ready to play.
- **Transition Overhaul**: Removed display/visibility toggles that occasionally suppressed the video entirely, implementing an elegant CSS fade-in transition triggered immediately when the video playback event starts.
- **Timer Handling**: Refactored splash lifecycle timers to ensure all register and fallback timeouts are cleanly and reliably cleared, preventing race conditions or overlapping states.


---

## [1.2.0] - 2026-05-26

### Added
- **Persistent Keystore Integration**: Generated and configured a persistent release-signing keystore (`regalia.keystore`) inside the Gradle build flow, securing automated release and debug signing to support seamless over-the-air application updates.
- **Automated Announcement Refresh**: Implemented an automated background polling mechanism inside the core JavaScript bundle to refresh announcements automatically, keeping announcements current without requiring manual user interaction.
- **Immersive Video Splash Screen**: Integrated a cinematic high-fidelity MP4 video splash screen (`public/assets/splash.mp4`) accompanied by status UI indicators and dedicated notification assets (`ic_stat_regalia_notification.png`).

### Changed
- **Asset Optimization & Auditor compliance**: Compressed and standardized the Android launcher icons (`ic_launcher.png`, `ic_launcher_round.png`, and foreground XML assets) across all DPI buckets (`mdpi` through `xxxhdpi`), significantly reducing the final binary size and fully complying with Code Auditor standards.
- **Frontend Refinement**: Conducted styling and structural cleanups across `src/main.js` to streamline rendering routines and improve responsiveness.

### Fixed
- **Visual Overlap Mitigation**: Added transition event hooks to completely hide the static splash fallback loader only after the MP4 video splash starts playing, eliminating visual overlap artifacts on startup.

---

## [1.1.0] - 2026-05-25

### Added
- **Audit Compliance Patches**: Added `compileOptions` and bumped the build JDK version to Java 21 to utilize modern Java standard features.
- **Diagnostic Utilities**: Seeded project testing configurations including `codex-test.txt`.

### Changed
- **Workflow Pipeline Redirection**: Updated GitHub Actions build pipelines to compile and archive a direct, test-ready Debug APK instead of an unsigned, install-restricted Release APK.

### Fixed
- **Reliable WebView Internet Connection**: Discarded unreliable `navigator.onLine` checks that caused false-positives and network dropouts inside the Android WebView container, permanently restoring solid remote network communication.
- **Native Announcement Resolution**: Patched native cross-origin announcement fetching by tuning the Android Manifest permissions and aligning domain allowlists (`allowNavigation` rules) in `capacitor.config.json`.

### Removed
- **Brittle Mock Data**: Eliminated local mock data fallbacks and offline dummy mock announcements from the core app configuration to ensure strict, authentic live API synchronization.

---

## [1.0.0] - 2026-05-20

### Added
- **Initial Baseline Scaffold**: Established the foundational architecture for the **Regalia Announcements** Android application using Capacitor, Tailwind CSS, and vanilla JavaScript.
- **Fluid Layout Engine**: Designed an announcement display layout integrated with Tailwind styles for scalable typography, dynamic layout structure, and unified custom UI styling.
- **Continuous Integration Pipeline**: Configured a complete GitHub Actions CI script (`android-build.yml`) for automated linting, building, and validation of Android builds.

[1.3.0]: https://github.com/JaySmiles/regalia-announcements/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/JaySmiles/regalia-announcements/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/JaySmiles/regalia-announcements/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/JaySmiles/regalia-announcements/releases/tag/v1.0.0

