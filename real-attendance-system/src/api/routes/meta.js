/**
 * Meta Routes
 * API endpoints for system metadata and data freshness
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/query');
const logger = require('../../utils/logger');

/**
 * GET /api/meta/data-freshness
 * Returns timestamps indicating the freshness of data from various sources
 * Used by the dashboard to show "Last updated" information
 */
router.get('/data-freshness', async (req, res) => {
  try {
    const freshness = {
      timestamp: new Date().toISOString(),
      server_time: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      data_sources: {}
    };

    // Check daily_attendance table
    try {
      const attendanceResult = await db.queryOne(`
        SELECT 
          MAX(date) as latest_date,
          MAX(created_at) as latest_created,
          MAX(updated_at) as latest_updated,
          COUNT(*) as total_records
        FROM daily_attendance
      `);
      freshness.data_sources.daily_attendance = {
        latest_date: attendanceResult?.latest_date || null,
        latest_created: attendanceResult?.latest_created || null,
        latest_updated: attendanceResult?.latest_updated || null,
        total_records: attendanceResult?.total_records || 0,
        status: 'ok'
      };
    } catch (err) {
      freshness.data_sources.daily_attendance = {
        status: 'error',
        message: err.message
      };
    }

    // Check staging_facescan table
    try {
      const facescanResult = await db.queryOne(`
        SELECT 
          MAX(scan_datetime) as latest_scan,
          MAX(created_at) as latest_created,
          COUNT(*) as total_records,
          SUM(CASE WHEN is_processed = 1 THEN 1 ELSE 0 END) as processed_count
        FROM staging_facescan
      `);
      freshness.data_sources.staging_facescan = {
        latest_scan: facescanResult?.latest_scan || null,
        latest_created: facescanResult?.latest_created || null,
        total_records: facescanResult?.total_records || 0,
        processed_count: facescanResult?.processed_count || 0,
        status: 'ok'
      };
    } catch (err) {
      freshness.data_sources.staging_facescan = {
        status: 'error',
        message: err.message
      };
    }

    // Check staging_leave table
    try {
      const leaveResult = await db.queryOne(`
        SELECT 
          MAX(created_at) as latest_created,
          COUNT(*) as total_records
        FROM staging_leave
      `);
      freshness.data_sources.staging_leave = {
        latest_created: leaveResult?.latest_created || null,
        total_records: leaveResult?.total_records || 0,
        status: 'ok'
      };
    } catch (err) {
      freshness.data_sources.staging_leave = {
        status: 'error',
        message: err.message
      };
    }

    // Check employees table
    try {
      const employeesResult = await db.queryOne(`
        SELECT 
          MAX(created_at) as latest_created,
          MAX(updated_at) as latest_updated,
          COUNT(*) as total_employees
        FROM employees
      `);
      freshness.data_sources.employees = {
        latest_created: employeesResult?.latest_created || null,
        latest_updated: employeesResult?.latest_updated || null,
        total_employees: employeesResult?.total_employees || 0,
        status: 'ok'
      };
    } catch (err) {
      freshness.data_sources.employees = {
        status: 'error',
        message: err.message
      };
    }

    // Check system_logs for latest sync activity
    try {
      const syncResult = await db.queryOne(`
        SELECT 
          action,
          details,
          created_at as last_sync_time
        FROM system_logs 
        WHERE action LIKE '%sync%' OR action LIKE '%n8n%' OR action LIKE '%import%'
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      freshness.last_sync = syncResult ? {
        action: syncResult.action,
        time: syncResult.last_sync_time,
        status: 'ok'
      } : {
        status: 'no_sync_records'
      };
    } catch (err) {
      freshness.last_sync = {
        status: 'error',
        message: err.message
      };
    }

    // Calculate overall freshness
    const allDates = [
      freshness.data_sources.daily_attendance?.latest_created,
      freshness.data_sources.daily_attendance?.latest_updated,
      freshness.data_sources.staging_facescan?.latest_created,
      freshness.data_sources.staging_leave?.latest_created,
      freshness.data_sources.employees?.latest_updated
    ].filter(d => d != null);

    if (allDates.length > 0) {
      const latestDate = allDates.reduce((latest, current) => {
        const currentDate = new Date(current);
        return currentDate > new Date(latest) ? current : latest;
      });
      freshness.latest_data_update = latestDate;
      freshness.latest_data_update_bangkok = new Date(latestDate).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    }

    res.json({
      success: true,
      data: freshness,
      message: 'Data freshness retrieved'
    });

  } catch (error) {
    logger.error('Error getting data freshness', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve data freshness',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/meta/server-time
 * Returns current server time (useful for sync verification)
 */
router.get('/server-time', (req, res) => {
  const now = new Date();
  res.json({
    success: true,
    data: {
      utc: now.toISOString(),
      bangkok: now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      unix: Math.floor(now.getTime() / 1000)
    },
    message: 'Server time retrieved'
  });
});

module.exports = router;
