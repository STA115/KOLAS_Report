// =========================
// AI Agent Script 시작
// =========================
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
// Load local overrides first, then fallback to .env.
dotenv.config({ path: '.env.local' });
dotenv.config();


const app = express();
const defaultAllowedOrigins = [
	'http://localhost:3000',
	'http://localhost:5173',
	'https://sta115.github.io'
];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
	.split(',')
	.map(origin => origin.trim())
	.filter(Boolean);

app.use(cors({
	origin: (origin, callback) => {
		// Allow non-browser clients or same-origin requests with no Origin header.
		if (!origin) {
			callback(null, true);
			return;
		}
		if (allowedOrigins.includes(origin)) {
			callback(null, true);
			return;
		}
		callback(new Error(`Not allowed by CORS: ${origin}`));
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const parseBooleanEnv = (value, fallback = false) => {
	if (value === undefined || value === null || value === '') return fallback;
	return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
};

const dbPort = Number(process.env.DB_PORT || 3306);
const useDbSsl = parseBooleanEnv(process.env.DB_SSL, false);
const dbSslRejectUnauthorized = parseBooleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);
const dbPool = mysql.createPool({
	host: process.env.DB_HOST || '127.0.0.1',
	port: Number.isFinite(dbPort) ? dbPort : 3306,
	user: process.env.DB_USER || '',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || '',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	...(useDbSsl ? { ssl: { rejectUnauthorized: dbSslRejectUnauthorized } } : {})
});

const withDbConnection = async (task) => {
	const connection = await dbPool.getConnection();
	try {
		return await task(connection);
	} finally {
		connection.release();
	}
};

const withDbTransaction = async (task) => {
	const connection = await dbPool.getConnection();
	try {
		await connection.beginTransaction();
		const result = await task(connection);
		await connection.commit();
		return result;
	} catch (err) {
		try {
			await connection.rollback();
		} catch {
			// noop
		}
		throw err;
	} finally {
		connection.release();
	}
};

const normalizeForDb = (value) => {
	if (value === null || value === undefined) return null;
	const text = String(value).trim();
	if (!text || /^(null|undefined)$/i.test(text)) return null;
	return text;
};

const normalizeTextForDb = (value, fallback = '') => {
	const normalized = normalizeForDb(value);
	return normalized ?? fallback;
};

const toNullableNumber = (value) => {
	if (value === null || value === undefined || value === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const buildAnalysisInfoForDb = (input) => {
	if (!input || typeof input !== 'object') return null;
	return {
		report_no: normalizeForDb(input.report_no ?? input.Report_No),
		submission_id: normalizeForDb(input.submission_id ?? input.receiptNumber),
		gubun_code: normalizeForDb(input.gubun_code),
		company_name: normalizeForDb(input.company_name ?? input.companyName),
		company_domain: normalizeForDb(input.company_domain),
		product_name: normalizeForDb(input.product_name ?? input.productName),
		request_Date: normalizeForDb(input.request_Date),
		test_Date: normalizeForDb(input.test_Date),
		release_Date: normalizeForDb(input.release_Date ?? input.created_at),
		platform: normalizeForDb(input.platform ?? input.productPlatform),
		mainTechField: normalizeForDb(input.mainTechField),
		mainTechField_ect: normalizeForDb(input.mainTechField_ect),
		overview: normalizeForDb(input.overview),
		test_item_count: toNullableNumber(input.test_item_count),
		receiving_org: normalizeForDb(input.receiving_org),
		program_name: normalizeForDb(input.program_name),
		operator: normalizeForDb(input.operator)
	};
};

const loginHomeUrl = process.env.LOGIN_HOME_URL || process.env.APP_URL || 'https://sta115.github.io/TRP/';

const escapeHtml = (value) => String(value ?? '')
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const resolveNextUrl = (rawNext) => {
	const fallback = loginHomeUrl;
	const value = String(rawNext ?? '').trim();
	if (!value) return fallback;
	if (value.startsWith('/')) return value;
	try {
		const parsed = new URL(value);
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
			return parsed.toString();
		}
	} catch {
		// noop
	}
	return fallback;
};

const buildLoginPageHtml = ({ error = '', next = '' } = {}) => `<!doctype html>
<html lang="ko">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>로그인 확인</title>
	<style>
		body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; }
		.wrap { max-width: 380px; margin: 72px auto; background: #fff; border: 1px solid #d5e3f7; border-radius: 10px; padding: 24px; }
		h1 { margin: 0 0 20px; font-size: 20px; color: #1457ba; text-align: center; }
		label { display: block; margin: 12px 0 6px; font-size: 14px; color: #333; }
		input { width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #9dbbe8; border-radius: 6px; }
		button { width: 100%; margin-top: 16px; padding: 10px; border: 0; border-radius: 6px; background: #1457ba; color: #fff; font-weight: 700; cursor: pointer; }
		.error { margin-bottom: 10px; padding: 8px 10px; background: #ffe9e9; color: #b30000; border-radius: 6px; font-size: 13px; }
		.hint { margin-top: 10px; font-size: 12px; color: #666; text-align: center; }
	</style>
</head>
<body>
	<div class="wrap">
		<h1>로그인 확인</h1>
		${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
		<form method="post" action="/login-page">
			<input type="hidden" name="next" value="${escapeHtml(next)}" />
			<label for="id">아이디</label>
			<input id="id" name="id" type="text" autocomplete="username" />
			<label for="pwd">비밀번호</label>
			<input id="pwd" name="pwd" type="password" autocomplete="current-password" />
			<button type="submit">로그인</button>
		</form>
		<div class="hint">DB 인증 후 홈으로 이동합니다.</div>
	</div>
</body>
</html>`;

app.get('/health', (req, res) => {
	res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/login-page', (req, res) => {
	const next = resolveNextUrl(req.query?.next);
	const error = typeof req.query?.error === 'string' ? req.query.error : '';
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.send(buildLoginPageHtml({ error, next }));
});

app.post('/login-page', async (req, res) => {
	const id = normalizeTextForDb(req.body?.id, '');
	const pwd = normalizeTextForDb(req.body?.pwd, '');
	const next = resolveNextUrl(req.body?.next);
	if (!id || !pwd) {
		const params = new URLSearchParams({ error: '아이디와 비밀번호를 입력해 주세요.', next });
		return res.redirect(`/login-page?${params.toString()}`);
	}

	try {
		const [rows] = await withDbConnection(async (connection) => connection.execute(
			'SELECT id FROM member WHERE id = ? AND pwd = ? LIMIT 1',
			[id, pwd]
		));
		if (!Array.isArray(rows) || rows.length === 0) {
			const params = new URLSearchParams({ error: '아이디 또는 비밀번호가 일치하지 않습니다.', next });
			return res.redirect(`/login-page?${params.toString()}`);
		}

		const loginId = encodeURIComponent(String(rows[0]?.id ?? id));
		const separator = next.includes('?') ? '&' : '?';
		return res.redirect(`${next}${separator}server_login_id=${loginId}`);
	} catch (err) {
		const params = new URLSearchParams({ error: '로그인 처리 중 오류가 발생했습니다.', next });
		return res.redirect(`/login-page?${params.toString()}`);
	}
});

// Google Gemini API 엔드포인트 및 키
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const analyzeWithOpenAI = async (req, res) => {
	try {
		const { prompt } = req.body;
		if (!prompt) {
			return res.status(400).json({ error: 'No prompt provided' });
		}

		if (!OPENAI_API_KEY) {
			return res.status(500).json({
				error: 'OpenAI API key is missing. Set OPENAI_API_KEY (recommended) or VITE_OPENAI_API_KEY in server environment.'
			});
		}

		if (!/^sk-/i.test(OPENAI_API_KEY)) {
			return res.status(400).json({
				error: 'Invalid key format for OpenAI. Expected an OpenAI key starting with sk-.'
			});
		}

		const openaiRes = await fetch(OPENAI_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: OPENAI_MODEL,
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.2
			})
		});
		if (!openaiRes.ok) {
			const errorBody = await openaiRes.text();
			return res.status(openaiRes.status).json({
				error: 'OpenAI API 호출 실패',
				status: openaiRes.status,
				details: errorBody
			});
		}
		const data = await openaiRes.json();
		const generatedText = data?.choices?.[0]?.message?.content || '';

		// 분석 결과 응답만 반환합니다.
		res.json({ generated_text: generatedText });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Keep legacy route name for frontend compatibility.
app.post('/gemini-analyze', analyzeWithOpenAI);
app.post('/openai-analyze', analyzeWithOpenAI);

// ===== 엑셀 내보내기용 조인 조회 (analysis_info LEFT JOIN analysis_results) =====
app.get('/analysis-results-export', async (req, res) => {
	try {
		const [results] = await withDbConnection(async (connection) => {
			const [columnRows] = await connection.execute(
				`SHOW COLUMNS FROM analysis_results LIKE 'item_attribute_sub'`
			);
			const hasItemAttributeSub = Array.isArray(columnRows) && columnRows.length > 0;
			const itemAttributeSubSelect = hasItemAttributeSub
				? `ar.item_attribute_sub AS item_attribute_sub,`
				: `'' AS item_attribute_sub,`;

			return connection.execute(
				`SELECT
					ai.report_no AS report_no,
					ai.submission_id AS submission_id,
					ai.gubun_code AS gubun_code,
					ai.company_name AS companyName,
					ai.company_domain AS company_domain,
					ai.product_name AS product_name,
					DATE_FORMAT(ai.request_Date, '%Y-%m-%d') AS request_Date,
					DATE_FORMAT(ai.test_Date, '%Y-%m-%d') AS test_Date,
					DATE_FORMAT(ai.release_Date, '%Y-%m-%d') AS release_Date,
					ai.platform AS platform,
					ai.platform AS platform_ect,
					ai.mainTechField AS mainTechField,
					ai.mainTechField_ect AS mainTechField_ect,
					ai.overview AS overview,
					ai.test_item_count AS test_item_count,
					ai.receiving_org AS receiving_org,
					ai.program_name AS program_name,
					ai.operator AS operator,
					ar.test_item AS test_item,
					ar.test_spec AS test_spec,
					ar.test_standard AS test_standard,
					ar.test_result AS test_result,
					ar.item_platform AS item_platform,
					ar.item_platform_ect AS item_platform_ect,
					ar.item_mainTechField AS item_mainTechField,
					ar.item_mainTechField_ect AS item_mainTechField_ect,
					ar.item_attribute AS item_attribute,
					${itemAttributeSubSelect}
					ar.item_attribute_ect AS item_attribute_ect,
					ar.ai_domain AS ai_domain,
					ar.ai_tech AS ai_tech,
					ar.insert_date AS insert_date
				FROM analysis_info ai
				LEFT JOIN analysis_results ar
					ON ar.report_no = ai.report_no
				ORDER BY ai.release_Date DESC, ai.report_no DESC, ar.insert_date DESC`
			);
		});
		res.json({ results });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ===== 분석 결과 조회 =====
app.get('/analysis-results/:memberId', async (req, res) => {
	try {
		const [results] = await withDbConnection(async (connection) => connection.execute(
			`SELECT
				ar.*,
				ar.insert_date AS created_at,
				COALESCE((
					SELECT ai.company_name
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS company_name,
				COALESCE((
					SELECT ai.company_domain
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS company_domain,
				COALESCE((
					SELECT ai.product_name
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS productName,
				COALESCE((
					SELECT DATE_FORMAT(ai.release_Date, '%Y-%m-%d')
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS release_Date,
				COALESCE((
					SELECT ai.overview
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS overview,
				COALESCE((
					SELECT ai.platform
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS productPlatform
			FROM analysis_results ar
			ORDER BY ar.insert_date DESC
			LIMIT 1000`
		));
		res.json({ results });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ===== 전체 분석 결과 조회 =====
app.get('/analysis-results', async (req, res) => {
	try {
		const [results] = await withDbConnection(async (connection) => connection.execute(
			`SELECT
				ar.*,
				ar.insert_date AS created_at,
				COALESCE((
					SELECT ai.company_name
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS company_name,
				COALESCE((
					SELECT ai.company_domain
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS company_domain,
				COALESCE((
					SELECT ai.product_name
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS productName,
				COALESCE((
					SELECT DATE_FORMAT(ai.release_Date, '%Y-%m-%d')
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS release_Date,
				COALESCE((
					SELECT ai.overview
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS overview,
				COALESCE((
					SELECT ai.platform
					FROM analysis_info ai
					WHERE ai.report_no = ar.report_no
					
					LIMIT 1
				), '') AS productPlatform
			FROM analysis_results ar
			ORDER BY ar.insert_date DESC
			LIMIT 1000`
		));
		res.json({ results });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ===== 분석 결과 저장 =====
app.post('/analysis-results/insert', async (req, res) => {
	try {
		const requestBody = req.body;
		const results = Array.isArray(requestBody)
			? requestBody
			: Array.isArray(requestBody?.results)
				? requestBody.results
				: null;
		const summaryInfoInput = Array.isArray(requestBody)
			? null
			: requestBody?.summaryInfo ?? null;

		if (!Array.isArray(results) || results.length === 0) {
			return res.status(400).json({ error: '저장할 데이터가 없습니다.' });
		}
		if (!summaryInfoInput || typeof summaryInfoInput !== 'object') {
			return res.status(400).json({ error: 'analysis_info(summaryInfo)는 필수입니다.' });
		}

		const insertedResults = [];
		const executedQueries = [];
		let insertedAnalysisInfo = null;
		const insertColumns = [
			'report_no',
			'test_item',
			'test_spec',
			'test_standard',
			'test_result',
			'item_platform',
			'item_platform_ect',
			'item_mainTechField',
			'item_mainTechField_ect',
			'item_attribute',
			'item_attribute_sub',
			'item_attribute_ect',
			'ai_domain',
			'ai_tech'
		];
		const analysisInfoColumns = [
			'report_no',
			'submission_id',
			'gubun_code',
			'company_name',
			'company_domain',
			'product_name',
			'request_Date',
			'test_Date',
			'release_Date',
			'platform',
			'mainTechField',
			'mainTechField_ect',
			'overview',
			'test_item_count',
			'receiving_org',
			'program_name',
			'operator'
		];
		const normalizedSummaryInfo = buildAnalysisInfoForDb(summaryInfoInput);
		if (!normalizedSummaryInfo) {
			return res.status(400).json({ error: 'analysis_info(summaryInfo)를 정규화하지 못했습니다.' });
		}
		const reportNoFromResults = results.reduce((acc, row) => {
			if (acc) return acc;
			return normalizeForDb(row?.Report_No ?? row?.report_no);
		}, null);
		const canonicalReportNo = normalizeForDb(normalizedSummaryInfo.report_no) ?? reportNoFromResults;
		if (!canonicalReportNo) {
			return res.status(400).json({ error: 'report_no가 없어 저장할 수 없습니다. 분석 결과의 보고서 번호를 확인해 주세요.' });
		}
		normalizedSummaryInfo.report_no = canonicalReportNo;

		await withDbTransaction(async (connection) => {
			const summaryValues = analysisInfoColumns.map(column => normalizedSummaryInfo[column] ?? null);
			const summarySql = `INSERT INTO analysis_info (${analysisInfoColumns.map(column => `\`${column}\``).join(', ')}) VALUES (${analysisInfoColumns.map(() => '?').join(', ')})`;
			const [summaryResult] = await connection.execute(summarySql, summaryValues);
			if (!summaryResult || summaryResult.affectedRows !== 1) {
				throw new Error('analysis_info 저장에 실패했습니다.');
			}
			const insertedSummaryId = summaryResult.insertId;
			const persistedReportNo = canonicalReportNo;
			if (!persistedReportNo) {
				throw new Error('analysis_info 저장 후 report_no를 확인할 수 없습니다.');
			}
			insertedAnalysisInfo = {
				...(insertedSummaryId ? { id: insertedSummaryId } : {}),
				...normalizedSummaryInfo,
				report_no: persistedReportNo
			};
			executedQueries.push({ sql: summarySql, values: summaryValues });
			console.log('저장 완료 - analysis_info report_no:', persistedReportNo);
			const [subColumnRows] = await connection.execute(
				`SHOW COLUMNS FROM analysis_results LIKE 'item_attribute_sub'`
			);
			const hasItemAttributeSub = Array.isArray(subColumnRows) && subColumnRows.length > 0;
			const resultInsertColumns = hasItemAttributeSub
				? insertColumns
				: insertColumns.filter(column => column !== 'item_attribute_sub');

			for (const row of results) {
				const reportNo = persistedReportNo; // 기관 요약(analysis_info) 보고서 번호를 기준으로 고정
				const testItem = normalizeTextForDb(row.Test_Item ?? row.test_item, '미기재');
				const testSpec = normalizeTextForDb(row.Parameter ?? row.parameter ?? row.test_spec, '신청기관 기준');
				const testStandard = normalizeTextForDb(row.testStandard ?? row.test_standard, '신청기관 기준');
				const testResult = normalizeTextForDb(row.testResult ?? row.test_result, '미기재');
				const itemPlatform = normalizeTextForDb(row.platform ?? row.item_platform, '미기재');
				const itemPlatformEtc = normalizeTextForDb(
					row.platform_ect ?? row.platformEtc ?? row.platform_etc ?? row.item_platform_ect
					, ''
				);
				const itemMainTechField = normalizeTextForDb(row.mainTechField ?? row.item_mainTechField, '그외');
				const itemMainTechFieldEtc = normalizeTextForDb(
					row.mainTechField_ect ?? row.mainTechFieldEtc ?? row.mainTechField_etc ?? row.item_mainTechField_ect
					, ''
				);
				const itemAttribute = normalizeTextForDb(
					row.qualityMainCharacteristic ??
					row.quality_main_characteristic ??
					row.item_attribute ??
					row.representativeDomain,
					'기능적합성'
				);
				const itemAttributeSub = normalizeTextForDb(
					row.qualityCharacteristic ??
					row.quality_characteristic ??
					row.item_attribute_sub,
					'기능적절성'
				);
				const itemAttributeEtc = normalizeTextForDb(
					row.qualityCharacteristic_ect ?? row.qualityCharacteristicEtc ?? row.qualityCharacteristic_etc ?? row.item_attribute_ect
					, ''
				);
				const aiDomain = normalizeTextForDb(row.AI_Domain ?? row.ai_domain, '미분류');
				const aiTech = normalizeTextForDb(row.AI_Tech ?? row.ai_tech, '미분류');
				const rowInsertMap = {
					report_no: reportNo,
					test_item: testItem,
					test_spec: testSpec,
					test_standard: testStandard,
					test_result: testResult,
					item_platform: itemPlatform,
					item_platform_ect: itemPlatformEtc,
					item_mainTechField: itemMainTechField,
					item_mainTechField_ect: itemMainTechFieldEtc,
					item_attribute: itemAttribute,
					item_attribute_sub: itemAttributeSub,
					item_attribute_ect: itemAttributeEtc,
					ai_domain: aiDomain,
					ai_tech: aiTech
				};
				const values = resultInsertColumns.map(column => rowInsertMap[column] ?? null);
				const sql = `INSERT INTO analysis_results (${resultInsertColumns.map(column => `\`${column}\``).join(', ')}) VALUES (${resultInsertColumns.map(() => '?').join(', ')})`;
				const [result] = await connection.execute(sql, values);

				insertedResults.push({
					id: result.insertId,
					...row,
					Report_No: reportNo,
					Test_Item: testItem,
					Parameter: testSpec,
					testStandard: testStandard,
					testResult: testResult,
					platform: itemPlatform,
					platform_ect: itemPlatformEtc,
					mainTechField: itemMainTechField,
					mainTechField_ect: itemMainTechFieldEtc,
					qualityMainCharacteristic: itemAttribute,
					qualityCharacteristic: itemAttributeSub,
					qualityCharacteristic_ect: itemAttributeEtc,
					productPlatform: insertedAnalysisInfo?.platform || '',
					AI_Domain: aiDomain,
					AI_Tech: aiTech
				});
				executedQueries.push({ sql, values });
			}
		});
		res.json({
			success: true,
			results: insertedResults,
			analysisInfo: insertedAnalysisInfo,
			message: 'analysis_info 및 analysis_results 저장이 완료되었습니다.',
			analysisInfoOnly: false,
			executedQueries
		});
	} catch (err) {
		console.error('INSERT 오류:', err.message);
		res.status(500).json({ error: err.message });
	}
});

// ===== 사용자 로그인 =====
app.post('/login', async (req, res) => {
	try {
		const { id, pwd } = req.body;
		console.log('로그인 시도:', { id });

		const [result] = await withDbConnection(async (connection) => connection.execute(
			'SELECT * FROM member WHERE id = ? AND pwd = ?',
			[id, pwd]
		));

		if (result.length > 0) {
			console.log('로그인 성공:', id);
			res.json({ success: true, member: result[0] });
		} else {
			console.log('로그인 실패: 사용자 없음 -', id);
			res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
		}
	} catch (err) {
		console.error('로그인 오류:', err.message);
		res.status(500).json({ error: err.message });
	}
});

// ===== 사용자 회원가입 =====
app.post('/register', async (req, res) => {
	try {
		const { id, pwd, email } = req.body;
		if (!id || !pwd) {
			return res.status(400).json({ error: '아이디와 비밀번호는 필수입니다.' });
		}

		const registerResult = await withDbConnection(async (connection) => {
			// 중복 확인
			const [existingUsers] = await connection.execute(
				'SELECT * FROM member WHERE id = ?',
				[id]
			);

			if (existingUsers.length > 0) {
				return { duplicated: true };
			}

			// 신규 사용자 생성
			await connection.execute(
				'INSERT INTO member (id, pwd, email, created_at) VALUES (?, ?, ?, NOW())',
				[id, pwd, email || null]
			);

			return { duplicated: false };
		});

		if (registerResult.duplicated) {
			return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
		}

		res.json({ success: true, message: '회원가입이 완료되었습니다.' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ===== 특정 분석 결과 삭제 =====
app.delete('/analysis-results/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const deleteResult = await withDbTransaction(async (connection) => {
			const [rows] = await connection.execute(
				'SELECT report_no FROM analysis_results WHERE id = ? LIMIT 1',
				[id]
			);
			const reportNo = normalizeForDb(rows?.[0]?.report_no);

			if (!reportNo) {
				return {
					reportNos: [],
					deletedAnalysisResults: 0,
					deletedAnalysisInfo: 0
				};
			}

			const [analysisResultsDeleteResult] = await connection.execute(
				'DELETE FROM analysis_results WHERE report_no = ?',
				[reportNo]
			);
			const [analysisInfoDeleteResult] = await connection.execute(
				'DELETE FROM analysis_info WHERE report_no = ?',
				[reportNo]
			);

			return {
				reportNos: [reportNo],
				deletedAnalysisResults: analysisResultsDeleteResult?.affectedRows || 0,
				deletedAnalysisInfo: analysisInfoDeleteResult?.affectedRows || 0
			};
		});

		res.json({
			success: true,
			message: '삭제되었습니다.',
			...deleteResult
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ===== 여러 분석 결과 삭제 =====
app.post('/analysis-results/delete-multiple', async (req, res) => {
	try {
		const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
		const requestReportNos = Array.isArray(req.body?.reportNos) ? req.body.reportNos : [];
		const normalizedRequestReportNos = Array.from(
			new Set(
				requestReportNos
					.map(value => normalizeForDb(value))
					.filter(value => value !== null)
			)
		);

		if (normalizedRequestReportNos.length === 0 && ids.length === 0) {
			return res.status(400).json({ error: 'reportNos 또는 ids 배열이 필요합니다.' });
		}

		const deleteResult = await withDbTransaction(async (connection) => {
			let reportNos = normalizedRequestReportNos;

			if (reportNos.length === 0) {
				const placeholders = ids.map(() => '?').join(',');
				const [rows] = await connection.execute(
					`SELECT DISTINCT report_no FROM analysis_results WHERE id IN (${placeholders})`,
					ids
				);
				reportNos = Array.from(
					new Set(
						rows
							.map(row => normalizeForDb(row?.report_no))
							.filter(value => value !== null)
					)
				);
			}

			if (reportNos.length === 0) {
				return {
					reportNos: [],
					deletedAnalysisResults: 0,
					deletedAnalysisInfo: 0
				};
			}

			const placeholders = reportNos.map(() => '?').join(',');
			const [analysisResultsDeleteResult] = await connection.execute(
				`DELETE FROM analysis_results WHERE report_no IN (${placeholders})`,
				reportNos
			);
			const [analysisInfoDeleteResult] = await connection.execute(
				`DELETE FROM analysis_info WHERE report_no IN (${placeholders})`,
				reportNos
			);

			return {
				reportNos,
				deletedAnalysisResults: analysisResultsDeleteResult?.affectedRows || 0,
				deletedAnalysisInfo: analysisInfoDeleteResult?.affectedRows || 0
			};
		});

		res.json({
			success: true,
			message: '삭제되었습니다.',
			...deleteResult
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ===== 모든 분석 결과 삭제 =====
app.delete('/analysis-results/all', async (req, res) => {
	try {
		await withDbTransaction(async (connection) => connection.execute('DELETE FROM analysis_results'));
		res.json({ success: true, message: '모든 데이터가 삭제되었습니다.' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// =========================
// AI Agent Script 종료
// =========================

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
	console.log('Gemini analyze endpoint: POST /gemini-analyze');
});
