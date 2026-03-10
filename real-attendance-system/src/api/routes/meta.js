/**
 * Meta Routes
 * API endpoints for system metadata and data freshness
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/query');
const logger = require('../../utils/logger');
const { getPool } = require('../../db/connection');
const { logSql } = require('../../utils/sqlLogger');

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
      const sql = `
        SELECT 
          MAX(date) as latest_date,
          MAX(created_at) as latest_created,
          MAX(updated_at) as latest_updated,
          COUNT(*) as total_records
        FROM daily_attendance
      `;
      
      // CRITICAL: Instrument SQL logging
      const endpoint = '/api/meta/data-freshness';
      const params = [];
      const logComplete = logSql(endpoint, sql, params, {
        table: 'daily_attendance',
        operation: 'SELECT_MAX_DATE',
        queryType: 'data_freshness_check'
      });
      
      let attendanceResult;
      try {
        attendanceResult = await db.queryOne(sql);
        logComplete(attendanceResult ? [attendanceResult] : []);
      } catch (error) {
        logComplete(null, error);
        throw error;
      }
      freshness.data_sources.daily_attendance = {
        latest_date: attendanceResult?.latest_date || null,
        latest_created: attendanceResult?.latest_created || null,
        latest_updated: attendanceResult?.latest_updated || null,
        total_records: attendanceResult?.total_records || 0,
        status: 'ok'
      };
      
      // Add latest_available_date for dashboard fallback
      freshness.latest_available_attendance_date = attendanceResult?.latest_date || null;
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
          MAX(updated_at) as latest_updated,
          COUNT(*) as total_records
        FROM staging_leave
      `);
      
      // Get latest leave period (start/end dates) from most recent record
      let latestLeavePeriod = null;
      if (leaveResult?.total_records > 0) {
        // Find the record with the most recent timestamp
        const latestRecord = await db.queryOne(`
          SELECT 
            COALESCE(start_date, DATE(created_at)) as latest_leave_start_date,
            COALESCE(end_date, start_date, DATE(created_at)) as latest_leave_end_date,
            created_at as latest_leave_created_at,
            updated_at as latest_leave_updated_at
          FROM staging_leave
          ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC
          LIMIT 1
        `);
        
        if (latestRecord) {
          // Count records in the same period
          const periodCount = await db.queryOne(`
            SELECT COUNT(*) as count
            FROM staging_leave
            WHERE COALESCE(start_date, DATE(created_at)) = ?
              AND COALESCE(end_date, start_date, DATE(created_at)) = ?
          `, [
            latestRecord.latest_leave_start_date,
            latestRecord.latest_leave_end_date
          ]);
          
          latestLeavePeriod = {
            latest_leave_start_date: latestRecord.latest_leave_start_date || null,
            latest_leave_end_date: latestRecord.latest_leave_end_date || null,
            latest_leave_created_at: latestRecord.latest_leave_created_at || null,
            latest_leave_records_count_for_period: periodCount?.count || 0
          };
          
          // Format period label (YYYY-MM-DD to YYYY-MM-DD)
          if (latestLeavePeriod.latest_leave_start_date && latestLeavePeriod.latest_leave_end_date) {
            if (latestLeavePeriod.latest_leave_start_date === latestLeavePeriod.latest_leave_end_date) {
              latestLeavePeriod.latest_leave_period_label = latestLeavePeriod.latest_leave_start_date;
            } else {
              latestLeavePeriod.latest_leave_period_label = 
                `${latestLeavePeriod.latest_leave_start_date}–${latestLeavePeriod.latest_leave_end_date}`;
            }
          }
          
          // Format Bangkok time for display
          if (latestLeavePeriod.latest_leave_created_at) {
            const bangkokDate = new Date(latestLeavePeriod.latest_leave_created_at);
            latestLeavePeriod.latest_leave_update_bangkok = bangkokDate.toLocaleString('th-TH', {
              timeZone: 'Asia/Bangkok',
              dateStyle: 'short',
              timeStyle: 'short'
            });
          }
        }
      }
      
      freshness.data_sources.staging_leave = {
        latest_created: leaveResult?.latest_created || null,
        latest_updated: leaveResult?.latest_updated || null,
        total_records: leaveResult?.total_records || 0,
        status: 'ok',
        // Latest leave period fields (only if data exists)
        ...(latestLeavePeriod ? {
          latest_leave_start_date: latestLeavePeriod.latest_leave_start_date,
          latest_leave_end_date: latestLeavePeriod.latest_leave_end_date,
          latest_leave_created_at: latestLeavePeriod.latest_leave_created_at,
          latest_leave_update_bangkok: latestLeavePeriod.latest_leave_update_bangkok,
          latest_leave_period_label: latestLeavePeriod.latest_leave_period_label,
          latest_leave_records_count_for_period: latestLeavePeriod.latest_leave_records_count_for_period
        } : {})
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
      // Try to query system_logs, but don't fail if table doesn't exist or schema is different
      let syncResult = null;
      try {
        syncResult = await db.queryOne(`
          SELECT 
            action,
            details,
            created_at as last_sync_time
          FROM system_logs 
          WHERE action LIKE '%sync%' OR action LIKE '%n8n%' OR action LIKE '%import%'
          ORDER BY created_at DESC 
          LIMIT 1
        `);
      } catch (queryError) {
        // If query fails (table doesn't exist or schema mismatch), just skip
        logger.debug('Could not query system_logs for sync info:', queryError.message);
      }
      
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
