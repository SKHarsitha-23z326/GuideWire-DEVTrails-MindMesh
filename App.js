import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, 
  ActivityIndicator, SafeAreaView, TextInput, StatusBar 
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';

const BACKEND_URL = "http://192.168.29.36:3000"; 

export default function App() {
  const [userIdInput, setUserIdInput] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  const handleVerifyAndLogin = async () => {
    if (!userIdInput) return Alert.alert("ID Required", "Please enter your Partner ID");
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${userIdInput}`);
      const data = await response.json();
      if (!response.ok) throw new Error("ID not found in database");

      const biometrics = await LocalAuthentication.authenticateAsync({
        promptMessage: `Identity Check: ${data.full_name}`,
      });

      if (biometrics.success) {
        setUserProfile(data);
        setIsAuth(true);
      }
    } catch (e) {
      Alert.alert("Login Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    setLoading(true);
    setCountdown(3);

    try {
      // Step 1: Get REAL Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error("Location access required");
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      // Step 2: Start Sensors
      let readings = [];
      const sub = Accelerometer.addListener(data => {
        readings.push(Math.sqrt(data.x**2 + data.y**2 + data.z**2));
      });

      // Step 3: Visual Countdown
      const timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);

      setTimeout(async () => {
        clearInterval(timer);
        sub.remove();
        
        const avgMovement = readings.reduce((a, b) => a + b, 0) / readings.length;

        // Step 4: Call "Proper Logic" Backend
        const response = await fetch(`${BACKEND_URL}/api/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coords: loc.coords,
            vibrationScore: avgMovement,
            userId: userProfile.id
          })
        });

        const res = await response.json();
        setLoading(false); 
        setCountdown(0);

        if (res.success) {
          Alert.alert("Payout Successful", res.message);
          // Refresh balance
          const refresh = await fetch(`${BACKEND_URL}/api/profile/${userProfile.id}`);
          const newData = await refresh.json();
          setUserProfile(newData);
        } else {
          Alert.alert("Claim Rejected", res.reason);
        }
      }, 3000);

    } catch (err) {
      setLoading(false);
      setCountdown(0);
      Alert.alert("System Error", err.message);
    }
  };

  if (!isAuth) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.logo}>ShieldRoute</Text>
        <TextInput 
          style={styles.input}
          placeholder="Partner ID (e.g. ravi_01)"
          placeholderTextColor="#8c8c8c"
          value={userIdInput}
          onChangeText={setUserIdInput}
        />
        <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyAndLogin}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>VERIFY & LOGIN</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#52c41a" />
          <Text style={styles.overlayText}>VERIFYING CLIMATE & PRESENCE</Text>
          <Text style={styles.timerText}>{countdown}s</Text>
        </View>
      )}
      
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{userProfile?.full_name?.charAt(0)}</Text></View>
        <View>
          <Text style={styles.userName}>{userProfile?.full_name}</Text>
          <Text style={styles.userTier}>{userProfile?.risk_tier}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Wallet</Text>
          <Text style={styles.statValue}>₹{userProfile?.wallet_balance}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, {color: '#52c41a'}]}>Active</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <TouchableOpacity style={styles.payoutBtn} onPress={checkEligibility}>
          <Text style={styles.btnText}>CHECK FOR RAIN PAYOUT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sosBtn} onPress={() => Alert.alert("SOS", "Location sent to rescue teams.")}>
          <Text style={styles.btnText}>ONE-TOUCH SOS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,21,41,0.95)', zIndex: 99, justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 20 },
  timerText: { color: '#52c41a', fontSize: 70, fontWeight: 'bold' },
  loginContainer: { flex: 1, backgroundColor: '#001529', justifyContent: 'center', padding: 30 },
  logo: { color: '#fff', fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#112a45', color: '#fff', padding: 18, borderRadius: 12, marginBottom: 20 },
  loginBtn: { backgroundColor: '#1890ff', padding: 20, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 25 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1890ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userTier: { color: '#8c8c8c', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25 },
  statBox: { backgroundColor: '#112a45', padding: 15, borderRadius: 12, width: '48%' },
  statLabel: { color: '#8c8c8c', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mainContent: { flex: 1, padding: 25, justifyContent: 'center' },
  payoutBtn: { backgroundColor: '#52c41a', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  sosBtn: { backgroundColor: '#ff4d4f', padding: 15, borderRadius: 15, alignItems: 'center' },
});