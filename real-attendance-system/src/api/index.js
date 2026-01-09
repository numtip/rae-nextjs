/**
 * API Routes Index
 * รวม routes ทั้งหมดไว้ที่นี่
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./routes/auth');
const authSSORoutes = require('./routes/auth-sso');
const lookupRoutes = require('./routes/lookup');
const attendanceRoutes = require('./routes/attendance');
const employeeRoutes = require('./routes/employees');
const mappingRoutes = require('./routes/mapping');
const leaveRoutes = require('./routes/leave');
const canvaProxyRoutes = require('./routes/canva-proxy');

// Health check routes - Register ALL health routes through healthRoutes module
const healthRoutes = require('./routes/health');
router.use('/health', healthRoutes);

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        authSSO: '/api/auth/sso',
        authSSOLogin: '/api/auth/sso/login',
        authSSOCallback: '/api/auth/sso/callback',
        authMe: '/api/auth/me',
        lookup: '/api/lookup',
        attendance: '/api/attendance',
        employees: '/api/employees',
        mapping: '/api/mapping',
        leave: '/api/leave',
        leaveSummary: '/api/leave-summary',
        report: '/api/report',
        reportEmployeeMonthly: '/api/report/employee-monthly',
        reportDepartmentMonthly: '/api/report/department-monthly',
        reportOrgMonthly: '/api/report/org-monthly',
        reportAuditLogs: '/api/report/audit/logs',
        reportAuditSummary: '/api/report/audit/summary',
        reportsLeavesSummary: '/api/reports/leaves/summary',
        reportsLeavesByType: '/api/reports/leaves/by-type',
        reportsLeavesByDepartment: '/api/reports/leaves/by-department',
        reportsLeavesExport: '/api/reports/leaves/export',
        reportsOverview: '/api/reports/overview',
        reportsAttendanceTimeseries: '/api/reports/attendance/timeseries',
        reportsAttendanceTopLate: '/api/reports/attendance/top-late',
        reportsLeavesTimeseries: '/api/reports/leaves/timeseries',
        reportsStreamLatestCheckins: '/api/reports/stream/latest-checkins',
        reportsDepartments: '/api/reports/departments',
        employeeAttendance: '/api/employees/:id/attendance',
        employeeLeaves: '/api/employees/:id/leaves',
        employeeBalances: '/api/employees/:id/balances',
        employeeTimeline: '/api/employees/:id/timeline',
        reportsExportPdf: '/api/reports/export/pdf',
        reportsExportPng: '/api/reports/export/png',
        reportsExportTemplates: '/api/reports/export/templates',
        reportsExportPreview: '/api/reports/export/preview',
        canva: '/api/canva',
        healthLive: '/api/health/live',
        healthReady: '/api/health/ready',
        healthMetrics: '/api/health/metrics',
        healthSummary: '/api/health/summary'
      }
    },
    message: 'RAE Attendance System API v1.0.0'
  });
});

// ===========================
// API Routes
// ===========================

// Authentication routes (login, logout, token refresh)
router.use('/auth', authRoutes);

// SSO Authentication routes
router.use('/auth/sso', authSSORoutes);

// Lookup routes (ค้นหา employee, facescan)
router.use('/lookup', lookupRoutes);

// Attendance routes (บันทึกเวลา, ดูข้อมูลการมาทำงาน)
router.use('/attendance', attendanceRoutes);

// Employee routes (จัดการข้อมูลพนักงาน)
router.use('/employees', employeeRoutes);

// Mapping routes (จัดการ ID mapping)
router.use('/mapping', mappingRoutes);

// Leave routes (จัดการข้อมูลการลา)
router.use('/leave', leaveRoutes);

// Leave Summary routes (สรุปข้อมูลการลาจาก External API)
router.use('/leave-summary', require('./routes/leave-summary'));

// Report routes (รายงานสรุปข้อมูล)
const reportEmployeeMonthlyRoutes = require('./routes/report-employee-monthly');
const reportDepartmentMonthlyRoutes = require('./routes/report-department-monthly');
const reportOrgMonthlyRoutes = require('./routes/report-org-monthly');
router.use('/report', reportEmployeeMonthlyRoutes);
router.use('/report', reportDepartmentMonthlyRoutes);
router.use('/report', reportOrgMonthlyRoutes);

// Report Export routes (CSV/Excel export endpoints)
const reportEmployeeMonthlyExportRoutes = require('./routes/report-employee-monthly-export');
const reportDepartmentMonthlyExportRoutes = require('./routes/report-department-monthly-export');
const reportOrgMonthlyExportRoutes = require('./routes/report-org-monthly-export');
router.use('/report', reportEmployeeMonthlyExportRoutes);
router.use('/report', reportDepartmentMonthlyExportRoutes);
router.use('/report', reportOrgMonthlyExportRoutes);

// Report Audit routes (Admin-only audit log access)
const reportAuditRoutes = require('./routes/report-audit');
router.use('/report', reportAuditRoutes);

// Leave Report routes (MJU SOAP API data reports)
const reportLeavesRoutes = require('./routes/report-leaves');
router.use('/reports/leaves', reportLeavesRoutes);

// Dashboard Report routes (overview, attendance timeseries, top-late, etc.)
const reportDashboardRoutes = require('./routes/report-dashboard');
router.use('/reports', reportDashboardRoutes);

// Employee Detail Report routes (individual attendance, leaves, balances)
const reportEmployeeDetailRoutes = require('./routes/report-employee-detail');
router.use('/employees', reportEmployeeDetailRoutes);

// Report Export routes (Canva Docker integration for PDF/PNG)
const reportExportRoutes = require('./routes/report-export');
router.use('/reports/export', reportExportRoutes);

// FaceScan routes (จัดการข้อมูล FaceScan staging)
router.use('/facescan', require('./routes/facescan'));

// Canva routes (proxy to canva-service microservice)
router.use('/canva', canvaProxyRoutes);

// Meta routes (data freshness, server time)
const metaRoutes = require('./routes/meta');
router.use('/meta', metaRoutes);

module.exports = router;

