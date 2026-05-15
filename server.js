// =========================
// AI Agent Script ?쒖옉
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

// Google Gemini API 엔드포인트 및 키
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

app.post('/gemini-analyze', async (req, res) => {
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
				error: 'OpenAI API ?몄텧 ?ㅽ뙣',
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
}

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

// ===== 遺꾩꽍 寃곌낵 議고쉶 =====
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

// ===== ?꾩껜 遺꾩꽍 寃곌낵 議고쉶 =====
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

// ===== 遺꾩꽍 寃곌낵 ?쇨큵 ???=====
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
			return res.status(400).json({ error: '??ν븷 ?곗씠?곌? ?놁뒿?덈떎' });
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
			console.log('??????꾨즺 - analysis_info report_no:', persistedReportNo);
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
		console.error('??INSERT ?ㅻ쪟:', err.message);
		res.status(500).json({ error: err.message });
	}
});

// ===== ?ъ슜??濡쒓렇??=====
app.post('/login', async (req, res) => {
	try {
		const { id, pwd } = req.body;
		console.log('?뱦 濡쒓렇???쒕룄:', { id });

		const [result] = await withDbConnection(async (connection) => connection.execute(
			'SELECT * FROM member WHERE id = ? AND pwd = ?',
			[id, pwd]
		));

		if (result.length > 0) {
			console.log('??濡쒓렇???깃났:', id);
			res.json({ success: true, member: result[0] });
		} else {
			console.log('??濡쒓렇???ㅽ뙣: ?ъ슜???놁쓬 -', id);
			res.status(401).json({ error: '?꾩씠???먮뒗 鍮꾨?踰덊샇媛 ??몄뒿?덈떎' });
		}
	} catch (err) {
		console.error('??濡쒓렇???ㅻ쪟:', err.message);
		res.status(500).json({ error: err.message });
	}
});

// ===== ?ъ슜???뚯썝媛??=====
app.post('/register', async (req, res) => {
	try {
		const { id, pwd, email } = req.body;
		if (!id || !pwd) {
			return res.status(400).json({ error: '아이디와 비밀번호는 필수입니다.' });
		}

		const registerResult = await withDbConnection(async (connection) => {
			// 以묐났 ?뺤씤
			const [existingUsers] = await connection.execute(
				'SELECT * FROM member WHERE id = ?',
				[id]
			);

			if (existingUsers.length > 0) {
				return { duplicated: true };
			}

			// ???ъ슜???앹꽦
			await connection.execute(
				'INSERT INTO member (id, pwd, email, created_at) VALUES (?, ?, ?, NOW())',
				[id, pwd, email || null]
			);

			return { duplicated: false };
		});

		if (registerResult.duplicated) {
			return res.status(400).json({ error: '?대? 議댁옱?섎뒗 ?꾩씠?붿엯?덈떎' });
		}

		res.json({ success: true, message: '회원가입이 완료되었습니다.' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ===== ?뱀젙 遺꾩꽍 寃곌낵 ??젣 =====
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

// ===== ?щ윭 遺꾩꽍 寃곌낵 ??젣 =====
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

// ===== 紐⑤뱺 遺꾩꽍 寃곌낵 ??젣 =====
app.delete('/analysis-results/all', async (req, res) => {
	try {
		await withDbTransaction(async (connection) => connection.execute('DELETE FROM analysis_results'));
		res.json({ success: true, message: '모든 데이터가 삭제되었습니다.' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// =========================
// AI Agent Script ??
// =========================

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
	console.log('Gemini analyze endpoint: POST /gemini-analyze');
});
