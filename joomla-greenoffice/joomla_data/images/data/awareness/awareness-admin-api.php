<?php
/**
 * Awareness Admin API
 * สำหรับจัดการ Session (CRUD operations)
 * 
 * Endpoints:
 *   GET  ?action=list           - แสดงรายการ Session ทั้งหมด
 *   GET  ?action=get&id=XXX     - ดูรายละเอียด Session
 *   POST ?action=create         - สร้าง Session ใหม่
 *   POST ?action=update         - แก้ไขชื่อ Session
 *   POST ?action=delete         - ลบ Session
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Config
$DATA_DIR = __DIR__;
$SESSIONS_FILE = "$DATA_DIR/awareness_sessions.json";
$DB_HOST = 'rgreenoff-db';
$DB_USER = 'joomla_user';
$DB_PASS = 'joomla_pass_2026';
$DB_NAME = 'joomla_greenoffice';

// Helper functions
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function errorResponse($message, $status = 400) {
    jsonResponse(['success' => false, 'error' => $message], $status);
}

function getSessions() {
    global $SESSIONS_FILE;
    if (!file_exists($SESSIONS_FILE)) {
        return ['sessions' => []];
    }
    $content = file_get_contents($SESSIONS_FILE);
    return json_decode($content, true) ?: ['sessions' => []];
}

function saveSessions($data) {
    global $SESSIONS_FILE;
    $result = file_put_contents($SESSIONS_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    return $result !== false;
}

function getDbConnection() {
    global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME;
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        return null;
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}

function getSessionStats($sessionId) {
    $conn = getDbConnection();
    if (!$conn) return null;
    
    $stmt = $conn->prepare("SELECT form_type, COUNT(*) as count FROM j6_awareness_responses_raw WHERE session_id = ? GROUP BY form_type");
    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $stats = ['pre' => 0, 'post' => 0, 'followup' => 0];
    while ($row = $result->fetch_assoc()) {
        $stats[$row['form_type']] = (int)$row['count'];
    }
    
    $stmt->close();
    $conn->close();
    return $stats;
}

function generateSessionQuestions($sessionId) {
    global $DATA_DIR;
    
    // โหลด question_bank
    $bankFile = "$DATA_DIR/question_bank.json";
    if (!file_exists($bankFile)) {
        return false;
    }
    
    $bank = json_decode(file_get_contents($bankFile), true);
    if (!$bank || !isset($bank['questions'])) {
        return false;
    }
    
    // เลือก 5 คำถามแบบ deterministic (ใช้ hash ของ session_id)
    $allQuestions = $bank['questions'];
    $count = min(5, count($allQuestions));
    
    // สร้าง seed จาก session_id
    $seed = crc32($sessionId);
    srand($seed);
    
    // สุ่มเลือก 5 คำถาม
    $keys = array_keys($allQuestions);
    shuffle($keys);
    $selectedKeys = array_slice($keys, 0, $count);
    
    $selectedQuestions = [];
    foreach ($selectedKeys as $key) {
        $q = $allQuestions[$key];
        $selectedQuestions[$key] = [
            'text' => $q['text'],
            'category' => $q['category'] ?? 'general'
        ];
    }
    
    // บันทึกไฟล์
    $outputFile = "$DATA_DIR/session_questions_{$sessionId}.json";
    $result = file_put_contents($outputFile, json_encode([
        'session_id' => $sessionId,
        'questions' => $selectedQuestions,
        'created_at' => date('Y-m-d\TH:i:s\Z')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    
    return $result !== false;
}

function deleteSessionFiles($sessionId) {
    global $DATA_DIR;
    $deleted = [];
    
    // ลบ session_questions
    $sqFile = "$DATA_DIR/session_questions_{$sessionId}.json";
    if (file_exists($sqFile)) {
        unlink($sqFile);
        $deleted[] = "session_questions";
    }
    
    // ลบ summary
    $sumFile = "$DATA_DIR/awareness_summary_{$sessionId}.json";
    if (file_exists($sumFile)) {
        unlink($sumFile);
        $deleted[] = "summary";
    }
    
    return $deleted;
}

function deleteDbData($sessionId) {
    $conn = getDbConnection();
    if (!$conn) return false;
    
    $stmt = $conn->prepare("DELETE FROM j6_awareness_responses_raw WHERE session_id = ?");
    $stmt->bind_param("s", $sessionId);
    $result = $stmt->execute();
    $affected = $stmt->affected_rows;
    
    $stmt->close();
    $conn->close();
    
    return $affected;
}

// Main routing
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        $data = getSessions();
        $sessions = [];
        
        foreach ($data['sessions'] as $sessionId) {
            $stats = getSessionStats($sessionId);
            $hasQuestions = file_exists("$DATA_DIR/session_questions_{$sessionId}.json");
            $hasSummary = file_exists("$DATA_DIR/awareness_summary_{$sessionId}.json");
            
            $sessions[] = [
                'id' => $sessionId,
                'has_questions' => $hasQuestions,
                'has_summary' => $hasSummary,
                'stats' => $stats
            ];
        }
        
        jsonResponse([
            'success' => true,
            'sessions' => $sessions,
            'count' => count($sessions)
        ]);
        break;
        
    case 'get':
        $id = $_GET['id'] ?? '';
        if (empty($id)) {
            errorResponse('Session ID is required');
        }
        
        $data = getSessions();
        if (!in_array($id, $data['sessions'])) {
            errorResponse('Session not found', 404);
        }
        
        $stats = getSessionStats($id);
        $hasQuestions = file_exists("$DATA_DIR/session_questions_{$id}.json");
        $hasSummary = file_exists("$DATA_DIR/awareness_summary_{$id}.json");
        
        // โหลดรายละเอียด summary ถ้ามี
        $summary = null;
        if ($hasSummary) {
            $summary = json_decode(file_get_contents("$DATA_DIR/awareness_summary_{$id}.json"), true);
        }
        
        // สร้าง URLs
        $baseUrl = 'https://raeservice.mju.ac.th/greenoffice/images/data/awareness';
        $encodedId = urlencode($id);
        
        jsonResponse([
            'success' => true,
            'session' => [
                'id' => $id,
                'has_questions' => $hasQuestions,
                'has_summary' => $hasSummary,
                'stats' => $stats,
                'summary' => $summary,
                'urls' => [
                    'index' => "$baseUrl/awareness-index.html?session={$encodedId}",
                    'form_pre' => "$baseUrl/awareness-form.html?session={$encodedId}&phase=pre",
                    'form_post' => "$baseUrl/awareness-form.html?session={$encodedId}&phase=post",
                    'dashboard' => "$baseUrl/awareness-dashboard.html?session={$encodedId}"
                ]
            ]
        ]);
        break;
        
    case 'create':
        if ($method !== 'POST') {
            errorResponse('Method not allowed', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $sessionId = $input['id'] ?? '';
        
        // ถ้าไม่ระบุ ID ให้สร้างอัตโนมัติ
        if (empty($sessionId)) {
            $date = date('Ymd');
            $data = getSessions();
            $maxNum = 0;
            foreach ($data['sessions'] as $s) {
                if (preg_match("/AW-{$date}-RAE-(\d+)/", $s, $m)) {
                    $maxNum = max($maxNum, (int)$m[1]);
                }
            }
            $sessionId = "AW-{$date}-RAE-" . ($maxNum + 1);
        }
        
        // ตรวจสอบรูปแบบ Session ID
        if (!preg_match('/^AW-\d{8}-RAE-.+$/', $sessionId)) {
            errorResponse('Invalid session ID format. Expected: AW-YYYYMMDD-RAE-<name>');
        }
        
        $data = getSessions();
        if (in_array($sessionId, $data['sessions'])) {
            errorResponse('Session already exists');
        }
        
        // สร้างไฟล์คำถาม
        if (!generateSessionQuestions($sessionId)) {
            errorResponse('Failed to generate session questions');
        }
        
        // เพิ่มเข้า sessions list
        array_unshift($data['sessions'], $sessionId);
        if (!saveSessions($data)) {
            errorResponse('Failed to save sessions file');
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Session created successfully',
            'session' => [
                'id' => $sessionId,
                'has_questions' => true,
                'has_summary' => false,
                'stats' => ['pre' => 0, 'post' => 0, 'followup' => 0]
            ]
        ]);
        break;
        
    case 'update':
        if ($method !== 'POST') {
            errorResponse('Method not allowed', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $oldId = $input['old_id'] ?? '';
        $newId = $input['new_id'] ?? '';
        
        if (empty($oldId) || empty($newId)) {
            errorResponse('Both old_id and new_id are required');
        }
        
        if (!preg_match('/^AW-\d{8}-RAE-.+$/', $newId)) {
            errorResponse('Invalid new session ID format');
        }
        
        $data = getSessions();
        if (!in_array($oldId, $data['sessions'])) {
            errorResponse('Old session not found', 404);
        }
        
        if (in_array($newId, $data['sessions'])) {
            errorResponse('New session ID already exists');
        }
        
        // เปลี่ยนชื่อใน sessions list
        $idx = array_search($oldId, $data['sessions']);
        $data['sessions'][$idx] = $newId;
        
        if (!saveSessions($data)) {
            errorResponse('Failed to save sessions file');
        }
        
        // เปลี่ยนชื่อไฟล์ต่างๆ
        $renamed = [];
        $oldSq = "$DATA_DIR/session_questions_{$oldId}.json";
        $newSq = "$DATA_DIR/session_questions_{$newId}.json";
        if (file_exists($oldSq)) {
            rename($oldSq, $newSq);
            // อัปเดต session_id ในไฟล์
            $sq = json_decode(file_get_contents($newSq), true);
            $sq['session_id'] = $newId;
            file_put_contents($newSq, json_encode($sq, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            $renamed[] = 'session_questions';
        }
        
        $oldSum = "$DATA_DIR/awareness_summary_{$oldId}.json";
        $newSum = "$DATA_DIR/awareness_summary_{$newId}.json";
        if (file_exists($oldSum)) {
            rename($oldSum, $newSum);
            $renamed[] = 'summary';
        }
        
        // อัปเดต DB
        $conn = getDbConnection();
        if ($conn) {
            $stmt = $conn->prepare("UPDATE j6_awareness_responses_raw SET session_id = ? WHERE session_id = ?");
            $stmt->bind_param("ss", $newId, $oldId);
            $stmt->execute();
            $conn->close();
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Session renamed successfully',
            'renamed_files' => $renamed
        ]);
        break;
        
    case 'delete':
        if ($method !== 'POST') {
            errorResponse('Method not allowed', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $sessionId = $input['id'] ?? '';
        
        if (empty($sessionId)) {
            errorResponse('Session ID is required');
        }
        
        $data = getSessions();
        if (!in_array($sessionId, $data['sessions'])) {
            errorResponse('Session not found', 404);
        }
        
        // ลบออกจาก sessions list
        $data['sessions'] = array_values(array_diff($data['sessions'], [$sessionId]));
        if (!saveSessions($data)) {
            errorResponse('Failed to save sessions file');
        }
        
        // ลบไฟล์ต่างๆ
        $deletedFiles = deleteSessionFiles($sessionId);
        
        // ลบข้อมูลใน DB
        $deletedRows = deleteDbData($sessionId);
        
        jsonResponse([
            'success' => true,
            'message' => 'Session deleted successfully',
            'deleted_files' => $deletedFiles,
            'deleted_db_rows' => $deletedRows
        ]);
        break;
        
    default:
        errorResponse('Unknown action. Use: list, get, create, update, delete');
}
