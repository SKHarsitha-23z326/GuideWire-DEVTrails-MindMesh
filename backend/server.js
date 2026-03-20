const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

// --- CONFIGURATION ---
const supabaseUrl = 'https://qvhzietkeaoviidfgfsj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2aHppZXRrZWFvdmlpZGZnZnNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk4ODAxMCwiZXhwIjoyMDg5NTY0MDEwfQ.j_j-jBZOqR7mf0Oxpk0gHtbt3xRAs-D1JKoEF-9n09s'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const WEATHER_API_KEY = "e71a9fc2ff181994b3eb043863192694"; 

// 1. Fetch Profile Logic
app.get('/api/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return res.status(404).json({ error: "User not found" });
    res.json(data);
});

// 2. The "Proper Logic" Payout Engine
app.post('/api/claim', async (req, res) => {
    const { coords, vibrationScore, userId } = req.body;
    const { latitude, longitude } = coords;

    try {
        // --- A. REAL CLIMATE CHECK ---
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl);
        
        // OpenWeather returns rain in '1h' object if it's currently raining
        const rainAmount = weatherResponse.data.rain ? weatherResponse.data.rain['1h'] : 0;

        // --- B. ACTUAL PRESENCE CHECK ---
        // vibrationScore > 1.02 proves the phone is in a moving hand/vehicle
        const isPhysicallyPresent = vibrationScore > 1.02;

        // --- C. FINAL PARAMETRIC VERIFICATION ---
        // Threshold: > 0.1mm rain (Actual rain) + Presence
        if (rainAmount > 0.1 && isPhysicallyPresent) {
            const payout = 500;

            // Update Wallet in Supabase
            const { error: rpcError } = await supabase.rpc('increment_wallet', { 
                user_id: userId, 
                amount: payout 
            });

            if (rpcError) throw rpcError;

            return res.json({ 
                success: true, 
                amount: payout,
                message: `Verified! Rain: ${rainAmount}mm. Movement: Valid.`
            });
        }

        // Detailed Failure Reasons for the App
        let reason = "Claim Rejected: ";
        if (rainAmount <= 0.1) reason += `It's not raining enough (${rainAmount}mm). `;
        if (!isPhysicallyPresent) reason += "Phone is static (Fraud suspected).";

        res.status(400).json({ success: false, reason });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, reason: "Weather API or Database Error" });
    }
});

app.listen(3000, () => console.log('ShieldRoute Backend: LIVE on Port 3000'));