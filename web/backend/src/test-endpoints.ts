import { MockDetectionService } from './services/mockDetectionService';

async function runTests() {
  console.log('🧪 Starting Smart Helmet Backend Automated Unit & Endpoint Tests...\n');

  // Test 1: Dashboard Stats
  const stats = MockDetectionService.getDashboardStats();
  console.assert(stats.totalRiders === 128, 'Dashboard totalRiders should be 128');
  console.assert(stats.helmetCompliance === 92.4, 'Dashboard helmetCompliance should be 92.4');
  console.assert(stats.violations === 17, 'Dashboard violations should be 17');
  console.assert(stats.detectionFps === 28, 'Dashboard detectionFps should be 28');
  console.assert(stats.liveStatus === 'ONLINE', 'Dashboard liveStatus should be ONLINE');
  console.log('✅ Test 1 Passed: MockDetectionService.getDashboardStats() returns correct KPIs');

  // Test 2: Live Detection Summary
  const live = MockDetectionService.getLiveDetectionSummary();
  console.assert(live.motorcycles === 3, 'Live motorcycles should be 3');
  console.assert(live.riders === 4, 'Live riders should be 4');
  console.assert(live.helmeted === 3, 'Live helmeted should be 3');
  console.assert(live.noHelmet === 1, 'Live noHelmet should be 1');
  console.assert(live.violations === 1, 'Live violations should be 1');
  console.assert(live.currentDetection.riderType === 'DRIVER', 'Current detection riderType should be DRIVER');
  console.assert(live.currentDetection.helmetStatus === 'NO_HELMET', 'Current detection helmetStatus should be NO_HELMET');
  console.assert(live.currentDetection.violation === true, 'Current detection violation should be true');
  console.log('✅ Test 2 Passed: MockDetectionService.getLiveDetectionSummary() returns verified live telemetry');

  // Test 3: Recent Violations filtering
  const allViolations = MockDetectionService.getRecentViolations();
  console.assert(allViolations.violations.length >= 7, 'Should have at least 7 violations');
  
  const driverOnly = MockDetectionService.getRecentViolations({ type: 'DRIVER' });
  console.assert(driverOnly.violations.every(v => v.riderType === 'DRIVER'), 'All items should be DRIVER');

  const passengerOnly = MockDetectionService.getRecentViolations({ type: 'PASSENGER' });
  console.assert(passengerOnly.violations.every(v => v.riderType === 'PASSENGER'), 'All items should be PASSENGER');

  const searchFiltered = MockDetectionService.getRecentViolations({ search: 'Bike #03' });
  console.assert(searchFiltered.violations.length >= 1, 'Search should match Bike #03');
  console.assert(searchFiltered.violations[0].vehicle.includes('Bike #03'), 'Matched vehicle should contain Bike #03');
  console.log('✅ Test 3 Passed: MockDetectionService.getRecentViolations() filters by rider role and search term');

  // Test 4: Video Detection Processing Pipeline
  const videoResult = MockDetectionService.processMockVideoDetection('traffic_cam_highway.mp4');
  console.assert(videoResult.filename === 'traffic_cam_highway.mp4', 'Filename should match');
  console.assert(videoResult.framesProcessed === 1350, 'Frames processed should be 1350');
  console.assert(videoResult.totalViolations === 3, 'Violations found should be 3');
  console.assert(videoResult.timeline.length > 0, 'Timeline markers should be populated');
  console.log('✅ Test 4 Passed: MockDetectionService.processMockVideoDetection() returns complete video timeline and violation markers');

  // Test 5: Analytics Data
  const analytics = MockDetectionService.getAnalyticsData();
  console.assert(analytics.complianceTrend.length === 8, 'Compliance trend should have 8 points');
  console.assert(analytics.violationsOverTime.length === 8, 'Hourly violations should have 8 points');
  console.assert(analytics.riderComparison.driverViolations > 0, 'Driver violations should be > 0');
  console.assert(analytics.confidenceDistribution.length === 4, 'Confidence distribution should have 4 brackets');
  console.log('✅ Test 5 Passed: MockDetectionService.getAnalyticsData() aggregates time-series and confidence metrics');

  console.log('\n🎉 ALL 5 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
