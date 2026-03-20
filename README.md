🛡️ ShieldRoute: Parametric Disaster Protection for the Last Mile
ShieldRoute is a fraud-resistant, sensor-driven insurance platform designed for gig economy workers (delivery and logistics partners). It provides instant financial relief during climate disasters using parametric triggers, eliminating the need for manual claims or long waiting periods.

🚀 The Problem
When heavy rain or floods hit cities like Coimbatore, delivery partners lose their daily earnings instantly. Traditional insurance is too slow, and claiming small amounts is often not worth the paperwork. Partners are left without a safety net during the most dangerous working conditions.

💡 Our Solution
ShieldRoute automates the insurance lifecycle. We use Sensor Fusion to create a "Proof of Presence" and "Proof of Climate." If it is raining at your GPS location and your phone sensors detect you are physically there, a payout is triggered automatically.

🛠️ Tech Stack
Frontend: React Native (Expo SDK 54)

Backend: Node.js & Express.js

Database: Supabase (PostgreSQL)

APIs: OpenWeatherMap (Climate Verification), Google Geolocation

Sensors: Accelerometer (Physical Presence Confidence Score - PPCS)

Security: LocalAuthentication (Biometric Fingerprint/FaceID)

🌟 Key Features
Biometric Gate: Secure login linked to unique Partner IDs.

Climate Audit: Real-time API check to verify if rainfall exceeds the 0.5mm threshold at the user's exact coordinates.

Anti-Fraud (PPCS): A 3-second accelerometer audit to ensure the phone isn't sitting on a table while a user tries to spoof a claim from home.

Instant Wallet: Real-time balance updates via Supabase RPC functions.

One-Touch SOS: Emergency location broadcast for partners trapped in disaster zones.

👥 The Team
Built with ❤️ for DEVTrails 2026 by MindMesh.
