import express from 'express';
import safetyMonitor from '../services/safetyMonitor.js';
import SafetyAlert from '../models/SafetyAlert.js';
import Group from '../models/Group.js';

const router = express.Router();

router.post('/monitor/start', async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.some(m => m.clerkId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    safetyMonitor.startMonitoring(groupId, userId, req.app.get('socketio'));

    res.json({
      success: true,
      message: 'Safety monitoring started'
    });
  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

router.post('/monitor/stop', async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    safetyMonitor.stopMonitoring(groupId, userId);

    res.json({
      success: true,
      message: 'Safety monitoring stopped'
    });
  } catch (error) {
    console.error('Stop monitoring error:', error);
    res.status(500).json({ error: 'Failed to stop monitoring' });
  }
});

router.get('/alerts/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.query;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.some(m => m.clerkId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const alerts = await safetyMonitor.getActiveAlerts(groupId);

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.get('/alerts/user/:groupId/:userId', async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.some(m => m.clerkId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const alerts = await safetyMonitor.getActiveAlerts(groupId, userId);

    res.json({ alerts });
  } catch (error) {
    console.error('Get user alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.patch('/alerts/:alertId/acknowledge', async (req, res) => {
  const { alertId } = req.params;
  const { userId } = req.body;

  try {
    const alert = await safetyMonitor.acknowledgeAlert(alertId, userId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const socketIo = req.app.get('socketio');
    if (socketIo) {
      socketIo.to(alert.groupId.toString()).emit('alert_acknowledged', {
        alertId: alert._id,
        userId,
        timestamp: new Date()
      });
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

router.patch('/alerts/:alertId/resolve', async (req, res) => {
  const { alertId } = req.params;
  const { userId, resolution } = req.body;

  try {
    const alert = await safetyMonitor.resolveAlert(alertId, userId, resolution);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const socketIo = req.app.get('socketio');
    if (socketIo) {
      socketIo.to(alert.groupId.toString()).emit('alert_resolved', {
        alertId: alert._id,
        userId,
        resolution,
        timestamp: new Date()
      });
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

router.delete('/alerts/:alertId', async (req, res) => {
  const { alertId } = req.params;
  const { userId } = req.body;

  try {
    const alert = await SafetyAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'dismissed';
    await alert.save();

    const socketIo = req.app.get('socketio');
    if (socketIo) {
      socketIo.to(alert.groupId.toString()).emit('alert_dismissed', {
        alertId: alert._id,
        userId,
        timestamp: new Date()
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

router.get('/stats/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { days = 7 } = req.query;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const alerts = await SafetyAlert.find({
      groupId,
      createdAt: { $gte: startDate }
    });

    const stats = {
      total: alerts.length,
      byType: {},
      bySeverity: {},
      byStatus: {},
      resolvedCount: alerts.filter(a => a.status === 'resolved').length,
      activeCount: alerts.filter(a => a.status === 'active').length
    };

    alerts.forEach(alert => {
      stats.byType[alert.alertType] = (stats.byType[alert.alertType] || 0) + 1;
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
    });

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
