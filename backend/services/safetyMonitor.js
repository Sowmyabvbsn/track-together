import ollamaService from './ollamaService.js';
import SafetyAlert from '../models/SafetyAlert.js';
import UserLocation from '../models/UserLocation.js';
import Group from '../models/Group.js';
import { getDistance, getSpeed } from 'geolib';

class SafetyMonitor {
  constructor() {
    this.SPEED_THRESHOLD = 120;
    this.DANGEROUS_SPEED = 150;
    this.EXTENDED_STOP_DURATION = 30 * 60 * 1000;
    this.NO_MOVEMENT_DURATION = 60 * 60 * 1000;
    this.MAX_GROUP_DISTANCE = 5000;
    this.monitoringIntervals = new Map();
  }

  async startMonitoring(groupId, userId, socketIo) {
    const key = `${groupId}-${userId}`;

    if (this.monitoringIntervals.has(key)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await this.performSafetyCheck(groupId, userId, socketIo);
      } catch (error) {
        console.error('Safety check error:', error);
      }
    }, 30000);

    this.monitoringIntervals.set(key, interval);
    console.log(`Started safety monitoring for ${userId} in group ${groupId}`);
  }

  stopMonitoring(groupId, userId) {
    const key = `${groupId}-${userId}`;
    const interval = this.monitoringIntervals.get(key);

    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(key);
      console.log(`Stopped safety monitoring for ${userId} in group ${groupId}`);
    }
  }

  async performSafetyCheck(groupId, userId, socketIo) {
    const recentLocations = await UserLocation.find({
      groupId,
      clerkId: userId
    })
      .sort({ timestamp: -1 })
      .limit(10);

    if (recentLocations.length < 2) {
      return;
    }

    const group = await Group.findById(groupId);
    if (!group) return;

    const currentLocation = recentLocations[0];
    const previousLocation = recentLocations[1];

    const checks = await Promise.all([
      this.checkSpeed(groupId, userId, currentLocation, previousLocation),
      this.checkRouteDeviation(groupId, userId, recentLocations),
      this.checkExtendedStop(groupId, userId, recentLocations),
      this.checkGroupSeparation(groupId, userId, currentLocation),
      this.checkAIAnomalies(groupId, userId, recentLocations, group)
    ]);

    const alerts = checks.filter(alert => alert !== null);

    for (const alert of alerts) {
      await this.createAndNotifyAlert(alert, socketIo);
    }
  }

  async checkSpeed(groupId, userId, current, previous) {
    const distance = getDistance(
      { latitude: previous.latitude, longitude: previous.longitude },
      { latitude: current.latitude, longitude: current.longitude }
    );

    const timeDiff = (current.timestamp - previous.timestamp) / 1000;
    const speedKmh = (distance / timeDiff) * 3.6;

    if (speedKmh > this.DANGEROUS_SPEED) {
      return {
        groupId,
        userId,
        alertType: 'unusual_speed',
        severity: 'critical',
        title: 'Dangerous Speed Detected',
        description: `User is traveling at ${Math.round(speedKmh)} km/h, which is unusually fast and may indicate danger.`,
        location: {
          latitude: current.latitude,
          longitude: current.longitude,
          accuracy: current.accuracy
        },
        aiAnalysis: {
          confidence: 0.95,
          reasoning: 'Speed significantly exceeds normal travel patterns',
          recommendations: [
            'Check if user is in emergency situation',
            'Contact user immediately',
            'Monitor next location update closely'
          ]
        },
        metadata: {
          speed: speedKmh,
          threshold: this.DANGEROUS_SPEED
        },
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      };
    } else if (speedKmh > this.SPEED_THRESHOLD) {
      return {
        groupId,
        userId,
        alertType: 'unusual_speed',
        severity: 'medium',
        title: 'High Speed Detected',
        description: `User is traveling at ${Math.round(speedKmh)} km/h.`,
        location: {
          latitude: current.latitude,
          longitude: current.longitude,
          accuracy: current.accuracy
        },
        aiAnalysis: {
          confidence: 0.8,
          reasoning: 'Speed above normal threshold',
          recommendations: ['Monitor speed trends', 'Check route safety']
        },
        metadata: {
          speed: speedKmh
        },
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000)
      };
    }

    return null;
  }

  async checkRouteDeviation(groupId, userId, locationHistory) {
    if (locationHistory.length < 3) return null;

    const aiAnalysis = await ollamaService.analyzeLocationPattern(
      locationHistory.map(loc => ({
        lat: loc.latitude,
        lng: loc.longitude,
        timestamp: loc.timestamp
      })),
      { groupId, userId }
    );

    if (aiAnalysis.deviationDetected && aiAnalysis.riskLevel !== 'low') {
      return {
        groupId,
        userId,
        alertType: 'route_deviation',
        severity: aiAnalysis.riskLevel === 'critical' ? 'critical' :
                  aiAnalysis.riskLevel === 'high' ? 'high' : 'medium',
        title: 'Route Deviation Detected',
        description: aiAnalysis.reasoning || 'User has deviated from expected route pattern.',
        location: {
          latitude: locationHistory[0].latitude,
          longitude: locationHistory[0].longitude,
          accuracy: locationHistory[0].accuracy
        },
        aiAnalysis: {
          confidence: 0.85,
          reasoning: aiAnalysis.reasoning,
          recommendations: aiAnalysis.recommendations
        },
        metadata: {
          actualRoute: locationHistory.slice(0, 3).map(l => ({
            lat: l.latitude,
            lng: l.longitude
          }))
        },
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      };
    }

    return null;
  }

  async checkExtendedStop(groupId, userId, locationHistory) {
    if (locationHistory.length < 3) return null;

    const recent = locationHistory.slice(0, 3);
    let hasMovement = false;

    for (let i = 0; i < recent.length - 1; i++) {
      const distance = getDistance(
        { latitude: recent[i].latitude, longitude: recent[i].longitude },
        { latitude: recent[i + 1].latitude, longitude: recent[i + 1].longitude }
      );

      if (distance > 50) {
        hasMovement = true;
        break;
      }
    }

    if (!hasMovement) {
      const timeStopped = Date.now() - recent[recent.length - 1].timestamp;

      if (timeStopped > this.NO_MOVEMENT_DURATION) {
        return {
          groupId,
          userId,
          alertType: 'no_movement',
          severity: 'high',
          title: 'No Movement Detected',
          description: `User has not moved for ${Math.round(timeStopped / (60 * 1000))} minutes.`,
          location: {
            latitude: recent[0].latitude,
            longitude: recent[0].longitude,
            accuracy: recent[0].accuracy
          },
          aiAnalysis: {
            confidence: 0.9,
            reasoning: 'Extended period without location updates or movement',
            recommendations: [
              'Contact user to verify safety',
              'Check if device is functional',
              'Consider emergency contact if no response'
            ]
          },
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
        };
      } else if (timeStopped > this.EXTENDED_STOP_DURATION) {
        return {
          groupId,
          userId,
          alertType: 'extended_stop',
          severity: 'medium',
          title: 'Extended Stop',
          description: `User has been stationary for ${Math.round(timeStopped / (60 * 1000))} minutes.`,
          location: {
            latitude: recent[0].latitude,
            longitude: recent[0].longitude,
            accuracy: recent[0].accuracy
          },
          aiAnalysis: {
            confidence: 0.75,
            reasoning: 'User stationary longer than expected',
            recommendations: ['Verify if stop is planned', 'Send check-in message']
          },
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        };
      }
    }

    return null;
  }

  async checkGroupSeparation(groupId, userId, currentLocation) {
    const allLocations = await UserLocation.find({ groupId })
      .sort({ timestamp: -1 });

    const latestByUser = new Map();
    for (const loc of allLocations) {
      if (!latestByUser.has(loc.clerkId)) {
        latestByUser.set(loc.clerkId, loc);
      }
    }

    if (latestByUser.size < 2) return null;

    const userLocation = latestByUser.get(userId);
    if (!userLocation) return null;

    let maxDistance = 0;
    let farthestUser = null;

    for (const [otherId, otherLoc] of latestByUser) {
      if (otherId === userId) continue;

      const distance = getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: otherLoc.latitude, longitude: otherLoc.longitude }
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        farthestUser = otherId;
      }
    }

    if (maxDistance > this.MAX_GROUP_DISTANCE) {
      return {
        groupId,
        userId,
        alertType: 'group_separation',
        severity: 'medium',
        title: 'Group Widely Separated',
        description: `Group members are ${Math.round(maxDistance / 1000)} km apart.`,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy
        },
        aiAnalysis: {
          confidence: 0.85,
          reasoning: 'Group members separated beyond normal threshold',
          recommendations: [
            'Check if separation is intentional',
            'Consider regrouping if needed',
            'Maintain communication'
          ]
        },
        metadata: {
          maxDistance,
          farthestUser
        },
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      };
    }

    return null;
  }

  async checkAIAnomalies(groupId, userId, locationHistory, group) {
    try {
      const anomalyAnalysis = await ollamaService.detectAnomalies(
        locationHistory.map(loc => ({
          lat: loc.latitude,
          lng: loc.longitude,
          timestamp: loc.timestamp,
          accuracy: loc.accuracy
        })),
        { userId, groupId, groupSize: group.members.length }
      );

      if (anomalyAnalysis.anomaliesDetected && anomalyAnalysis.severity !== 'low') {
        return {
          groupId,
          userId,
          alertType: 'dangerous_area',
          severity: anomalyAnalysis.severity,
          title: 'Unusual Pattern Detected',
          description: anomalyAnalysis.details.join('. '),
          location: {
            latitude: locationHistory[0].latitude,
            longitude: locationHistory[0].longitude,
            accuracy: locationHistory[0].accuracy
          },
          aiAnalysis: {
            confidence: 0.8,
            reasoning: `AI detected: ${anomalyAnalysis.anomalyType}`,
            recommendations: anomalyAnalysis.suggestedActions
          },
          expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000)
        };
      }
    } catch (error) {
      console.error('AI anomaly detection error:', error);
    }

    return null;
  }

  async createAndNotifyAlert(alertData, socketIo) {
    const existingAlert = await SafetyAlert.findOne({
      groupId: alertData.groupId,
      userId: alertData.userId,
      alertType: alertData.alertType,
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    });

    if (existingAlert) {
      return existingAlert;
    }

    const alert = new SafetyAlert(alertData);
    await alert.save();

    if (socketIo) {
      socketIo.to(alertData.groupId.toString()).emit('safety_alert', {
        alert: alert.toObject(),
        timestamp: new Date()
      });
    }

    return alert;
  }

  async getActiveAlerts(groupId, userId = null) {
    const query = {
      groupId,
      status: 'active',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (userId) {
      query.userId = userId;
    }

    return await SafetyAlert.find(query).sort({ createdAt: -1 });
  }

  async acknowledgeAlert(alertId, userId) {
    const alert = await SafetyAlert.findById(alertId);
    if (!alert) return null;

    alert.acknowledgedBy.push({
      userId,
      timestamp: new Date()
    });

    if (alert.status === 'active') {
      alert.status = 'acknowledged';
    }

    await alert.save();
    return alert;
  }

  async resolveAlert(alertId, userId, resolution) {
    const alert = await SafetyAlert.findById(alertId);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedBy = {
      userId,
      timestamp: new Date(),
      resolution
    };

    await alert.save();
    return alert;
  }
}

export default new SafetyMonitor();
