import ollamaService from './services/ollamaService.js';

async function testOllamaService() {
  console.log('Testing Ollama Service...\n');

  console.log('1. Health Check');
  const health = await ollamaService.checkHealth();
  console.log('   Status:', health ? '✓ Connected' : '✗ Not connected');
  console.log('');

  if (!health) {
    console.log('Please ensure Ollama is running: ollama serve');
    console.log('And that a model is available: ollama pull llama2');
    process.exit(1);
  }

  console.log('2. Testing Simple Generation');
  try {
    const response = await ollamaService.generate('Say hello in 3 words', {
      temperature: 0.7
    });
    console.log('   Response:', response);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  console.log('');

  console.log('3. Testing Location Pattern Analysis');
  try {
    const mockLocations = [
      { lat: 40.7128, lng: -74.0060, timestamp: Date.now() - 300000 },
      { lat: 40.7148, lng: -74.0080, timestamp: Date.now() - 240000 },
      { lat: 40.7168, lng: -74.0100, timestamp: Date.now() - 180000 },
      { lat: 40.7188, lng: -74.0120, timestamp: Date.now() - 120000 },
      { lat: 40.7208, lng: -74.0140, timestamp: Date.now() }
    ];

    const analysis = await ollamaService.analyzeLocationPattern(mockLocations, {
      groupId: 'test-group',
      userId: 'test-user'
    });

    console.log('   Analysis:');
    console.log('     Risk Level:', analysis.riskLevel);
    console.log('     Deviation:', analysis.deviationDetected);
    console.log('     Concerns:', analysis.concerns.length);
    console.log('     Recommendations:', analysis.recommendations.length);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  console.log('');

  console.log('4. Testing Anomaly Detection');
  try {
    const mockLocationData = [
      { lat: 40.7128, lng: -74.0060, timestamp: Date.now(), accuracy: 10 },
      { lat: 40.7128, lng: -74.0060, timestamp: Date.now() + 60000, accuracy: 10 },
      { lat: 40.7128, lng: -74.0060, timestamp: Date.now() + 120000, accuracy: 10 }
    ];

    const anomalies = await ollamaService.detectAnomalies(mockLocationData, {
      userId: 'test-user',
      groupId: 'test-group'
    });

    console.log('   Anomalies:');
    console.log('     Detected:', anomalies.anomaliesDetected);
    console.log('     Type:', anomalies.anomalyType || 'None');
    console.log('     Severity:', anomalies.severity);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  console.log('');

  console.log('5. Testing Safety Analysis');
  try {
    const mockGroupData = {
      members: [
        { clerkId: 'user1', name: 'Alice' },
        { clerkId: 'user2', name: 'Bob' }
      ],
      location: { lat: 40.7128, lng: -74.0060 }
    };

    const safetyAnalysis = await ollamaService.analyzeSafety(mockGroupData, {
      time: new Date().toISOString(),
      weather: 'clear'
    });

    console.log('   Safety Analysis:');
    console.log('     Overall Score:', safetyAnalysis.overallSafetyScore);
    console.log('     Risks:', safetyAnalysis.risks.length);
    console.log('     Alerts:', safetyAnalysis.alerts.length);
    console.log('     Recommendations:', safetyAnalysis.recommendations.length);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  console.log('');

  console.log('✓ All tests completed!');
  process.exit(0);
}

testOllamaService().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
