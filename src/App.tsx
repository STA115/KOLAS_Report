// ...existing code...
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Table as TableIcon,
  Info,
  FileCode,
  Download,
  PlusCircle,
  Trash2,
  Search,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import Login from './Login';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface AnalysisResult {
  id: number;
  gubun_code?: string;
  Report_No?: string;
  receiptNumber?: string;
  practitioner?: string;
  created_at?: string;
  release_Date?: string;
  insert_date?: string;
  company_name?: string;
  company_domain?: string;
  representativeDomain?: string;
  qualityMainCharacteristic?: string;
  mainTechField?: string;
  mainTechField_ect?: string;
  productName?: string;
  productPlatform?: string;
  overview?: string;
  Test_Item?: string;
  Parameter?: string;
  testStandard?: string;
  testResult?: string;
  qualityCharacteristic?: string;
  qualityCharacteristic_ect?: string;
  AI_Domain?: string;
  AI_Tech?: string;
  platform?: string;
  platform_ect?: string;
  Metrics?: string;
  Metrics_ect?: string;
  EQ?: string;
  EQ_ect?: string;
}

interface AnalysisInfoPayload {
  report_no: string | null;
  submission_id: string | null;
  gubun_code: string | null;
  company_name: string | null;
  company_domain: string | null;
  product_name: string | null;
  request_Date: string | null;
  test_Date: string | null;
  release_Date: string | null;
  platform: string | null;
  mainTechField: string | null;
  mainTechField_ect: string | null;
  overview: string | null;
  test_item_count: number | null;
  receiving_org: string | null;
  program_name: string | null;
  operator: string | null;
}

const FIELD_LABELS = {
  analysis_results: {
    report_no: '보고서 번호',
    test_item: '시험항목',
    parameter: '신청기관 기준',
    test_standard: '시험표준',
    test_result: '시험결과',
    item_platform: '시험항목별 플랫폼',
    item_platform_ect: '시험항목별 플랫폼 기타',
    item_mainTechField: '주요기술 분야',
    item_mainTechField_ect: '주요기술 분야_기타',
    item_attribute_main: '시험항목별 품질특성(주특성)',
    item_attribute: '시험항목별 품질특성(부특성 기준)',
    item_attribute_ect: '시험항목별 품질특성(부특성 기준) 기타',
    ai_domain: '도메인(AI)추천',
    ai_tech: '적용기술(AI)추천'
  },
  analysis_info: {
    report_no: '시험 성적서 번호',
    submission_id: '접수 번호',
    gubun_code: '시험성적서 구분',
    company_name: '기관명',
    company_domain: '기관 도메인',
    product_name: '제품명',
    request_Date: '신청일',
    test_Date: '시험 진행일',
    release_Date: '발급 일자',
    platform: '플랫폼',
    mainTechField: '주요기술 분야',
    mainTechField_ect: '주요기술 분야_기타',
    overview: '개요',
    test_item_count: '시험항목 수',
    receiving_org: '참여사업명',
    program_name: '제출처',
    operator: '실무자'
  }
} as const;

const RESULT_FIELD_LABELS: Record<keyof Omit<AnalysisResult, 'id'>, string> = {
  gubun_code: FIELD_LABELS.analysis_info.gubun_code,
  Report_No: FIELD_LABELS.analysis_results.report_no,
  receiptNumber: FIELD_LABELS.analysis_info.submission_id,
  practitioner: FIELD_LABELS.analysis_info.operator,
  created_at: '생성일(미노출)',
  release_Date: FIELD_LABELS.analysis_info.release_Date,
  insert_date: '적재일(미노출)',
  company_name: FIELD_LABELS.analysis_info.company_name,
  company_domain: FIELD_LABELS.analysis_info.company_domain,
  representativeDomain: FIELD_LABELS.analysis_results.item_attribute,
  qualityMainCharacteristic: FIELD_LABELS.analysis_results.item_attribute_main,
  mainTechField: FIELD_LABELS.analysis_results.item_mainTechField,
  mainTechField_ect: FIELD_LABELS.analysis_results.item_mainTechField_ect,
  productName: FIELD_LABELS.analysis_info.product_name,
  productPlatform: FIELD_LABELS.analysis_info.platform,
  overview: FIELD_LABELS.analysis_info.overview,
  Test_Item: FIELD_LABELS.analysis_results.test_item,
  Parameter: FIELD_LABELS.analysis_results.parameter,
  testStandard: FIELD_LABELS.analysis_results.test_standard,
  testResult: FIELD_LABELS.analysis_results.test_result,
  qualityCharacteristic: FIELD_LABELS.analysis_results.item_attribute,
  qualityCharacteristic_ect: FIELD_LABELS.analysis_results.item_attribute_ect,
  AI_Domain: FIELD_LABELS.analysis_results.ai_domain,
  AI_Tech: FIELD_LABELS.analysis_results.ai_tech,
  platform: FIELD_LABELS.analysis_results.item_platform,
  platform_ect: FIELD_LABELS.analysis_results.item_platform_ect,
  Metrics: '주요 지표(미노출)',
  Metrics_ect: '주요 지표-기타',
  EQ: '산식(미노출)',
  EQ_ect: '산식-기타',
};

const LIST_VISIBLE_FIELDS: (keyof Omit<AnalysisResult, 'id'>)[] = [
  'Test_Item',
  'Parameter',
  'testResult',
  'platform',
  'mainTechField',
  'qualityMainCharacteristic',
  'qualityCharacteristic',
  'AI_Domain',
  'AI_Tech',
  'testStandard'
];

type AccumulatedFixedColumnKey =
  | 'no'
  | 'reportNo'
  | 'companyName'
  | 'companyDomain'
  | 'releaseDate'
  | 'productName'
  | 'productPlatform';

const ACCUMULATED_FIXED_COLUMNS: Array<{ key: AccumulatedFixedColumnKey; label: string }> = [
  { key: 'no', label: 'NO' },
  { key: 'reportNo', label: '성적서 번호' },
  { key: 'companyName', label: '기관명' },
  { key: 'companyDomain', label: '기관 도메인' },
  { key: 'releaseDate', label: '발급 일자' },
  { key: 'productName', label: '제품명' },
  { key: 'productPlatform', label: '제품\n플랫폼' }
];

const ACCUMULATED_DEFAULT_VISIBLE_COLUMN_KEYS: Array<AccumulatedFixedColumnKey | (keyof Omit<AnalysisResult, 'id'>)> = [
  'no',
  'reportNo',
  'companyName',
  'companyDomain',
  'releaseDate',
  'productName',
  'productPlatform',
  'Test_Item',
  'Parameter',
  'testResult',
  'platform',
  'mainTechField',
  'AI_Domain',
  'AI_Tech'
];

const ACCUMULATED_COLUMN_SELECTOR_OPTIONS: Array<{ key: AccumulatedFixedColumnKey | (keyof Omit<AnalysisResult, 'id'>); label: string }> = [
  ...ACCUMULATED_FIXED_COLUMNS.map(column => ({ key: column.key, label: column.label.replace(/\n/g, ' ') })),
  { key: 'Test_Item', label: '시험항목' },
  { key: 'Parameter', label: '신청기관 기준' },
  { key: 'testResult', label: '시험결과' },
  { key: 'platform', label: '시험항목별 플랫폼' },
  { key: 'mainTechField', label: '주요기술 분야' },
  { key: 'qualityMainCharacteristic', label: '시험항목별 품질특성(주특성)' },
  { key: 'qualityCharacteristic', label: '시험항목별 품질특성(부특성)' },
  { key: 'AI_Domain', label: '도메인(AI)추천' },
  { key: 'AI_Tech', label: '적용기술(AI)추천' },
  { key: 'testStandard', label: '시험표준' }
];

const ACCUMULATED_SELECT_COLUMN_WIDTH = '2%';
const getAccumulatedFixedColumnWidthStyle = (columnKey: AccumulatedFixedColumnKey) => {
  if (columnKey === 'no') return { width: '2%' };
  if (columnKey === 'reportNo') return { width: '5%' };
  if (columnKey === 'companyDomain') return { width: '5%' };
  if (columnKey === 'releaseDate') return { width: '5%' };
  if (columnKey === 'productPlatform') return { width: '5%' };
  return undefined;
};

const ANALYZE_VISIBLE_FIELDS: (keyof Omit<AnalysisResult, 'id'>)[] = [
  'Test_Item',
  'Parameter',
  'testResult',
  'platform',
  'mainTechField',
  'qualityCharacteristic',
  'AI_Domain',
  'AI_Tech',
  'testStandard'
];

const HIDDEN_ROW_FIELDS: (keyof Omit<AnalysisResult, 'id'>)[] = [
  'Report_No',
  'platform_ect',
  'mainTechField_ect',
  'qualityCharacteristic_ect'
];

const EXCEL_EXPORT_COLUMNS: Array<{ header: string; key: string }> = [
  { header: '시험 성적서 번호', key: 'report_no' },
  { header: '접수 번호', key: 'submission_id' },
  { header: '시험성적서 구분', key: 'gubun_code' },
  { header: '기관명', key: 'companyName' },
  { header: '기관 도메인', key: 'company_domain' },
  { header: '제품명', key: 'product_name' },
  { header: '신청일', key: 'request_Date' },
  { header: '시험 진행일', key: 'test_Date' },
  { header: '발급 일자', key: 'release_Date' },
  { header: '플랫폼', key: 'platform' },
  { header: '플랫폼_기타', key: 'platform_ect' },
  { header: '주요기술 분야', key: 'mainTechField' },
  { header: '주요기술 분야_기타', key: 'mainTechField_ect' },
  { header: '개요', key: 'overview' },
  { header: '시험항목 수', key: 'test_item_count' },
  { header: '참여사업명', key: 'receiving_org' },
  { header: '제출처', key: 'program_name' },
  { header: '실무자', key: 'operator' },
  { header: '시험항목', key: 'test_item' },
  { header: '신청기관 기준', key: 'test_spec' },
  { header: '시험표준', key: 'test_standard' },
  { header: '시험결과', key: 'test_result' },
  { header: '시험항목별 플랫폼', key: 'item_platform' },
  { header: '시험항목별 플랫폼 기타', key: 'item_platform_ect' },
  { header: '주요기술 분야', key: 'item_mainTechField' },
  { header: '주요기술 분야_기타', key: 'item_mainTechField_ect' },
  { header: '시험항목별 품질특성(부특성 기준)', key: 'item_attribute' },
  { header: '시험항목별 품질특성(부특성 기준) 기타', key: 'item_attribute_ect' },
  { header: '도메인(AI)추천', key: 'ai_domain' },
  { header: '적용기술(AI)추천', key: 'ai_tech' }
];

type ActiveTab = 'analyze' | 'accumulated' | 'summary';

const API_BASE_URL = (import.meta as any).env.DEV
  ? ''
  : (((import.meta as any).env.VITE_API_BASE_URL || '') as string).replace(/\/$/, '');
const APP_BASE_PATH = (((import.meta as any).env.BASE_URL || '/') as string).replace(/\/$/, '');
const ACTIVE_TAB_STORAGE_KEY = 'active_tab';
const formatFieldLabelForDisplay = (label: string) => (label || '').replace(/<br\s*\/?>/gi, '\n');

const formatIssuedDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const normalizeDateValue = (value: string) => {
  const text = (value || '').trim();
  if (!text) return '';

  let match = text.match(/(19\d{2}|20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  match = text.match(/\b(19\d{2}|20\d{2})(\d{2})(\d{2})\b/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return '';
};

const normalizeIssuedDateForView = (value: unknown) => {
  if (value === null || value === undefined) return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  const text = String(value).trim();
  if (!text) return '';

  const normalized = normalizeDateValue(text);
  if (normalized) return normalized;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  return text;
};

const extractIssuedDateFromSourceText = (sourceText: string) => {
  const text = (sourceText || '').trim();
  if (!text) return '';

  const candidates: Array<{ date: string; score: number; index: number }> = [];
  const datePattern = /(19\d{2}|20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/g;
  const compactDatePattern = /\b(19\d{2}|20\d{2})(\d{2})(\d{2})\b/g;

  const collectCandidate = (raw: string, index: number) => {
    const normalized = normalizeDateValue(raw);
    if (!normalized) return;
    const context = text.slice(Math.max(0, index - 40), Math.min(text.length, index + 40)).toLowerCase();
    let score = 0;
    if (/(발급|발행|작성|issue|issued)/.test(context)) score += 8;
    if (/(일자|date)/.test(context)) score += 3;
    if (/(시험기간|유효기간|만료|expiry|expiration|측정일|시험일|채취일)/.test(context)) score -= 7;
    if (/(입력일|등록일|insert|upload)/.test(context)) score -= 4;
    candidates.push({ date: normalized, score, index });
  };

  let matched: RegExpExecArray | null;
  while ((matched = datePattern.exec(text)) !== null) {
    collectCandidate(matched[0], matched.index);
  }
  while ((matched = compactDatePattern.exec(text)) !== null) {
    collectCandidate(matched[0], matched.index);
  }

  if (candidates.length === 0) return '';

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const best = candidates[0];
  if (best.score > 0) return best.date;

  // 키워드 근거가 약한 경우에도 날짜 후보가 하나면 사용
  const uniqueDates = Array.from(new Set(candidates.map(c => c.date)));
  return uniqueDates.length === 1 ? uniqueDates[0] : '';
};

const getTopPrioritySourceText = (sourceText: string) => {
  const text = (sourceText || '').trim();
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const topLines: string[] = [];
  let captureTopSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^\[페이지\s*\d+\s*상단\]/.test(line)) {
      captureTopSection = true;
      continue;
    }
    if (/^\[(?:페이지\s*\d+|페이지\s*전체\s*본문|페이지\s*상단\s*요약)\]/.test(line)) {
      captureTopSection = false;
      continue;
    }
    if (captureTopSection) {
      topLines.push(line);
    }
  }

  if (topLines.length > 0) {
    return topLines.join('\n');
  }

  return lines.slice(0, 40).join('\n');
};

const extractParagraphTextFromWordXml = (xml: string) => {
  const text = (xml || '').trim();
  if (!text) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
      return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const allNodes = Array.from(doc.getElementsByTagName('*'));
    const paragraphNodes = allNodes.filter(node => node.localName === 'p');
    if (paragraphNodes.length === 0) {
      return (doc.documentElement?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return paragraphNodes
      .map(node => (node.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
  } catch {
    return text
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

const extractWordHeaderText = async (arrayBuffer: ArrayBuffer) => {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const headerFileNames = Object.keys(zip.files)
      .filter(name => /^word\/header\d+\.xml$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (headerFileNames.length === 0) return '';

    const headerTexts: string[] = [];
    for (const fileName of headerFileNames) {
      const file = zip.file(fileName);
      if (!file) continue;
      const xml = await file.async('string');
      const parsed = extractParagraphTextFromWordXml(xml);
      if (parsed) headerTexts.push(parsed);
    }

    return headerTexts.join('\n').trim();
  } catch {
    return '';
  }
};

const sanitizeIdentifierValue = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : String(value || '').trim();
  if (!text) return '';
  const normalized = text
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return '';
  if (/^(?:-|—|미기재|없음|해당없음|n\/a|na|null|undefined)$/iu.test(normalized)) return '';
  return normalized;
};

const extractReportNumberFromSourceText = (sourceText: string) => {
  const text = (sourceText || '').trim();
  if (!text) return '';

  const priorityText = getTopPrioritySourceText(text);
  const normalizeForSearch = (value: string) => value.replace(/([가-힣])\s+(?=[가-힣])/g, '$1');
  const normalizeCandidate = (value: string) => value
    .replace(/^[\s:：\-=/]+/, '')
    .replace(/[,\s;|]+$/, '')
    .trim();
  const splitByNextLabel = (value: string) => value
    .split(/\s{2,}|[,;|]/)[0]
    .split(/(?=(?:접수(?:번호)?|의뢰번호|신청번호|작성자|담당자|실무자|기관명|회사명|제품명|시험항목|발급일))/i)[0]
    .trim();
  const looksLikeDateToken = (value: string) =>
    /^(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{8})$/.test(value);

  const extractFromText = (input: string) => {
    const normalized = normalizeForSearch(input);
    const keywordPattern = /(성적서\s*번호|보고서\s*번호|report\s*(?:no\.?|number)|certificate\s*(?:no\.?|number))/i;
    const lines = normalized
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    for (let idx = 0; idx < lines.length; idx += 1) {
      const line = lines[idx];
      if (!keywordPattern.test(line)) continue;
      const cleaned = normalizeCandidate(
        line.replace(/^.*?(성적서\s*번호|보고서\s*번호|report\s*(?:no\.?|number)|certificate\s*(?:no\.?|number))/i, '')
      );
      const candidate = splitByNextLabel(cleaned);
      if (candidate && !looksLikeDateToken(candidate)) {
        const sanitized = sanitizeIdentifierValue(candidate);
        if (sanitized) return sanitized;
      }

      const nextLine = lines[idx + 1] || '';
      if (nextLine) {
        const nextCandidate = splitByNextLabel(normalizeCandidate(nextLine));
        if (nextCandidate && !looksLikeDateToken(nextCandidate)) {
          const sanitized = sanitizeIdentifierValue(nextCandidate);
          if (sanitized) return sanitized;
        }
      }
    }

    const inlineMatch = normalized.match(/(?:성적서\s*번호|보고서\s*번호|report\s*(?:no\.?|number)|certificate\s*(?:no\.?|number))\s*[:：=]?\s*([^\n\r,;|]+)/i);
    if (inlineMatch?.[1]) {
      const inlineCandidate = splitByNextLabel(normalizeCandidate(inlineMatch[1]));
      if (inlineCandidate && !looksLikeDateToken(inlineCandidate)) {
        const sanitized = sanitizeIdentifierValue(inlineCandidate);
        if (sanitized) return sanitized;
      }
    }

    const tokenMatch = normalized.match(/(?:성적서\s*번호|보고서\s*번호|report\s*(?:no\.?|number)|certificate\s*(?:no\.?|number))\s*[:：=\-]?\s*([A-Za-z0-9][A-Za-z0-9\-_/().]*)/i);
    const token = tokenMatch?.[1]?.trim() || '';
    if (token && !looksLikeDateToken(token)) {
      const sanitized = sanitizeIdentifierValue(token);
      if (sanitized) return sanitized;
    }

    return '';
  };

  return extractFromText(priorityText) || extractFromText(text);
};

const extractReceiptNumberFromSourceText = (sourceText: string, reportNoHint?: string) => {
  const text = (sourceText || '').trim();
  if (!text) return '';

  const priorityText = getTopPrioritySourceText(text);
  const keywordPattern = /(접\s*수\s*번\s*호|접\s*수\s*no\.?|receipt\s*(?:no\.?|number)|registration\s*(?:no\.?|number))/i;
  const splitByNextLabel = (value: string) => value
    .split(/\s{2,}|[,;|]/)[0]
    .split(/(?=(?:성적서(?:번호)?|보고서(?:번호)?|작성자|담당자|실무자|기관명|회사명|제품명|시험항목|발급일|접수일))/i)[0]
    .trim();
  const normalizeForCompare = (value: string) =>
    value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, '');
  const looksLikeDateToken = (value: string) =>
    /^(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{8})$/.test(value);
  const toCandidateToken = (value: string) => {
    const cleaned = splitByNextLabel(
      value
        .replace(/^[\s:：\-]+/, '')
        .replace(/^.*?(접\s*수\s*번\s*호|접\s*수\s*no\.?|receipt\s*(?:no\.?|number)|registration\s*(?:no\.?|number)|의뢰번호|신청번호)/i, '')
        .replace(/^[\s:：\-=/]+/, '')
        .trim()
    );
    if (!cleaned) return '';
    const token = cleaned.split(/\s+/)[0]?.trim() || '';
    if (!token) return '';
    if (looksLikeDateToken(token)) return '';
    return token;
  };
  const extractFromText = (input: string) => {
    // PDF/OCR에서 "접 수 번 호"처럼 한글 글자 사이 공백이 삽입되는 경우를 보정
    const normalizedText = input.replace(/([가-힣])\s+(?=[가-힣])/g, '$1');
    const lines = normalizedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    for (let idx = 0; idx < lines.length; idx += 1) {
      const line = lines[idx];
      if (!keywordPattern.test(line)) continue;
      const cleaned = line
        .replace(/^.*?(접\s*수\s*번\s*호|접\s*수\s*no\.?|receipt\s*(?:no\.?|number)|registration\s*(?:no\.?|number))/i, '')
        .replace(/^[\s:：\-]+/, '')
        .replace(/^[=]+/, '')
        .replace(/[,\s;|]+$/, '')
        .trim();
      const candidate = splitByNextLabel(cleaned);
      if (candidate) {
        const sanitized = sanitizeIdentifierValue(candidate);
        if (sanitized) return sanitized;
      }

      // 키워드 줄에 값이 없고 다음 줄에 값이 이어지는 케이스 대응
      const nextLine = lines[idx + 1] || '';
      if (nextLine) {
        const nextCandidate = splitByNextLabel(nextLine.replace(/^[\s:：\-]+/, '').trim());
        if (nextCandidate) {
          const sanitized = sanitizeIdentifierValue(nextCandidate);
          if (sanitized) return sanitized;
        }
      }
    }

    const inlineMatch = normalizedText.match(/(?:접\s*수\s*번\s*호|접\s*수\s*no\.?|receipt\s*(?:no\.?|number)|registration\s*(?:no\.?|number))\s*[:：=]?\s*([^\n\r,;|]+)/i);
    const inlineCandidate = inlineMatch?.[1] ? splitByNextLabel(inlineMatch[1]) : '';
    if (inlineCandidate) {
      const sanitized = sanitizeIdentifierValue(inlineCandidate);
      if (sanitized) return sanitized;
    }

    // 위치 기반 보정: 접수번호가 성적서번호(보고서번호) 윗줄에 있는 양식을 우선 대응
    const reportHintNormalized = normalizeForCompare(reportNoHint || '');
    const reportLineIndexes: number[] = [];
    for (let idx = 0; idx < lines.length; idx += 1) {
      const line = lines[idx];
      const normalizedLine = normalizeForCompare(line);
      if (!normalizedLine) continue;
      const isReportNoLineByHint = reportHintNormalized && normalizedLine.includes(reportHintNormalized);
      const isReportNoLineByLabel = /(성적서\s*번호|보고서\s*번호|report\s*no\.?|certificate\s*no\.?)/i.test(line);
      if (isReportNoLineByHint || isReportNoLineByLabel) {
        reportLineIndexes.push(idx);
      }
    }

    for (const reportIdx of reportLineIndexes) {
      for (let offset = 1; offset <= 2; offset += 1) {
        const upperLine = lines[reportIdx - offset] || '';
        if (!upperLine) continue;
        const candidate = toCandidateToken(upperLine);
        if (!candidate) continue;
        const normalizedCandidate = normalizeForCompare(candidate);
        if (reportHintNormalized && normalizedCandidate === reportHintNormalized) continue;
        const sanitized = sanitizeIdentifierValue(candidate);
        if (sanitized) return sanitized;
      }
    }

    // 마지막 보정: 키워드 이후 토큰에서 접수번호 형태(영문/숫자/하이픈/슬래시) 추출
    const blockMatch = normalizedText.match(/(?:접\s*수\s*번\s*호|접\s*수\s*no\.?|receipt\s*(?:no\.?|number)|registration\s*(?:no\.?|number))\s*[:：=\-]?\s*([A-Za-z0-9][A-Za-z0-9\-_/().]*)/i);
    return sanitizeIdentifierValue(blockMatch?.[1] || '');
  };

  return extractFromText(priorityText) || extractFromText(text);
};

const extractPractitionerFromSourceText = (sourceText: string) => {
  const text = (sourceText || '').trim();
  if (!text) return '';

  const keywordPattern = /(작성자|author|실무자|담당자|담당\s*자|책임자|담당\s*연구원|contact|manager)/i;
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!keywordPattern.test(line)) continue;
    const cleaned = line
      .replace(/^.*?(작성자|author|실무자|담당자|담당\s*자|책임자|담당\s*연구원|contact|manager)/i, '')
      .replace(/^[\s:：\-]+/, '')
      .trim();
    if (!cleaned) continue;
    const candidate = cleaned.split(/\s{2,}|[,;|/]/)[0].trim();
    if (candidate) return candidate;
  }

  const inlineMatch = text.match(/(?:작성자|author|실무자|담당자|담당\s*자|책임자|담당\s*연구원|contact|manager)\s*[:：]?\s*([^\n\r,;|]+)/i);
  return inlineMatch?.[1]?.trim() || '';
};

const splitOtherWithDetail = (value: string, otherLabel: '기타' | '그외') => {
  const text = (value || '').trim();
  if (!text) return { value: '', detail: '' };

  const escaped = otherLabel === '기타' ? '기\\s*타' : '그\\s*외';
  const withDetail = new RegExp(`^${escaped}(?:\\s*[:\\-]\\s*|\\s*\\(\\s*)([^)]+)\\)?$`, 'u');
  const onlyOther = new RegExp(`^${escaped}$`, 'u');

  const match = text.match(withDetail);
  if (match?.[1]?.trim()) {
    return { value: otherLabel, detail: match[1].trim() };
  }
  if (onlyOther.test(text)) {
    return { value: otherLabel, detail: '' };
  }
  return { value: text, detail: '' };
};

const stripAiRecommendationDetail = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    .trim();
};

const stripRepresentativeDomainDetail = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  const cleaned = text
    .replace(/[（(][^()（）]*[)）]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*[:\-]\s*$/g, '')
    .trim();
  return cleaned || '미분류';
};

const hydratePlatformForView = (row: any) => {
  if (!row || typeof row !== 'object') return row;

  const next = { ...row };
  const rowAny = row as Record<string, unknown>;
  const reportNoRaw = row.Report_No ?? row.report_no;
  const testItemRaw = row.Test_Item ?? row.test_item;
  const parameterRaw = row.Parameter ?? row.test_spec ?? row.parameter;
  const testStandardRaw = row.testStandard ?? row.test_standard ?? rowAny.teststandard;
  const testResultRaw = row.testResult ?? row.test_result;
  const aiDomainRaw = row.AI_Domain ?? row.ai_domain;
  const aiTechRaw = row.AI_Tech ?? row.ai_tech;
  const platformRaw = row.platform ?? row.item_platform;
  const platform = typeof platformRaw === 'string' ? platformRaw.trim() : '';
  const platformEtcRaw = row.platform_ect ?? row.platformEtc ?? row.platform_etc ?? row.item_platform_ect;
  const platformEtc = typeof platformEtcRaw === 'string' ? platformEtcRaw.trim() : '';
  const mainTechFieldRaw = row.mainTechField ?? row.item_mainTechField;
  const mainTechField = typeof mainTechFieldRaw === 'string' ? mainTechFieldRaw.trim() : '';
  const mainTechFieldEtcRaw = row.mainTechField_ect ?? row.mainTechFieldEtc ?? row.mainTechField_etc ?? row.item_mainTechField_ect;
  const mainTechFieldEtc = typeof mainTechFieldEtcRaw === 'string' ? mainTechFieldEtcRaw.trim() : '';
  const qualityMainCharacteristicRaw =
    row.qualityMainCharacteristic ?? row.quality_main_characteristic ?? row.item_attribute_main ?? row.item_attribute;
  const qualityMainCharacteristic = typeof qualityMainCharacteristicRaw === 'string'
    ? qualityMainCharacteristicRaw.trim()
    : '';
  const qualityCharacteristicRaw =
    row.qualityCharacteristic ?? row.quality_characteristic ?? row.item_attribute_sub ?? row.item_attribute ?? row.representativeDomain;
  const qualityCharacteristic = typeof qualityCharacteristicRaw === 'string'
    ? stripRepresentativeDomainDetail(qualityCharacteristicRaw)
    : '';
  const qualityCharacteristicEtcRaw =
    row.qualityCharacteristic_ect ?? row.qualityCharacteristicEtc ?? row.qualityCharacteristic_etc ?? row.item_attribute_ect;
  const qualityCharacteristicEtc = typeof qualityCharacteristicEtcRaw === 'string'
    ? qualityCharacteristicEtcRaw.trim()
    : '';

  const parsedPlatformLegacy = splitOtherWithDetail(platform, '기타');
  const parsedPlatform = parsedPlatformLegacy.value === '기타'
    ? { value: '그외', detail: parsedPlatformLegacy.detail }
    : splitOtherWithDetail(platform, '그외');
  const parsedMainTech = splitOtherWithDetail(mainTechField, '그외');
  const companyDomainRaw = row.company_domain ?? row.companyDomain ?? row.organizationDomain ?? row.representativeDomain;
  const companyDomain = typeof companyDomainRaw === 'string' ? companyDomainRaw.trim() : '';

  next.platform = parsedPlatform.value || platform || '';
  next.platform_ect = platformEtc || parsedPlatform.detail || '';
  next.mainTechField = parsedMainTech.value || mainTechField || '';
  next.mainTechField_ect = mainTechFieldEtc || parsedMainTech.detail || '';
  next.company_domain = companyDomain;
  next.Report_No = typeof reportNoRaw === 'string' ? reportNoRaw.trim() : (reportNoRaw || '');
  next.Test_Item = typeof testItemRaw === 'string' ? testItemRaw.trim() : (testItemRaw || '');
  next.Parameter = typeof parameterRaw === 'string' ? parameterRaw.trim() : (parameterRaw || '');
  next.testStandard = typeof testStandardRaw === 'string' ? testStandardRaw.trim() : String(testStandardRaw ?? '').trim();
  next.testResult = typeof testResultRaw === 'string' ? testResultRaw.trim() : (testResultRaw || '');
  next.created_at = next.created_at || next.insert_date || row.created_at || row.insert_date || '';
  next.release_Date = normalizeIssuedDateForView(row.release_Date ?? row.releaseDate ?? row.release_date);
  next.qualityMainCharacteristic = qualityMainCharacteristic;
  next.representativeDomain = stripRepresentativeDomainDetail(row.representativeDomain);
  next.qualityCharacteristic = qualityCharacteristic || next.representativeDomain || '';
  next.qualityCharacteristic_ect = qualityCharacteristicEtc || '';
  next.AI_Domain = stripAiRecommendationDetail(aiDomainRaw);
  next.AI_Tech = stripAiRecommendationDetail(aiTechRaw);

  return next;
};

const normalizeAccumulatedRow = (row: unknown, fallbackId: number): AnalysisResult | null => {
  const hydrated = hydratePlatformForView(row);
  if (!hydrated || typeof hydrated !== 'object' || Array.isArray(hydrated)) return null;

  const source = hydrated as Record<string, unknown>;
  const parsedId = Number(source.id);
  const safeId = Number.isFinite(parsedId) ? parsedId : fallbackId;
  return {
    ...(source as Omit<AnalysisResult, 'id'>),
    id: safeId
  } as AnalysisResult;
};

export default function App() {
  const hasAdminFlag = (value: unknown) => String(value ?? '').trim() === '1';
  const getStoredAdminFlag = () => {
    try {
      const rawMember = localStorage.getItem('member');
      if (!rawMember) return false;
      const parsed = JSON.parse(rawMember) as Record<string, unknown>;
      return hasAdminFlag(parsed?.admin_flag);
    } catch {
      return false;
    }
  };

  const [loginId, setLoginId] = useState<string | null>(() => localStorage.getItem('login_id'));
  const [isAdminMember, setIsAdminMember] = useState<boolean>(() => getStoredAdminFlag());
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const expire = localStorage.getItem('session_expire');
    if (expire && Date.now() < Number(expire)) {
      return true;
    }
    localStorage.removeItem('session_expire');
    return false;
  });

  React.useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      const expire = localStorage.getItem('session_expire');
      if (!expire || Date.now() > Number(expire)) {
        localStorage.removeItem('session_expire');
        localStorage.removeItem('member');
        setIsLoggedIn(false);
        alert('세션이 만료되어 자동 로그아웃되었습니다.');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [visibleAccumulatedColumnKeys, setVisibleAccumulatedColumnKeys] = useState<
    Set<AccumulatedFixedColumnKey | (keyof Omit<AnalysisResult, 'id'>)>
  >(() => new Set(ACCUMULATED_DEFAULT_VISIBLE_COLUMN_KEYS));
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearchInput, setAppliedSearchInput] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'AI' | '일반' | 'KOLAS' | 'KOLAS AI'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preparingPrompt, setPreparingPrompt] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState('');
  const [isInsertQueryModalOpen, setIsInsertQueryModalOpen] = useState(false);
  const [insertQueryPreview, setInsertQueryPreview] = useState('');
  const [copyQueryMessage, setCopyQueryMessage] = useState('');
  const [isExcelPreviewModalOpen, setIsExcelPreviewModalOpen] = useState(false);
  const [isPreparingExcelPreview, setIsPreparingExcelPreview] = useState(false);
  const [excelPreviewRows, setExcelPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [excelPreviewErrorMessage, setExcelPreviewErrorMessage] = useState('');
  const [excelPreviewNoticeMessage, setExcelPreviewNoticeMessage] = useState('');
  const [pendingInsertPayload, setPendingInsertPayload] = useState<AnalysisResult[]>([]);
  const [pendingSummaryPayload, setPendingSummaryPayload] = useState<AnalysisInfoPayload | null>(null);
  const [savingAccumulated, setSavingAccumulated] = useState(false);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [accumulatedResults, setAccumulatedResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accumulatedLoadError, setAccumulatedLoadError] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [submissionOffice, setSubmissionOffice] = useState('');
  const [participatingProjectName, setParticipatingProjectName] = useState('');
  const [quickAnalysisMode, setQuickAnalysisMode] = useState(true);
  const canUseAnalysisModeToggle = (loginId || '').trim().toLowerCase() === 'jakim2';
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const storedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return storedTab === 'analyze' || storedTab === 'accumulated' || storedTab === 'summary'
      ? storedTab
      : 'summary';
  });
  const sourceTextCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Non-jakim accounts should not control analysis mode.
    if (!canUseAnalysisModeToggle) {
      setQuickAnalysisMode(true);
    }
  }, [canUseAnalysisModeToggle]);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsAdminMember(false);
      return;
    }
    setIsAdminMember(getStoredAdminFlag());
  }, [isLoggedIn, loginId]);

  // API 기본 URL 생성
  const getApiUrl = () => {
    if (API_BASE_URL) return API_BASE_URL;
    const { protocol, hostname, port } = window.location;
    const isLocalFrontend = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLikelyDevFrontend = port === '5173' || port === '4173';
    if (isLocalFrontend || isLikelyDevFrontend || protocol === 'http:') {
      return `${protocol}//${hostname}:8080`;
    }
    return APP_BASE_PATH || '';
  };

  const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 120000) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const toSafeSearchText = (value: unknown) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return String(value);
    } catch {
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }
  };

  const getAccumulatedReportType = (row: Partial<AnalysisResult>) => {
    const byReportNo = getReportType(String(row.Report_No || '').trim());
    if (byReportNo === 'KOLAS 시험성적서') return 'KOLAS';
    if (byReportNo === '일반 AI 성적서') return 'AI';
    if (byReportNo === '일반 성적서') return '일반';

    const gubun = toSafeSearchText(row.gubun_code).toUpperCase();
    if (gubun.includes('KOLAS') && gubun.includes('AI')) return 'KOLAS AI';
    if (gubun.includes('KOLAS')) return 'KOLAS';
    if (gubun.includes('AI')) return 'AI';
    if (gubun.includes('일반')) return '일반';

    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'gpt', 'llm',
      'classification', 'vision', 'nlp', 'speech', 'audio', 'forecast', 'prediction',
      'summarization', 'translation', 'anomaly', 'detect', 'recommend'
    ];
    const text = [
      row.AI_Tech,
      row.AI_Domain,
      row.mainTechField,
      row.productName,
      row.Test_Item
    ]
      .map(toSafeSearchText)
      .join(' ')
      .toLowerCase();
    return aiKeywords.some(keyword => text.includes(keyword)) ? 'AI' : '일반';
  };

  const getSearchableRowText = (row: Partial<AnalysisResult>) => {
    const fieldValues = [
      row.gubun_code,
      row.Report_No,
      row.receiptNumber,
      row.practitioner,
      row.release_Date,
      row.company_name,
      row.company_domain,
      row.representativeDomain,
      row.qualityMainCharacteristic,
      row.mainTechField,
      row.mainTechField_ect,
      row.productName,
      row.productPlatform,
      row.overview,
      row.Test_Item,
      row.Parameter,
      row.testStandard,
      row.testResult,
      row.qualityCharacteristic,
      row.qualityCharacteristic_ect,
      row.AI_Domain,
      row.AI_Tech,
      row.platform,
      row.platform_ect,
      row.Metrics,
      row.Metrics_ect,
      row.EQ,
      row.EQ_ect
    ].map(toSafeSearchText);
    return `${fieldValues.join(' ')} ${getAccumulatedReportType(row)}`.toLowerCase();
  };

  const isMissingDateText = (value: unknown) => {
    const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
    if (!text) return true;
    return /^(?:-|—|미기재|없음|해당없음|n\/a|na|null|undefined)$/iu.test(text);
  };

  const getAccumulatedIssuedDate = (row: AnalysisResult) => {
    const candidates = [
      (row as any).release_Date,
      (row as any).releaseDate,
      (row as any).release_date,
      row.created_at,
      row.insert_date
    ];

    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined) continue;
      if (isMissingDateText(candidate)) continue;
      const normalized = normalizeIssuedDateForView(candidate);
      if (!isMissingDateText(normalized)) {
        return normalized;
      }
    }

    return '미기재';
  };

  const visibleAccumulatedFixedColumns = React.useMemo(
    () => ACCUMULATED_FIXED_COLUMNS.filter((column) => visibleAccumulatedColumnKeys.has(column.key)),
    [visibleAccumulatedColumnKeys]
  );
  const visibleAccumulatedListFields = React.useMemo(
    () => LIST_VISIBLE_FIELDS.filter((fieldKey) => visibleAccumulatedColumnKeys.has(fieldKey)),
    [visibleAccumulatedColumnKeys]
  );
  const toggleAccumulatedColumnVisibility = (columnKey: AccumulatedFixedColumnKey | (keyof Omit<AnalysisResult, 'id'>)) => {
    setVisibleAccumulatedColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(columnKey)) {
        if (next.size === 1) return prev;
        next.delete(columnKey);
      } else {
        next.add(columnKey);
      }
      return next;
    });
  };
  const resetAccumulatedColumnVisibility = () => {
    setVisibleAccumulatedColumnKeys(new Set(ACCUMULATED_DEFAULT_VISIBLE_COLUMN_KEYS));
  };
  const applyAccumulatedSearch = React.useCallback(() => {
    setAppliedSearchInput(searchInput.trim());
    setCurrentPage(1);
  }, [searchInput]);

  const filteredResults = React.useMemo(() => accumulatedResults.filter(row => {
    if (!row || typeof row !== 'object') return false;

    // 텍스트 검색 필터
    if (appliedSearchInput.trim()) {
      const text = appliedSearchInput.trim().toLowerCase();
      const searchableText = getSearchableRowText(row);
      if (!searchableText.includes(text)) return false;
    }

    // 보고서 종류 필터
    if (reportTypeFilter !== 'all') {
      const reportType = getAccumulatedReportType(row);
      let typeMatch = false;
      if (reportTypeFilter === 'AI') {
        typeMatch = reportType === 'AI';
      } else if (reportTypeFilter === '일반') {
        typeMatch = reportType === '일반';
      } else if (reportTypeFilter === 'KOLAS') {
        typeMatch = reportType === 'KOLAS';
      } else if (reportTypeFilter === 'KOLAS AI') {
        typeMatch = reportType === 'KOLAS AI';
      }
      if (!typeMatch) return false;
    }

    // 발급년도 필터
    if (yearFilter !== 'all') {
      const issuedDate = getAccumulatedIssuedDate(row);
      if (!issuedDate) return false;
      const date = new Date(issuedDate);
      if (Number.isNaN(date.getTime())) return false;
      const year = date.getFullYear().toString();
      if (year !== yearFilter) return false;
    }

    return true;
  }), [accumulatedResults, appliedSearchInput, reportTypeFilter, yearFilter]);
  const hasActiveAccumulatedFilter = Boolean(appliedSearchInput.trim())
    || reportTypeFilter !== 'all'
    || yearFilter !== 'all';

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage, ITEMS_PER_PAGE]);

  const accumulatedGroupNoByRowId = React.useMemo(() => {
    const byRowId: Record<number, number> = {};
    const groupNoByReportNo = new Map<string, number>();
    let nextGroupNo = 1;

    filteredResults.forEach((row) => {
      const reportNo = typeof row.Report_No === 'string' ? row.Report_No.trim() : '';
      if (reportNo) {
        if (!groupNoByReportNo.has(reportNo)) {
          groupNoByReportNo.set(reportNo, nextGroupNo);
          nextGroupNo += 1;
        }
        byRowId[row.id] = groupNoByReportNo.get(reportNo)!;
        return;
      }

      byRowId[row.id] = nextGroupNo;
      nextGroupNo += 1;
    });

    return byRowId;
  }, [filteredResults]);

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const selectedRows = accumulatedResults.filter(row => selectedIds.has(row.id));
    const selectedReportNos = Array.from(
      new Set(
        selectedRows
          .map(row => (typeof row.Report_No === 'string' ? row.Report_No.trim() : ''))
          .filter(Boolean)
      )
    );
    const selectedReportNoText = selectedReportNos.length > 0
      ? selectedReportNos.join(', ')
      : 'report_no 없음';
    if (!window.confirm(`선택한 성적서 번호(${selectedReportNoText}) 데이터를 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`${getApiUrl()}/analysis-results/delete-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportNos: selectedReportNos,
          ids: Array.from(selectedIds)
        })
      });

      if (!response.ok) throw new Error('삭제 실패');

      const selectedReportNoSet = new Set(selectedReportNos);
      setAccumulatedResults(prev => prev.filter(row => {
        const reportNo = typeof row.Report_No === 'string' ? row.Report_No.trim() : '';
        if (reportNo) {
          return !selectedReportNoSet.has(reportNo);
        }
        return !selectedIds.has(row.id);
      }));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '선택 삭제 중 오류가 발생했습니다.');
    }
  };

  const fetchAccumulated = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/analysis-results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsed: Record<string, any> | null = null;
        try {
          parsed = errorText ? JSON.parse(errorText) : null;
        } catch {
          parsed = null;
        }
        throw new Error(parsed?.error || parsed?.message || `조회 실패 (HTTP ${response.status})`);
      }
      const data = await response.json();
      const normalizedRows = Array.isArray(data.results)
        ? data.results
          .map((row: unknown, index: number) => normalizeAccumulatedRow(row, -(index + 1)))
          .filter((row: AnalysisResult | null): row is AnalysisResult => row !== null)
        : [];
      setAccumulatedResults(normalizedRows);
      setAccumulatedLoadError(null);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setAccumulatedLoadError(err?.message || String(err));
    }
  };

  useEffect(() => {
    fetchAccumulated();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
      setResults(null);
      setPromptDraft('');
      setIsPromptModalOpen(false);
      return;
    }

    setError('PDF 또는 Word(docx) 파일만 업로드 가능합니다.');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    multiple: false
  });

  const getRequiredText = (value: unknown, fallback = '미기재') => {
    const normalized = typeof value === 'string' ? value.trim() : String(value || '').trim();
    return normalized ? normalized : fallback;
  };

  const inferTestStandardFromContext = (row: Partial<AnalysisResult>) => {
    const context = `${row.testStandard || ''} ${row.Parameter || ''} ${row.testResult || ''} ${row.Test_Item || ''}`
      .replace(/\s+/g, ' ')
      .trim();
    if (!context) return '';

    const codeMatches = Array.from(
      new Set(
        (context.match(/\b(?:KS|KS\s*C|ISO|IEC|ASTM|JIS|EN)\s*[-:]?\s*[A-Z0-9.-]+/gi) || [])
          .map(match => match.replace(/\s+/g, ' ').trim())
      )
    );
    if (codeMatches.length > 0) {
      return codeMatches.join(', ');
    }

    const methodMatch = context.match(/(?:시험방법|시험 표준|시험규격|test method|test standard)\s*[:：]?\s*([^,;|]+)/i);
    if (methodMatch?.[1]?.trim()) {
      return methodMatch[1].trim();
    }

    return '';
  };

  const stripConformanceWords = (value: unknown, fallback = '미기재') => {
    const normalized = typeof value === 'string'
      ? value.replace(/\r/g, '\n').trim()
      : String(value || '').trim();
    if (!normalized) return fallback;

    const cleaned = normalized
      .replace(/\(\s*(?:부적합|적합)\s*\)/g, ' ')
      .replace(/\[\s*(?:부적합|적합)\s*\]/g, ' ')
      .replace(/(^|[\s,;|/:])(?:부적합|적합)(?=($|[\s,;|/:]))/g, '$1')
      .replace(/\s*([,;|/:])\s*/g, '$1 ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/^[,;|/:\s]+|[,;|/:\s]+$/g, '')
      .trim();

    return cleaned || fallback;
  };

  const formatTestResultForDisplay = (value: unknown) => {
    const cleaned = stripConformanceWords(value, '');
    if (!cleaned) return '-';
    const noParens = cleaned.replace(/[()]/g, '').trim();
    return noParens || '-';
  };

  const formatMainTechFieldForDisplay = (row: Partial<AnalysisResult>) => {
    const base = (row.mainTechField || '').trim();
    const detail = (row.mainTechField_ect || '').trim();
    if (/^그\s*외$/u.test(base)) {
      const resolvedDetail = detail || getOtherTechDetail(row);
      return resolvedDetail ? `그외(${resolvedDetail})` : '그외';
    }
    return base || '-';
  };

  const getListFieldDisplayValue = (row: AnalysisResult, key: keyof Omit<AnalysisResult, 'id'>) => {
    const rowAny = row as unknown as Record<string, unknown>;
    const toDisplay = (value: unknown) => {
      const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
      return text || '-';
    };

    if (key === 'testResult') {
      return formatTestResultForDisplay(row[key]);
    }
    if (key === 'testStandard') {
      return toDisplay(row.testStandard ?? rowAny.test_standard ?? rowAny.teststandard);
    }
    if (key === 'qualityMainCharacteristic') {
      return toDisplay(
        row.qualityMainCharacteristic
        ?? rowAny.item_attribute
        ?? rowAny.item_attribute_main
      );
    }
    if (key === 'qualityCharacteristic') {
      return toDisplay(
        row.qualityCharacteristic
        ?? rowAny.item_attribute_sub
        ?? rowAny.item_attribute
        ?? row.representativeDomain
      );
    }
    return row[key] || '-';
  };

  const allowedMainTechFields = new Set([
    '인공지능(AI)',
    '블록체인',
    '메타버스',
    '사물인터넷(IoT)',
    '임베디드 시스템',
    '로봇',
    '클라우드',
    '정보보안',
    '통신',
    '빅데이터',
    '그외'
  ]);

  const ensureAiRecommendationFormat = (value: unknown, fallback: string) => {
    const normalizeWithSummary = (input: unknown, defaultSummary: string) => {
      const normalized = stripAiRecommendationDetail(input);
      if (!normalized) return '';

      const base = normalized.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
      if (!base) return '';
      const summary = (normalized.match(/\(([^)]*)\)/)?.[1] || '').replace(/\s+/g, ' ').trim();
      return `${base}(${summary || defaultSummary})`;
    };

    return (
      normalizeWithSummary(value, '시험항목 목적/시험방법 기반 요약') ||
      normalizeWithSummary(fallback, '시험항목 목적/시험방법 기반 요약') ||
      '미분류(설명 없음)'
    );
  };

  const getOtherTechDetail = (row: Partial<AnalysisResult>) => {
    const raw = row as Record<string, any>;
    const explicitDetail = [
      raw.mainTechField_ect,
      raw.mainTechFieldEtc,
      raw.mainTechField_etc
    ].find(value => typeof value === 'string' && value.trim());
    if (typeof explicitDetail === 'string' && explicitDetail.trim()) {
      return explicitDetail.trim();
    }

    const testText = `${row.Test_Item || ''}`.toLowerCase();
    const purposeText = `${row.Parameter || ''} ${row.testResult || ''}`.toLowerCase();
    const deviceText = `${row.productName || ''} ${row.overview || ''}`.toLowerCase();
    const fullText = `${testText} ${purposeText} ${deviceText}`.trim();

    const detailRules: Array<{ label: string; pattern: RegExp }> = [
      { label: '의료기기 소프트웨어', pattern: /의료|내시경|진단|수술|헬스|의료기기|환자|바이오/ },
      { label: '시험·계측 평가', pattern: /시험|평가|검증|인증|측정|계측|정확도|정밀도|재현율|오차|ndcg|m\s*ap|precision|recall/ },
      { label: '제어·구동 소프트웨어', pattern: /제어|구동|모터|엔코더|회전각|각도|자세|위치|actuator|servo|pid|mpc|imu|gyro/ },
      { label: '데이터 처리·분석', pattern: /데이터|정합|품질|가공|분석|집계|통계|파이프라인|warehouse|etl/ },
      { label: '영상·이미지 처리', pattern: /이미지|영상|camera|vision|화질|검출|분할|객체/ },
      { label: '음성·신호 처리', pattern: /음성|오디오|speech|audio|신호|주파수|fft|필터/ },
      { label: '응용 소프트웨어', pattern: /앱|application|소프트웨어|프로그램|서비스|platform|시스템/ }
    ];

    const matchedRule = detailRules.find(rule => rule.pattern.test(fullText));
    if (matchedRule) return matchedRule.label;

    const seedText = [row.Test_Item, row.Parameter, row.productName, row.overview, row.representativeDomain]
      .find(value => typeof value === 'string' && value.trim());
    if (!seedText) return '세부기술 미기재';

    const normalized = String(seedText)
      .replace(/\s+/g, ' ')
      .replace(/[()[\]{}]/g, ' ')
      .replace(/(?:시험항목|신청기관\s*기준|시험결과|기준값|평가결과|측정값|정확도|정밀도|재현율)/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!normalized) return '세부기술 미기재';

    const firstChunk = normalized.split(/[.,;:/|]/)[0].trim();
    const capped = firstChunk.length > 24 ? `${firstChunk.slice(0, 24).trim()}...` : firstChunk;
    return capped || '세부기술 미기재';
  };

  const normalizeMainTechFieldValue = (value: unknown, fallback: string, row: Partial<AnalysisResult>) => {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) {
      return /^그\s*외$/u.test(fallback) ? `그외(${getOtherTechDetail(row)})` : fallback;
    }

    // "그외"는 상세 분야를 반드시 괄호로 표시
    if (/^그\s*외$/u.test(text)) {
      return `그외(${getOtherTechDetail(row)})`;
    }

    if (allowedMainTechFields.has(text)) {
      return text;
    }

    const otherWithDetailMatch = text.match(/^그\s*외(?:\s*[:\-]\s*|\s*\(\s*)([^)]+)\)?$/);
    if (otherWithDetailMatch?.[1]?.trim()) {
      return `그외(${otherWithDetailMatch[1].trim()})`;
    }

    if (/^그\s*외$/u.test(fallback)) {
      return `그외(${getOtherTechDetail(row)})`;
    }

    return fallback;
  };

  const getRepresentativeDomain = (row: Partial<AnalysisResult>) => {
    const testItemText = `${row.Test_Item || ''}`.trim();
    const contextText = `${row.Parameter || ''} ${row.testResult || ''}`.trim();
    const docText = `${testItemText} ${contextText} ${row.overview || ''} ${row.productName || ''}`.trim();

    const seed = [testItemText, contextText, row.productName, row.overview].find(
      value => typeof value === 'string' && value.trim()
    );
    if (!seed) return '미분류(시험항목 미기재)';

    const normalized = String(seed)
      .replace(/\s+/g, ' ')
      .replace(/[()[\]{}]/g, ' ')
      .replace(/(?:시험항목|신청기관\s*기준|시험결과|기준값|평가결과|측정값)/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!normalized) return '미분류(시험항목 미기재)';

    const firstChunk = normalized.split(/[.;:|]/)[0].trim();
    const capped = firstChunk.length > 42 ? `${firstChunk.slice(0, 42).trim()}...` : firstChunk;
    if (capped) return `문서기반(${capped})`;

    const docNormalized = docText
      .replace(/\s+/g, ' ')
      .replace(/[()[\]{}]/g, ' ')
      .trim();
    if (!docNormalized) return '미분류(시험항목 미기재)';
    const fallbackChunk = docNormalized.split(/[.;:|]/)[0].trim();
    return fallbackChunk ? `문서기반(${fallbackChunk})` : '미분류(시험항목 미기재)';
  };

  const getStandardMainTechField = (row: Partial<AnalysisResult>) => {
    const testText = `${row.Test_Item || ''}`.toLowerCase();
    const purposeText = `${row.Parameter || ''} ${row.testResult || ''}`.toLowerCase();
    const methodText = `${row.Parameter || ''} ${row.testResult || ''} ${row.overview || ''}`.toLowerCase();
    const deviceText = `${row.productName || ''} ${row.overview || ''} ${row.platform || ''}`.toLowerCase();
    const fullText = `${testText} ${purposeText} ${methodText} ${deviceText} ${row.AI_Domain || ''} ${row.AI_Tech || ''}`.toLowerCase();
    const aiKeywordInTestItem = /(?:^|[^a-z])ai(?:[^a-z]|$)|인공지능|machine learning|머신러닝|deep learning|딥러닝|llm|gpt|transformer|bert|neural|rag|retrieval[-\s]?augmented|검색\s*증강\s*생성|벡터\s*검색|dense\s*retrieval|sparse\s*retrieval|re[-\s]?rank|rerank|bm25|vector\s*db|embedding|stt|asr|tts|ocr|computer\s*vision|자연어|nlp|precision\s*@\s*\d+|recall\s*@\s*\d+|m\s*ap|mean average precision|ndcg\s*@?\s*\d*/.test(testText);

    // 시험항목에 AI 용어가 직접 포함되면 시험항목 기준을 최우선으로 반영
    if (aiKeywordInTestItem) {
      return '인공지능(AI)';
    }

    const rules: Array<{ field: string; test: RegExp; purpose: RegExp; method: RegExp; device: RegExp }> = [
      {
        field: '인공지능(AI)',
        test: /ai|인공지능|machine learning|머신러닝|deep learning|딥러닝|llm|gpt|transformer|bert|rag|retrieval|embedding|stt|asr|tts|ocr|computer\s*vision|nlp|추천|anomaly|예측|classification/,
        purpose: /정확도|정밀도|재현율|f1|precision|recall|auc|wer|cer|iou|m\s*ap|bleu|rouge|추론|학습/,
        method: /confusion matrix|roc|auc|wer|cer|bleu|rouge|inference|training|model|classification|detection|regression|clustering|rag|retrieval|rerank|bm25|vector db|embedding|ndcg|m\s*ap/,
        device: /카메라|마이크|음성|텍스트|이미지|영상|ai|model/
      },
      {
        field: '블록체인',
        test: /blockchain|블록체인|distributed ledger|분산원장|smart contract|토큰|wallet|consensus/,
        purpose: /무결성|추적성|위변조|합의|신뢰성/,
        method: /hash|merkle|smart contract|ledger|consensus|proof of/,
        device: /wallet|node|chain/
      },
      {
        field: '메타버스',
        test: /metaverse|메타버스|가상현실|증강현실|혼합현실|virtual reality|augmented reality|mixed reality|extended reality|digital twin|\bvr\b|\bar\b|\bmr\b|\bxr\b/,
        purpose: /몰입|상호작용|가상환경|공간\s*컴퓨팅|디지털\s*트윈/,
        method: /3d|렌더링|tracking|slam|pose estimation|digital twin|spatial/,
        device: /vr|ar|xr|헤드셋|hmd|글래스/
      },
      {
        field: '사물인터넷(IoT)',
        test: /iot|iiot|사물인터넷|sensor|센서|gateway|mqtt|zigbee|rfid|lora|modbus|opc\s*-?ua/,
        purpose: /연동|수집|원격\s*모니터링|실시간\s*수집/,
        method: /mqtt|coap|zigbee|ble|rfid|lora|opc\s*-?ua|telemetry/,
        device: /센서|게이트웨이|태그|디바이스/
      },
      {
        field: '임베디드 시스템',
        test: /embedded|임베디드|firmware|펌웨어|mcu|rtos|microcontroller|bare\s*metal|haptic|햅틱/,
        purpose: /실시간\s*제어|저전력|펌웨어\s*안정성|장치\s*구동/,
        method: /rtos|interrupt|firmware update|bootloader|driver|latency/,
        device: /mcu|보드|pcb|actuator|device|모듈/
      },
      {
        field: '로봇',
        test: /robot|로봇|robotics|manipulator|agv|amr|slam|path planning|자율\s*주행\s*로봇/,
        purpose: /자율\s*주행|경로\s*추종|제어\s*정밀도|로봇\s*동작/,
        method: /slam|trajectory|path planning|pid|mpc|imu fusion/,
        device: /로봇|매니퓰레이터|액추에이터|모터/
      },
      {
        field: '클라우드',
        test: /cloud|클라우드|saas|paas|iaas|aws|azure|gcp|kubernetes|docker|serverless|microservice/,
        purpose: /가용성|확장성|탄력성|배포|운영\s*자동화/,
        method: /kubernetes|docker|autoscaling|load balancing|ci\/cd|orchestration/,
        device: /server|cluster|container/
      },
      {
        field: '정보보안',
        test: /security|정보보안|cyber|암호|encryption|인증|auth|취약점|침투|malware|ids|ips|siem|xss|sql injection/,
        purpose: /기밀성|무결성|가용성|침입\s*탐지|취약점\s*점검/,
        method: /penetration|vulnerability scan|encryption|signature|anomaly detection|iam/,
        device: /firewall|waf|hsm|key/
      },
      {
        field: '통신',
        test: /telecom|통신|5g|6g|lte|network|네트워크|wireless|무선|유선|throughput|latency|jitter|packet loss/,
        purpose: /지연|손실|처리량|연결\s*안정성|qos/,
        method: /throughput|latency|jitter|packet loss|handover|qos|rf test/,
        device: /modem|base station|router|antenna/
      },
      {
        field: '빅데이터',
        test: /big data|빅데이터|hadoop|spark|data lake|data warehouse|etl|dw|eis|데이터\s*정합|데이터\s*품질|데이터\s*수집|데이터\s*가공|데이터\s*분석/,
        purpose: /대용량|정합성|품질|수집|가공|분석|집계|파이프라인/,
        method: /etl|batch|stream|hadoop|spark|warehouse|lakehouse|data pipeline/,
        device: /data platform|cluster|storage/
      }
    ];

    const scored = rules
      .map(rule => {
        const testHit = rule.test.test(testText);
        const purposeHit = rule.purpose.test(purposeText);
        const methodHit = rule.method.test(methodText);
        const deviceHit = rule.device.test(deviceText);
        const fullHit = (rule.test.test(fullText) || rule.method.test(fullText));

        if (rule.field === '메타버스' && !(testHit || purposeHit || methodHit)) {
          return { field: rule.field, score: -999, hasPrimaryEvidence: false };
        }

        return {
          field: rule.field,
          score:
            (testHit ? 6 : 0) +
            (purposeHit ? 3 : 0) +
            (methodHit ? 3 : 0) +
            (deviceHit ? 1 : 0) +
            (fullHit ? 1 : 0),
          hasPrimaryEvidence: testHit || purposeHit || methodHit
        };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored[0];
    if (top && top.hasPrimaryEvidence && top.score >= 4) {
      return top.field;
    }

    if (/데이터\s*정합|데이터\s*품질|데이터\s*수집|데이터\s*가공|데이터\s*분석|etl|data pipeline|warehouse|lake/.test(fullText)) {
      return '빅데이터';
    }
    if (/kubernetes|docker|cloud|클라우드|autoscaling|saas|paas|iaas/.test(fullText)) {
      return '클라우드';
    }

    return '그외';
  };

  const getAiSignalFlags = (fullText: string) => {
    const rag = /(?:^|[^a-z])rag(?:[^a-z]|$)|retrieval[-\s]?augmented|검색\s*증강\s*생성|벡터\s*검색|dense\s*retrieval|sparse\s*retrieval|re[-\s]?rank|rerank|bm25|vector\s*db/.test(fullText);
    const retrievalMetric = /precision\s*@\s*\d+|recall\s*@\s*\d+|m\s*ap|mean average precision|ndcg\s*@?\s*\d*/.test(fullText);
    const stt = /stt|asr|speech to text|음성\s*인식|음성\s*전사|발화\s*인식|wer|cer/.test(fullText);
    const tts = /tts|text to speech|음성\s*합성|합성\s*음성|vocoder|tacotron|mos/.test(fullText);
    const speech = stt || tts || /voice|speech|audio|음성|오디오|마이크|스피커/.test(fullText);
    const ocr = /ocr|문자\s*인식|광학\s*문자|character error rate|text detection/.test(fullText);
    const vision = ocr || /이미지|영상|camera|vision|객체|검출|분할|segmentation|object detection|iou|m\s*ap/.test(fullText);
    const nlp = /nlp|자연어|텍스트|문서|qa|질의응답|요약|번역|summarization|translation|embedding|token|bleu|rouge/.test(fullText) || rag;
    const recommendation = /추천|랭킹|개인화|recommend|recommender|ndcg|hit\s*rate|ctr|cvr/.test(fullText);
    const anomaly = /이상|결함|고장|사기|anomaly|outlier|fault|fraud|one-class|isolation forest|autoencoder/.test(fullText);
    const forecasting = /시계열|forecast|prediction|예측|수요|추세|arima|lstm|prophet|rmse|mae|mape|time series/.test(fullText);
    const regression = /회귀|regression|연속값|mse|r\^2|linear regression/.test(fullText);
    const clustering = /군집|cluster|clustering|k-means|dbscan|silhouette/.test(fullText);
    const robotics = /로봇|내시경|말단부|회전각|각도|자세|위치|엔코더|encoder|actuator|servo|모터|조향|추종|pid|mpc|imu|gyro|kinematic|trajectory|path planning/.test(fullText);
    const explicitAI = /ai|인공지능|machine learning|머신러닝|deep learning|딥러닝|llm|gpt|neural|모델|학습|추론|inference|classification|clustering|rag|retrieval/.test(fullText);
    const nonAiCompliance = /인장|압축|굽힘|진동|충격|낙하|온도|습도|방수|방진|절연|내전압|전류|전압|전력|소비전력|emc|emi|ems|내구|화학|재질|경도|강도|누설|소음|주파수\s*응답/.test(fullText);
    const anySpecialized = speech || vision || nlp || recommendation || anomaly || forecasting || regression || clustering || robotics || rag || retrievalMetric;

    return {
      explicitAI,
      rag,
      retrievalMetric,
      stt,
      tts,
      speech,
      ocr,
      vision,
      nlp,
      recommendation,
      anomaly,
      forecasting,
      regression,
      clustering,
      robotics,
      nonAiCompliance,
      anySpecialized
    };
  };

  const isAIDomainLabelSupported = (label: string, flags: ReturnType<typeof getAiSignalFlags>) => {
    if (/음성 AI/.test(label)) return flags.speech;
    if (/컴퓨터 비전/.test(label)) return flags.vision;
    if (/자연어 처리/.test(label)) return flags.nlp;
    if (/추천 AI/.test(label)) return flags.recommendation;
    if (/이상탐지 AI/.test(label)) return flags.anomaly;
    if (/예측 AI/.test(label)) return flags.forecasting || flags.regression;
    if (/로보틱스 AI/.test(label)) return flags.robotics;
    return true;
  };

  const isAITechLabelSupported = (label: string, flags: ReturnType<typeof getAiSignalFlags>) => {
    if (/음성 인식\(STT\)/.test(label)) return flags.stt;
    if (/음성 합성\(TTS\)/.test(label)) return flags.tts;
    if (/객체·영상 인식/.test(label)) return flags.vision && !flags.ocr;
    if (/^OCR/.test(label)) return flags.ocr;
    if (/검색·리트리벌 최적화\(RAG\)/.test(label)) return flags.nlp || flags.recommendation || flags.rag || flags.retrievalMetric;
    if (/텍스트 분석|요약·질의응답/.test(label)) return flags.nlp;
    if (/추천 모델/.test(label)) return flags.recommendation;
    if (/이상탐지 모델/.test(label)) return flags.anomaly;
    if (/시계열 예측/.test(label)) return flags.forecasting;
    if (/회귀 예측/.test(label)) return flags.regression || flags.robotics;
    if (/군집화/.test(label)) return flags.clustering;
    if (/제어·자세 추정\(로보틱스\)/.test(label)) return flags.robotics;
    return true;
  };

  const getRepresentativeAIDomain = (row: Partial<AnalysisResult>) => {
    const rawRow = row as Record<string, any>;
    const testText = `${row.Test_Item || ''}`.toLowerCase();
    const purposeText = `${row.Parameter || ''} ${row.testResult || ''}`.toLowerCase();
    const methodHint = pickTextValueLoose(rawRow, [
      'testMethod',
      'Test_Method',
      'TestMethod',
      '시험방법',
      '시험_방법',
      'method',
      'Method',
      'analysisMethod',
      '측정방법',
      '평가방법'
    ]);
    const methodText = `${methodHint || ''} ${row.Parameter || ''} ${row.testResult || ''} ${row.overview || ''}`.toLowerCase();
    const deviceText = `${row.productName || ''} ${row.overview || ''} ${row.platform || ''} ${row.mainTechField || ''}`.toLowerCase();
    const fullText = `${testText} ${purposeText} ${methodText} ${deviceText}`;
    const hasAiKeywordInTestItem = /ai|인공지능|machine learning|머신러닝|deep learning|딥러닝|llm|gpt|transformer|bert|rag|retrieval|검색|re[-\s]?rank|rerank|embedding|vector|bm25|qa|질의응답|stt|asr|tts|ocr|vision|nlp|추천|recommender|anomaly|이상탐지|forecast|prediction|classification|regression|clustering/.test(testText);

    const signalFlags = getAiSignalFlags(fullText);
    const directTestItemDomainRules: Array<{ label: string; pattern: RegExp; context?: RegExp }> = [
      {
        label: '로보틱스 AI(정밀 제어·자세/위치 추정 중심)',
        pattern: /내시경|말단부|회전각|각도|자세|위치|엔코더|encoder|actuator|servo|모터|조향|추종|kinematic|kinematics|로봇|robot/,
        context: /pid|mpc|kalman|imu|gyro|tracking error|angle error|rmse|mae|degree|deg|정밀도|오차/
      },
      {
        label: '음성 AI(음성 인식·합성 중심)',
        pattern: /stt|asr|tts|speech|voice|audio|음성|발화|전사/,
        context: /wer|cer|mos|speech to text|text to speech|ctc|beam search|인식률|오인식/
      },
      {
        label: '컴퓨터 비전(이미지·영상 인식 중심)',
        pattern: /ocr|이미지|영상|객체|검출|분할|vision|camera|object detection|segmentation/,
        context: /iou|m\s*ap|psnr|ssim|confusion matrix|정확도|정밀도|재현율/
      },
      {
        label: '자연어 처리(텍스트 이해·분석 중심)',
        pattern: /rag|retrieval|검색\s*증강\s*생성|벡터\s*검색|rerank|re[-\s]?rank|bm25|llm|gpt|qa|질의응답|자연어|nlp|문서|텍스트|precision\s*@\s*\d+|recall\s*@\s*\d+|m\s*ap|mean average precision|ndcg\s*@?\s*\d*/,
        context: /문서|텍스트|질의|검색|랭킹|top\s*-?k|precision|recall|map|ndcg|embedding|retrieval|rerank|qa/
      },
      {
        label: '추천 AI(개인화 추천·랭킹 중심)',
        pattern: /추천|recommender|recommend|랭킹|개인화|hit\s*rate|ctr|cvr/,
        context: /사용자|개인화|rank|pairwise|top\s*-?k|ndcg/
      },
      {
        label: '이상탐지 AI(비정상 패턴 탐지 중심)',
        pattern: /이상|결함|고장|사기|anomaly|outlier|fault|fraud/,
        context: /roc|auc|one-class|isolation forest|autoencoder|탐지율|오경보|미탐지/
      },
      {
        label: '예측 AI(시계열·수치 예측 중심)',
        pattern: /시계열|forecast|prediction|예측|회귀|regression|수요|추세/,
        context: /mae|rmse|mape|arima|lstm|prophet|r\^2|mse/
      }
    ];
    const directDomainMatches = directTestItemDomainRules.filter(rule => rule.pattern.test(testText));
    if (directDomainMatches.length === 1) {
      if (isAIDomainLabelSupported(directDomainMatches[0].label, signalFlags)) {
        return directDomainMatches[0].label;
      }
    }
    if (directDomainMatches.length > 1) {
      const contextProbe = `${purposeText} ${methodText} ${deviceText}`;
      const bestDirectDomain = directDomainMatches
        .map(rule => ({
          label: rule.label,
          score: (rule.context?.test(contextProbe) ? 2 : 0) + (rule.pattern.test(contextProbe) ? 1 : 0)
        }))
        .sort((a, b) => b.score - a.score)[0];
      if (bestDirectDomain && isAIDomainLabelSupported(bestDirectDomain.label, signalFlags)) {
        return bestDirectDomain.label;
      }
    }

    // 시험항목에 AI 용어가 직접 포함되면 시험항목 기반으로 AI 도메인을 보수적으로라도 고정
    if (hasAiKeywordInTestItem) {
      if (/(rag|retrieval|검색\s*증강\s*생성|벡터\s*검색|re[-\s]?rank|rerank|bm25|qa|질의응답|nlp|자연어|텍스트|문서|precision\s*@\s*\d+|recall\s*@\s*\d+|m\s*ap|mean average precision|ndcg\s*@?\s*\d*)/.test(testText)) {
        return '자연어 처리(텍스트 이해·분석 중심)';
      }
      if (/(stt|asr|tts|speech|voice|audio|음성|발화|전사)/.test(testText)) {
        return '음성 AI(음성 인식·합성 중심)';
      }
      if (/(ocr|이미지|영상|객체|검출|분할|vision|camera|object detection|segmentation)/.test(testText)) {
        return '컴퓨터 비전(이미지·영상 인식 중심)';
      }
      if (/(추천|recommender|recommend|랭킹|개인화|hit\s*rate|ctr|cvr)/.test(testText)) {
        return '추천 AI(개인화 추천·랭킹 중심)';
      }
      if (/(이상|결함|고장|사기|anomaly|outlier|fault|fraud)/.test(testText)) {
        return '이상탐지 AI(비정상 패턴 탐지 중심)';
      }
      if (/(시계열|forecast|prediction|예측|회귀|regression|수요|추세)/.test(testText)) {
        return '예측 AI(시계열·수치 예측 중심)';
      }
      if (/(내시경|말단부|회전각|각도|자세|위치|엔코더|encoder|actuator|servo|모터|조향|추종|kinematic|kinematics|로봇|robot)/.test(testText)) {
        return '로보틱스 AI(정밀 제어·자세/위치 추정 중심)';
      }
      return '일반 AI 응용(시험항목 내 AI 용어 기반 분류)';
    }

    if (signalFlags.nonAiCompliance && !signalFlags.anySpecialized && !signalFlags.explicitAI) {
      return '일반 AI 응용(시험항목 목적·방법 맥락 기반 적용 가능)';
    }
    if (!signalFlags.explicitAI && !signalFlags.anySpecialized) {
      return '일반 AI 응용(시험항목 목적·방법 맥락 기반 적용 가능)';
    }

    const rules: Array<{ label: string; test: RegExp; purpose: RegExp; method: RegExp; device: RegExp }> = [
      {
        label: '로보틱스 AI(정밀 제어·자세/위치 추정 중심)',
        test: /내시경|말단부|회전각|각도|자세|위치|엔코더|encoder|actuator|servo|모터|조향|추종|kinematic|kinematics/,
        purpose: /정확도|정밀도|오차|편차|반복성|추종|안정성|응답시간/,
        method: /pid|mpc|kalman|imu|gyro|encoder|tracking error|angle error|rmse|mae|degree|deg/,
        device: /내시경|로봇|액추에이터|모터|구동|조향|말단/
      },
      {
        label: '컴퓨터 비전(이미지·영상 인식 중심)',
        test: /이미지|영상|객체|검출|분할|segmentation|vision|camera|ocr/,
        purpose: /인식|분류|검출|정확도|오탐|미탐|precision|recall|f1|iou|map/,
        method: /confusion matrix|iou|m\s*ap|psnr|ssim|object detection|segmentation|classification|ocr/,
        device: /camera|vision|image|영상|이미지|센서카메라/
      },
      {
        label: '음성 AI(음성 인식·합성 중심)',
        test: /음성|발화|전사|stt|asr|tts|voice|speech|audio/,
        purpose: /인식률|오인식|전사|명료도|자연성|wer|cer|mos/,
        method: /wer|cer|mos|stt|asr|tts|snr|speech to text|text to speech/,
        device: /마이크|스피커|음성|오디오|voice|audio/
      },
      {
        label: '자연어 처리(텍스트 이해·분석 중심)',
        test: /텍스트|문서|요약|번역|질의응답|자연어|nlp|qa/,
        purpose: /의미|분류|요약|번역|응답|정확도|f1|exact match|bleu|rouge/,
        method: /bleu|rouge|exact match|perplexity|token|embedding|qa|summarization|translation/,
        device: /문서|텍스트|챗봇|chat|language/
      },
      {
        label: '추천 AI(개인화 추천·랭킹 중심)',
        test: /추천|랭킹|개인화|recommender|recommend/,
        purpose: /추천정확도|적중률|전환율|클릭률|ctr|hit rate|ndcg/,
        method: /ndcg|hit\s*rate|top\s*-?k|ctr|cvr|ranking|pairwise/,
        device: /쇼핑|콘텐츠|사용자|개인화/
      },
      {
        label: '이상탐지 AI(비정상 패턴 탐지 중심)',
        test: /이상|결함|고장|사기|anomaly|fault|fraud|outlier/,
        purpose: /탐지율|오경보|미탐지|재현율|precision|recall|f1|auc/,
        method: /anomaly score|one-class|isolation forest|autoencoder|z-score|roc|auc|outlier/,
        device: /설비|로그|트랜잭션|품질/
      },
      {
        label: '예측 AI(시계열·수치 예측 중심)',
        test: /예측|수요|추세|시계열|forecast|prediction/,
        purpose: /예측오차|정확도|오차율|rmse|mae|mape|r\^2/,
        method: /rmse|mae|mape|arima|lstm|prophet|time series|regression/,
        device: /센서|수요|트래픽|에너지|시계열/
      },
      {
        label: '로보틱스 AI(자율 제어·동작 최적화)',
        test: /로봇|제어|주행|경로|slam|agv|amr|manipulator/,
        purpose: /안정성|정밀도|추종|오차|제어성능|응답시간/,
        method: /pid|mpc|slam|trajectory|path planning|imu fusion/,
        device: /로봇|액추에이터|모터|매니퓰레이터/
      }
    ];

    const scoredRules = rules
      .map(rule => {
        const testHit = rule.test.test(testText);
        const purposeHit = rule.purpose.test(purposeText);
        const methodHit = rule.method.test(methodText);
        const deviceHit = rule.device.test(deviceText);
        const fullHit = rule.method.test(fullText);

        return {
          label: rule.label,
          hasPrimaryEvidence: testHit || methodHit || deviceHit,
          score:
            (testHit ? 6 : 0) +
            (purposeHit ? 3 : 0) +
            (methodHit ? 4 : 0) +
            (deviceHit ? 2 : 0) +
            (fullHit ? 1 : 0)
        };
      })
      .sort((a, b) => b.score - a.score);

    const top = scoredRules[0];
    const second = scoredRules[1];
    const margin = top ? top.score - (second?.score || 0) : 0;
    if (
      top &&
      top.score >= 5 &&
      margin >= 2 &&
      top.hasPrimaryEvidence &&
      isAIDomainLabelSupported(top.label, signalFlags)
    ) {
      return top.label;
    }

    if (signalFlags.robotics) return '로보틱스 AI(정밀 제어·자세/위치 추정 중심)';
    if (signalFlags.speech) return '음성 AI(음성 인식·합성 중심)';
    if (signalFlags.vision) return '컴퓨터 비전(이미지·영상 인식 중심)';
    if (signalFlags.nlp) return '자연어 처리(텍스트 이해·분석 중심)';
    if (signalFlags.recommendation) return '추천 AI(개인화 추천·랭킹 중심)';
    if (signalFlags.anomaly) return '이상탐지 AI(비정상 패턴 탐지 중심)';
    if (signalFlags.forecasting || signalFlags.regression) return '예측 AI(시계열·수치 예측 중심)';
    if (signalFlags.clustering) return '일반 AI 응용(유사 데이터 군집화 중심)';
    if (!signalFlags.explicitAI && signalFlags.nonAiCompliance) {
      return '일반 AI 응용(시험항목 목적·방법 맥락 기반 적용 가능)';
    }

    return '일반 AI 응용(시험항목 목적·방법 맥락 기반 적용 가능)';
  };

  const getRepresentativeAITech = (row: Partial<AnalysisResult>) => {
    const rawRow = row as Record<string, any>;
    const testText = `${row.Test_Item || ''}`.toLowerCase();
    const purposeText = `${row.Parameter || ''} ${row.testResult || ''}`.toLowerCase();
    const methodHint = pickTextValueLoose(rawRow, [
      'testMethod',
      'Test_Method',
      'TestMethod',
      '시험방법',
      '시험_방법',
      'method',
      'Method',
      'analysisMethod',
      '측정방법',
      '평가방법'
    ]);
    const methodText = `${methodHint || ''} ${row.Parameter || ''} ${row.testResult || ''} ${row.overview || ''}`.toLowerCase();
    const deviceText = `${row.productName || ''} ${row.overview || ''} ${row.platform || ''} ${row.mainTechField || ''}`.toLowerCase();
    const fullText = `${testText} ${purposeText} ${methodText} ${deviceText}`;
    const hasAiKeywordInTestItem = /ai|인공지능|machine learning|머신러닝|deep learning|딥러닝|llm|gpt|transformer|bert|rag|retrieval|검색|re[-\s]?rank|rerank|embedding|vector|bm25|qa|질의응답|stt|asr|tts|ocr|vision|nlp|추천|recommender|anomaly|이상탐지|forecast|prediction|classification|regression|clustering/.test(testText);

    // 시험항목에 AI 기술명이 직접 포함된 경우, 시험항목 기준을 최우선으로 적용
    const directTestItemRules: Array<{ label: string; pattern: RegExp; context?: RegExp }> = [
      { label: '음성 인식(STT)(음성을 텍스트로 변환)', pattern: /(?:^|[\s/,_-])(stt|asr)(?:$|[\s/,_-])|음성\s*인식|음성\s*전사|speech\s*to\s*text/, context: /wer|cer|ctc|beam search|인식률|전사|오인식|마이크|음성|오디오/ },
      { label: '음성 합성(TTS)(텍스트를 음성으로 변환)', pattern: /(?:^|[\s/,_-])tts(?:$|[\s/,_-])|음성\s*합성|text\s*to\s*speech/, context: /mos|vocoder|tacotron|자연성|명료도|발화품질|스피커|음성|오디오/ },
      { label: 'OCR(문자 인식)(이미지 문자를 텍스트로 추출)', pattern: /(?:^|[\s/,_-])ocr(?:$|[\s/,_-])|문자\s*인식|광학\s*문자/, context: /cer|wer|character error rate|text detection|이미지|문서|스캔/ },
      { label: '검색·리트리벌 최적화(RAG)(문서 검색·랭킹 성능 최적화)', pattern: /(?:^|[\s/,_-])rag(?:$|[\s/,_-])|retrieval|검색\s*증강\s*생성|벡터\s*검색|re[-\s]?rank|rerank|bm25|precision\s*@\s*\d+|recall\s*@\s*\d+|m\s*ap|mean average precision|ndcg\s*@?\s*\d*/, context: /rag|retrieval|검색|질의|문서|임베딩|벡터|bm25|rerank|top\s*-?k|precision|recall|map|ndcg/ },
      { label: '객체·영상 인식(CV)(대상 탐지·분류)', pattern: /컴퓨터\s*비전|computer\s*vision|객체|영상|이미지|검출|분류|segmentation|detection/, context: /iou|m\s*ap|confusion matrix|precision|recall|f1|camera|비전/ },
      { label: '텍스트 분석(NLP)(문서·문장 의미 분석)', pattern: /(?:^|[\s/,_-])nlp(?:$|[\s/,_-])|자연어|텍스트\s*분석|문서\s*분석|텍스트\s*분류/, context: /embedding|token|f1|precision|recall|의미\s*분석/ },
      { label: '요약·질의응답(NLP)(핵심 내용 추출·응답)', pattern: /요약|질의응답|qa|question answering|summarization|번역|translation/, context: /bleu|rouge|exact match|응답\s*정확도|요약\s*품질/ },
      { label: '추천 모델(개인화 랭킹)(사용자 맞춤 추천)', pattern: /추천|recommender|recommend|랭킹|개인화/, context: /ndcg|hit\s*rate|ctr|cvr|top\s*-?k|ranking/ },
      { label: '이상탐지 모델(비정상 패턴 탐지)', pattern: /이상\s*탐지|anomaly|outlier|결함|고장|사기|fraud|fault/, context: /roc|auc|one-class|isolation forest|autoencoder|탐지율|오경보|미탐지/ },
      { label: '시계열 예측(추세·수치 예측)', pattern: /시계열|forecast|prediction|예측|수요|추세/, context: /arima|lstm|prophet|mae|rmse|mape|time series/ },
      { label: '회귀 예측(연속값 추정)', pattern: /회귀|regression|연속값/, context: /mse|mae|r\^2|linear regression|rmse/ },
      { label: '군집화(유사 데이터 그룹화)', pattern: /군집|cluster|clustering|세그먼트/, context: /k-means|dbscan|hierarchical clustering|silhouette|분리도|유사도/ },
      { label: '제어·자세 추정(로보틱스)(회전각/위치 정확도 분석)', pattern: /내시경|말단부|회전각|각도|자세|위치|엔코더|encoder|kinematic|robot|로봇|제어/, context: /pid|mpc|imu|gyro|tracking error|angle error|정밀도|오차|응답시간/ }
    ];

    const directMatches = directTestItemRules.filter(rule => rule.pattern.test(testText));
    if (directMatches.length === 1) {
      return directMatches[0].label;
    }
    if (directMatches.length > 1) {
      const contextProbe = `${purposeText} ${methodText} ${deviceText}`;
      const bestDirect = directMatches
        .map(rule => ({
          label: rule.label,
          score: (rule.context?.test(contextProbe) ? 2 : 0) + (rule.pattern.test(contextProbe) ? 1 : 0)
        }))
        .sort((a, b) => b.score - a.score)[0];
      if (bestDirect) return bestDirect.label;
    }

    const signalFlags = getAiSignalFlags(fullText);
    if (hasAiKeywordInTestItem && !signalFlags.anySpecialized) {
      return '일반 AI 기법(시험항목 내 AI 용어 기반 분류)';
    }
    if (signalFlags.nonAiCompliance && !signalFlags.anySpecialized && !signalFlags.explicitAI) {
      return '일반 AI 기법(시험항목 목적·방법 맥락 기반 적용 가능)';
    }
    if (!signalFlags.explicitAI && !signalFlags.anySpecialized) {
      return '일반 AI 기법(시험항목 목적·방법 맥락 기반 적용 가능)';
    }

    const rules: Array<{ label: string; test: RegExp; purpose: RegExp; method: RegExp; device: RegExp }> = [
      {
        label: '제어·자세 추정(로보틱스)(회전각/위치 정확도 분석)',
        test: /내시경|말단부|회전각|각도|자세|위치|엔코더|encoder|actuator|servo|모터|조향|추종|kinematic|kinematics/,
        purpose: /정확도|정밀도|오차|편차|반복성|추종|안정성|응답시간/,
        method: /pid|mpc|kalman|imu|gyro|encoder|tracking error|angle error|rmse|mae|degree|deg/,
        device: /내시경|로봇|액추에이터|모터|구동|조향|말단/
      },
      {
        label: '음성 인식(STT)(음성을 텍스트로 변환)',
        test: /stt|asr|음성\s*인식|음성\s*전사|발화\s*인식/,
        purpose: /전사|인식률|오인식|wer|cer/,
        method: /wer|cer|asr|ctc|beam search|speech to text/,
        device: /마이크|음성|오디오|voice/
      },
      {
        label: '음성 합성(TTS)(텍스트를 음성으로 변환)',
        test: /tts|음성\s*합성|합성\s*음성|text\s*to\s*speech/,
        purpose: /자연성|명료도|mos|발화품질/,
        method: /mos|mel|vocoder|tacotron|text to speech/,
        device: /스피커|음성|오디오/
      },
      {
        label: '객체·영상 인식(CV)(대상 탐지·분류)',
        test: /객체|영상|이미지|검출|분류|vision|detection|segmentation/,
        purpose: /정확도|재현율|정밀도|f1|iou|map/,
        method: /iou|m\s*ap|confusion matrix|object detection|segmentation|classification/,
        device: /camera|이미지|영상|비전/
      },
      {
        label: 'OCR(문자 인식)(이미지 문자를 텍스트로 추출)',
        test: /ocr|문자\s*인식|광학\s*문자/,
        purpose: /인식률|오인식|정확도|cer/,
        method: /ocr|cer|wer|character error rate|text detection/,
        device: /이미지|문서|스캔/
      },
      {
        label: '텍스트 분석(NLP)(문서·문장 의미 분석)',
        test: /nlp|자연어|텍스트|문서\s*분석|분류/,
        purpose: /분류정확도|f1|정밀도|재현율|의미\s*분석/,
        method: /f1|precision|recall|embedding|token|classification/,
        device: /문서|텍스트|챗봇/
      },
      {
        label: '요약·질의응답(NLP)(핵심 내용 추출·응답)',
        test: /요약|질의응답|qa|question answering|summarization|번역/,
        purpose: /요약품질|응답정확도|bleu|rouge|exact match/,
        method: /bleu|rouge|exact match|qa|summarization|translation/,
        device: /문서|텍스트|대화/
      },
      {
        label: '추천 모델(개인화 랭킹)(사용자 맞춤 추천)',
        test: /추천|랭킹|개인화|recommend|recommender/,
        purpose: /클릭률|전환율|적중률|ctr|ndcg|hit rate/,
        method: /ndcg|hit\s*rate|top\s*-?k|ctr|ranking|collaborative filtering/,
        device: /사용자|콘텐츠|상품/
      },
      {
        label: '이상탐지 모델(비정상 패턴 탐지)',
        test: /이상|결함|고장|사기|anomaly|outlier|fault|fraud/,
        purpose: /탐지율|오경보|미탐지|auc|f1|재현율/,
        method: /roc|auc|one-class|isolation forest|autoencoder|outlier detection/,
        device: /설비|로그|품질|거래/
      },
      {
        label: '시계열 예측(추세·수치 예측)',
        test: /시계열|예측|수요|추세|forecast|prediction/,
        purpose: /예측오차|mae|rmse|mape|정확도/,
        method: /mae|rmse|mape|arima|lstm|prophet|time series/,
        device: /센서|트래픽|수요|에너지/
      },
      {
        label: '회귀 예측(연속값 추정)',
        test: /회귀|regression|연속값|각도|회전각|위치|자세/,
        purpose: /오차|mse|mae|r\^2|정확도|정밀도/,
        method: /regression|mse|mae|r\^2|linear regression|rmse|angle error/,
        device: /수치|연속값|엔코더|imu|gyro/
      },
      {
        label: '군집화(유사 데이터 그룹화)',
        test: /군집|cluster|clustering|세그먼트/,
        purpose: /군집품질|분리도|유사도/,
        method: /k-means|dbscan|hierarchical clustering|silhouette/,
        device: /고객|데이터|패턴/
      }
    ];

    const scoredRules = rules
      .map(rule => {
        const testHit = rule.test.test(testText);
        const purposeHit = rule.purpose.test(purposeText);
        const methodHit = rule.method.test(methodText);
        const deviceHit = rule.device.test(deviceText);
        const fullHit = rule.method.test(fullText);

        return {
          label: rule.label,
          hasPrimaryEvidence: testHit || methodHit || deviceHit,
          score:
            (testHit ? 6 : 0) +
            (purposeHit ? 3 : 0) +
            (methodHit ? 4 : 0) +
            (deviceHit ? 2 : 0) +
            (fullHit ? 1 : 0)
        };
      })
      .sort((a, b) => b.score - a.score);

    const top = scoredRules[0];
    const second = scoredRules[1];
    const margin = top ? top.score - (second?.score || 0) : 0;
    if (
      top &&
      top.score >= 5 &&
      margin >= 2 &&
      top.hasPrimaryEvidence &&
      isAITechLabelSupported(top.label, signalFlags)
    ) {
      return top.label;
    }

    if (signalFlags.robotics) return '제어·자세 추정(로보틱스)(회전각/위치 정확도 분석)';
    if (signalFlags.stt) return '음성 인식(STT)(음성을 텍스트로 변환)';
    if (signalFlags.tts) return '음성 합성(TTS)(텍스트를 음성으로 변환)';
    if (signalFlags.ocr) return 'OCR(문자 인식)(이미지 문자를 텍스트로 추출)';
    if (signalFlags.vision) return '객체·영상 인식(CV)(대상 탐지·분류)';
    if (signalFlags.nlp) return '텍스트 분석(NLP)(문서·문장 의미 분석)';
    if (signalFlags.recommendation) return '추천 모델(개인화 랭킹)(사용자 맞춤 추천)';
    if (signalFlags.anomaly) return '이상탐지 모델(비정상 패턴 탐지)';
    if (signalFlags.forecasting) return '시계열 예측(추세·수치 예측)';
    if (signalFlags.regression) return '회귀 예측(연속값 추정)';
    if (signalFlags.clustering) return '군집화(유사 데이터 그룹화)';
    if (!signalFlags.explicitAI && signalFlags.nonAiCompliance) {
      return '일반 AI 기법(시험항목 목적·방법 맥락 기반 적용 가능)';
    }

    return '일반 AI 기법(시험항목 목적·방법 맥락 기반 적용 가능)';
  };

  const getPlatform = (row: Partial<AnalysisResult>) => {
    const rawRow = row as Record<string, any>;
    const testText = `${row.Test_Item || ''}`.toLowerCase();
    const purposeText = `${row.Parameter || ''} ${row.testResult || ''}`.toLowerCase();
    const methodHint = pickTextValueLoose(rawRow, [
      'testMethod',
      'Test_Method',
      'TestMethod',
      '시험방법',
      '시험_방법',
      'method',
      'Method',
      'analysisMethod',
      '측정방법',
      '평가방법'
    ]);
    const methodText = `${methodHint || ''} ${row.Parameter || ''} ${row.testResult || ''} ${row.overview || ''}`.toLowerCase();
    const deviceText = `${row.productName || ''} ${row.overview || ''}`.toLowerCase();
    const hintText = `${row.platform || ''}`.toLowerCase();
    const fullText = `${testText} ${purposeText} ${methodText} ${deviceText} ${hintText}`.trim();

    const rules: Array<{ platform: '웹(Web)' | '데스크톱' | '모바일(Mobile)' | '서버(Server)' | '앱(APP)' | '클라우드' | '임베디드(Embedded)' | 'IoT' | '성능 및 보안 특화'; test: RegExp; purpose: RegExp; method: RegExp; device: RegExp }> = [
      {
        platform: '웹(Web)',
        test: /web|웹|website|웹사이트|portal|포털|dashboard|대시보드|browser|브라우저/,
        purpose: /웹\s*기반|브라우저|대시보드|운영\s*화면|관리자\s*화면/,
        method: /http|https|rest|graphql|frontend|spa|csr|ssr/,
        device: /browser|브라우저|웹/
      },
      {
        platform: '데스크톱',
        test: /desktop|pc|윈도우|windows|mac|linux|데스크톱/,
        purpose: /로컬\s*실행|오프라인\s*운영|작업용\s*클라이언트/,
        method: /exe|installer|native client|electron|windows app/,
        device: /pc|desktop|workstation/
      },
      {
        platform: '모바일(Mobile)',
        test: /mobile|모바일|android|ios|스마트폰|태블릿|wearable|웨어러블/,
        purpose: /현장\s*사용|휴대\s*사용|이동\s*환경|모바일\s*연동/,
        method: /android|ios|apk|ipa|app store|play store|push/,
        device: /스마트폰|태블릿|wearable|handheld/
      },
      {
        platform: '서버(Server)',
        test: /server|서버|backend|백엔드|api|db|database|was|middleware/,
        purpose: /서버\s*처리|중앙\s*처리|트랜잭션|백엔드\s*연산/,
        method: /rest api|grpc|sql|nosql|queue|microservice|batch job/,
        device: /server|db|cluster/
      },
      {
        platform: '앱(APP)',
        test: /application|애플리케이션|app|앱|client|클라이언트|native app/,
        purpose: /업무\s*앱|사용자\s*앱|앱\s*기반\s*서비스/,
        method: /native app|app sdk|client app|installer|application/,
        device: /app|클라이언트/
      },
      {
        platform: '클라우드',
        test: /cloud|클라우드|saas|paas|iaas|aws|azure|gcp|kubernetes|docker/,
        purpose: /가용성|확장성|탄력성|클라우드\s*운영|멀티테넌시/,
        method: /kubernetes|docker|autoscaling|load balancing|serverless|ci\/cd/,
        device: /cloud|container|cluster/
      },
      {
        platform: '임베디드(Embedded)',
        test: /embedded|임베디드|firmware|펌웨어|mcu|rtos|microcontroller|haptic|햅틱/,
        purpose: /실시간\s*제어|저전력|펌웨어\s*안정성|장치\s*구동/,
        method: /rtos|interrupt|firmware update|bootloader|driver|latency/,
        device: /mcu|보드|pcb|actuator|장치|단말|device/
      },
      {
        platform: 'IoT',
        test: /iot|iiot|사물인터넷|sensor|센서|gateway|게이트웨이|mqtt|zigbee|rfid|lora|modbus|opc\s*-?ua/,
        purpose: /원격\s*모니터링|실시간\s*수집|센서\s*연동|현장\s*데이터/,
        method: /mqtt|coap|zigbee|ble|rfid|lora|opc\s*-?ua|telemetry/,
        device: /sensor|gateway|tag|iot/
      },
      {
        platform: '성능 및 보안 특화',
        test: /성능|보안|취약점|침투|암호|인증|latency|throughput|jitter|packet loss|qos|stress|부하/,
        purpose: /성능\s*검증|보안\s*검증|취약점\s*점검|침입\s*탐지|부하\s*시험/,
        method: /penetration|vulnerability scan|load test|stress test|qos test|encryption|auth|ids|ips/,
        device: /firewall|waf|hsm|router|network/
      }
    ];

    const scored = rules
      .map(rule => {
        const testHit = rule.test.test(testText);
        const purposeHit = rule.purpose.test(purposeText);
        const methodHit = rule.method.test(methodText);
        const deviceHit = rule.device.test(deviceText);
        const fullHit = rule.test.test(fullText) || rule.method.test(fullText);
        return {
          platform: rule.platform,
          score:
            (testHit ? 6 : 0) +
            (purposeHit ? 4 : 0) +
            (methodHit ? 4 : 0) +
            (deviceHit ? 2 : 0) +
            (fullHit ? 1 : 0),
          hasPrimaryEvidence: testHit || purposeHit || methodHit
        };
      })
      .sort((a, b) => b.score - a.score);

    if (scored[0] && scored[0].score >= 4 && scored[0].hasPrimaryEvidence) {
      return scored[0].platform;
    }

    // 해당 카테고리 근거가 약하면 문서 문맥 기반으로 가장 가까운 플랫폼을 추천
    if (/성능|보안|취약점|침투|암호|인증|latency|throughput|jitter|packet loss|stress|부하|qos/.test(fullText)) return '성능 및 보안 특화';
    if (/iot|sensor|gateway|mqtt|zigbee|lora|rfid|telemetry|opc\s*-?ua/.test(fullText)) return 'IoT';
    if (/embedded|임베디드|firmware|mcu|rtos|actuator|device|햅틱|haptic/.test(fullText)) return '임베디드(Embedded)';
    if (/cloud|클라우드|kubernetes|docker|saas|paas|iaas|aws|azure|gcp/.test(fullText)) return '클라우드';
    if (/server|서버|backend|api|db|database|middleware|microservice/.test(fullText)) return '서버(Server)';
    if (/web|웹|browser|브라우저|portal|dashboard|http|https/.test(fullText)) return '웹(Web)';
    if (/desktop|pc|windows|mac|linux|데스크톱|workstation/.test(fullText)) return '데스크톱';
    if (/mobile|모바일|android|ios|스마트폰|태블릿|wearable/.test(fullText)) return '모바일(Mobile)';
    if (/app|앱|application|애플리케이션|client|클라이언트/.test(fullText)) return '앱(APP)';
    if (scored[0]) return scored[0].platform;

    return '앱(APP)';
  };

  const getOtherPlatformDetail = (row: Partial<AnalysisResult>) => {
    const mergedText = `${row.productName || ''} ${row.Test_Item || ''} ${row.overview || ''} ${row.Parameter || ''}`.toLowerCase();

    if (/windows|윈도우|desktop|pc|mac|linux/.test(mergedText)) return '데스크톱/PC';
    if (/server|서버|backend|백엔드|api/.test(mergedText)) return '서버/API';
    if (/edge|게이트웨이|gateway|on-prem|온프레미스/.test(mergedText)) return '엣지/온프레미스';
    if (/kiosk|키오스크|단말|device/.test(mergedText)) return '전용 단말';
    if (/haptic|햅틱|센서|sensor|actuator|bandwidth|지연|latency|측정/.test(mergedText)) return '전용 단말';

    const seedText = [row.Test_Item, row.productName, row.overview].find(value => typeof value === 'string' && value.trim());
    if (!seedText) return '세부플랫폼 미기재';

    const normalized = String(seedText)
      .replace(/\s+/g, ' ')
      .replace(/[()[\]{}]/g, ' ')
      .trim();

    if (!normalized) return '세부플랫폼 미기재';

    const firstChunk = normalized.split(/[.,;:/]/)[0].trim();
    const capped = firstChunk.length > 24 ? `${firstChunk.slice(0, 24).trim()}...` : firstChunk;
    return capped || '세부플랫폼 미기재';
  };

  const normalizePlatformValue = (value: unknown, row: Partial<AnalysisResult>) => {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return getPlatform(row);

    if (/^(웹\(web\)|web|웹)$/iu.test(text)) return '웹(Web)';
    if (/^(데스크톱|desktop|desktop\/pc|pc)$/iu.test(text)) return '데스크톱';
    if (/^(모바일\(mobile\)|mobile|모바일)$/iu.test(text)) return '모바일(Mobile)';
    if (/^(서버\(server\)|server|서버|server\/api|서버\/api)$/iu.test(text)) return '서버(Server)';
    if (/^(앱\(app\)|app|앱)$/iu.test(text)) return '앱(APP)';
    if (/^(클라우드|cloud)$/iu.test(text)) return '클라우드';
    if (/^(임베디드\(embedded\)|embedded|임베디드|전용\s*단말)$/iu.test(text)) return '임베디드(Embedded)';
    if (/^(iot)$/iu.test(text)) return 'IoT';
    if (/^(성능\s*및\s*보안\s*특화|성능\s*특화|보안\s*특화)$/u.test(text)) return '성능 및 보안 특화';

    const otherWithDetailMatch = text.match(/^(?:기\s*타|그\s*외)(?:\s*[:\-]\s*|\s*\(\s*)([^)]+)\)?$/u);
    if (otherWithDetailMatch?.[1]?.trim()) {
      return getPlatform({ ...row, platform: otherWithDetailMatch[1].trim() });
    }

    if (/^(?:기\s*타|그\s*외|미분류|unknown|n\/a|-)$/iu.test(text)) return getPlatform(row);

    return getPlatform({ ...row, platform: text.replace(/\s+/g, ' ').trim() });
  };

const normalizeRepresentativeDomainValue = (value: unknown, row: Partial<AnalysisResult>) => {
  const text = typeof value === 'string' ? value.trim() : '';
  const fallback = stripRepresentativeDomainDetail(getRepresentativeDomain(row));

  if (!text) return fallback;

  if (/^(일반|기타|미분류|unknown|n\/a|-)$/iu.test(text)) {
    return fallback;
  }

  return stripRepresentativeDomainDetail(text);
};

  function getReportType(reportNo: string) {
    const hasC = reportNo.includes('C');
    const hasK = reportNo.includes('K');
    const hasAI = reportNo.includes('AI');
    const hasB = reportNo.includes('B');

    if (hasK) return 'KOLAS 시험성적서';
    if (hasAI && hasB) return 'KOLAS 시험성적서';
    if (hasC && hasAI) return '일반 AI 성적서';
    if (hasC && !hasAI) return '일반 성적서';
    return '';
  }

  const resolveReportTypeByLegacyRule = (reportNo: string, fallback?: string) => {
    const byReportNo = getReportType(reportNo || '');
    if (byReportNo) return byReportNo;
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalizedFallback;
  };

  const pickTextValue = (row: Record<string, unknown> | Partial<AnalysisResult>, keys: string[]) => {
    const source = row as Record<string, unknown>;
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) continue;
      const text = typeof value === 'string' ? value.trim() : String(value).trim();
      if (text) return text;
    }
    return '';
  };

  const pickTextValueLoose = (row: Record<string, unknown> | Partial<AnalysisResult>, keys: string[]) => {
    const source = row as Record<string, unknown>;
    const direct = pickTextValue(row, keys);
    if (direct) return direct;

    // 한글/영문/숫자를 모두 보존해 키 비교(예: "접수번호", "접수 번호", "receipt_number")
    const normalizeKey = (key: string) =>
      key
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');
    const normalizedTargets = new Set(keys.map(normalizeKey));

    for (const [key, value] of Object.entries(source)) {
      if (!normalizedTargets.has(normalizeKey(key))) continue;
      if (value === null || value === undefined) continue;
      const text = typeof value === 'string' ? value.trim() : String(value).trim();
      if (text) return text;
    }

    return '';
  };

  const splitMultiField = (value: unknown) => {
    const text = typeof value === 'string' ? value.replace(/\r/g, '\n').trim() : '';
    if (!text) return [];

    // 줄바꿈 우선 분리
    if (/\n/.test(text)) {
      const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean);
      if (lines.length > 1) return lines;
    }

    // 불릿 목록 형태(예: ○ 항목, - 항목, ? 항목)
    if (/[○●■□▶▷?·]/.test(text)) {
      const bullets = text
        .split(/[○●■□▶▷?·]\s*/g)
        .map(v => v.trim())
        .filter(Boolean);
      if (bullets.length > 1) return bullets;
    }

    // 번호 목록 형태(예: 1) ..., 2) ... / 1. ..., 2. ...)
    const numbered = text.match(/(?:^|\s)\d+[.)]\s+/g);
    if (numbered && numbered.length >= 2) {
      return text
        .split(/(?=(?:^|\s)\d+[.)]\s+)/)
        .map(v => v.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean);
    }

    // 세미콜론/파이프 구분
    if (/[;|]/.test(text)) {
      const chunks = text.split(/[;|]/).map(v => v.trim()).filter(Boolean);
      if (chunks.length > 1) return chunks;
    }

    // 쉼표는 시험기준/결과 본문 내 값으로 자주 사용되므로 분할 기준에서 제외
    if (/\s\/\s/.test(text)) {
      const chunks = text.split(/\s\/\s/).map(v => v.trim()).filter(Boolean);
      const isShortList = chunks.length > 1 && chunks.every(v => v.length <= 40);
      if (isShortList) return chunks;
    }

    return [text];
  };

  const splitTestItemField = (value: unknown) => {
    const text = typeof value === 'string' ? value.replace(/\r/g, '\n').trim() : '';
    if (!text) return [];

    // 시험항목명은 콤마를 포함할 수 있으므로 콤마 기준 분리를 금지
    if (/\n/.test(text)) {
      const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean);
      if (lines.length > 1) return lines;
    }

    if (/[○●■□▶▷?·]/.test(text)) {
      const bullets = text
        .split(/[○●■□▶▷?·]\s*/g)
        .map(v => v.trim())
        .filter(Boolean);
      if (bullets.length > 1) return bullets;
    }

    const numbered = text.match(/(?:^|\s)\d+[.)]\s+/g);
    if (numbered && numbered.length >= 2) {
      return text
        .split(/(?=(?:^|\s)\d+[.)]\s+)/)
        .map(v => v.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean);
    }

    if (/[;|]/.test(text)) {
      const chunks = text.split(/[;|]/).map(v => v.trim()).filter(Boolean);
      if (chunks.length > 1) return chunks;
    }

    return [text];
  };

  const splitParameterField = (value: unknown) => {
    const text = typeof value === 'string' ? value.replace(/\r/g, '\n').trim() : '';
    if (!text) return [];

    // 신청기관 기준은 콤마를 포함할 수 있으므로 콤마 기준 분리를 금지
    if (/\n/.test(text)) {
      const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean);
      if (lines.length > 1) return lines;
    }

    if (/[○●■□▶▷?·]/.test(text)) {
      const bullets = text
        .split(/[○●■□▶▷?·]\s*/g)
        .map(v => v.trim())
        .filter(Boolean);
      if (bullets.length > 1) return bullets;
    }

    const numbered = text.match(/(?:^|\s)\d+[.)]\s+/g);
    if (numbered && numbered.length >= 2) {
      return text
        .split(/(?=(?:^|\s)\d+[.)]\s+)/)
        .map(v => v.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean);
    }

    if (/[;|]/.test(text)) {
      const chunks = text.split(/[;|]/).map(v => v.trim()).filter(Boolean);
      if (chunks.length > 1) return chunks;
    }

    if (/\s\/\s/.test(text)) {
      const chunks = text.split(/\s\/\s/).map(v => v.trim()).filter(Boolean);
      const isShortList = chunks.length > 1 && chunks.every(v => v.length <= 40);
      if (isShortList) return chunks;
    }

    return [text];
  };

  const splitTestResultField = (value: unknown) => {
    const text = typeof value === 'string' ? value.replace(/\r/g, '\n').trim() : '';
    if (!text) return [];

    // 줄바꿈 우선 분리
    if (/\n/.test(text)) {
      const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean);
      if (lines.length > 1) return lines;
    }

    // 불릿 목록 형태
    if (/[○●■□▶▷?·]/.test(text)) {
      const bullets = text
        .split(/[○●■□▶▷?·]\s*/g)
        .map(v => v.trim())
        .filter(Boolean);
      if (bullets.length > 1) return bullets;
    }

    // 번호 목록 형태(예: 1) ..., 2) ... / 1. ..., 2. ...)
    const numbered = text.match(/(?:^|\s)\d+[.)]\s+/g);
    if (numbered && numbered.length >= 2) {
      return text
        .split(/(?=(?:^|\s)\d+[.)]\s+)/)
        .map(v => v.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean);
    }

    // 세미콜론/파이프 구분만 허용 (쉼표는 측정값 나열 오탐이 많아 제외)
    if (/[;|]/.test(text)) {
      const chunks = text.split(/[;|]/).map(v => v.trim()).filter(Boolean);
      if (chunks.length > 1) return chunks;
    }

    return [text];
  };

  const inferTestItemFromTestResult = (value: unknown) => {
    const text = typeof value === 'string' ? value.replace(/\r/g, '\n').trim() : '';
    if (!text) return '';

    const firstLine = text
      .split(/\n+/)
      .map(v => v.trim())
      .find(Boolean) || '';
    if (!firstLine) return '';

    const explicitLabelMatch = firstLine.match(/^(?:시험항목|항목|test\s*item)\s*[:：\-]\s*(.+)$/i);
    if (explicitLabelMatch?.[1]) {
      const labeledCandidate = explicitLabelMatch[1].trim();
      if (labeledCandidate && labeledCandidate.length <= 80) return labeledCandidate;
    }

    // 구분자(:;|)가 있을 때만 좌측을 시험항목명 후보로 사용
    if (!/[:;|]/.test(firstLine)) return '';

    const candidate = firstLine.split(/[:;|]/)[0]?.trim() || '';
    if (!candidate) return '';
    if (candidate.length > 80) return '';
    if (/^(?:적합|부적합|합격|불합격|pass|fail)$/i.test(candidate)) return '';
    if (/(?:시험결과|결과|측정값|판정|기준값|기준)/i.test(candidate)) return '';
    return candidate;
  };

  const expandRowsByTestItem = (rows: AnalysisResult[]) => {
    const getAlignedValue = (values: string[], idx: number, fallback?: string) => {
      if (!values.length) return fallback;
      if (values.length === 1) return values[0];
      return values[Math.min(idx, values.length - 1)] || fallback;
    };

    return rows.flatMap(row => {
      const testItems = splitTestItemField(row.Test_Item);
      const params = splitParameterField(row.Parameter);
      const standards = splitMultiField(row.testStandard);
      const testResults = splitTestResultField(row.testResult);
      const inferredTestItemsFromResults = testResults
        .map(result => inferTestItemFromTestResult(result))
        .filter(Boolean);
      const distinctInferredTestItemCount = new Set(inferredTestItemsFromResults).size;
      const shouldSplitByResults =
        testResults.length > 1 &&
        (testItems.length === testResults.length || distinctInferredTestItemCount > 1);

      // 같은 시험항목 내 기준/결과 다중값으로 인한 과분할을 막기 위해
      // 시험항목 자체가 다수로 식별될 때만 분할합니다.
      const splitCount = testItems.length > 1
        ? testItems.length
        : shouldSplitByResults
          ? testResults.length
          : 1;

      if (splitCount <= 1) return [row];

      return Array.from({ length: splitCount }, (_, idx) => {
        const alignedTestResult = getAlignedValue(testResults, idx, row.testResult);
        const fallbackTestItem = getAlignedValue(testItems, idx, row.Test_Item);
        const inferredTestItem = inferTestItemFromTestResult(alignedTestResult);
        const normalizeForCompare = (value?: string) =>
          String(value || '')
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^\p{L}\p{N}]/gu, '');
        const alignedTestItem =
          testItems.length === splitCount
            ? fallbackTestItem
            : (inferredTestItem || fallbackTestItem);
        const normalizedItem = normalizeForCompare(alignedTestItem);
        const normalizedResult = normalizeForCompare(alignedTestResult);
        const finalTestItem =
          normalizedItem && normalizedResult && normalizedItem === normalizedResult
            ? fallbackTestItem
            : alignedTestItem;

        return {
          ...row,
          Test_Item: finalTestItem,
          Parameter: getAlignedValue(params, idx, row.Parameter),
          testStandard: getAlignedValue(standards, idx, row.testStandard),
          testResult: alignedTestResult
        };
      });
    });
  };

  const isAiLikeRow = (row: Partial<AnalysisResult> & Record<string, any>) => {
    const probe = [
      row.gubun_code,
      row.Report_No,
      row.AI_Domain,
      row.AI_Tech,
      row.mainTechField,
      row.Test_Item,
      row.Parameter,
      row.testResult,
      row.productName,
      row.overview
    ]
      .map(value => (typeof value === 'string' ? value : String(value || '')))
      .join(' ')
      .toLowerCase();

    return /(ai|인공지능|머신러닝|딥러닝|neural|llm|gpt|vision|nlp|stt|asr|tts|ocr|classification|추천|anomaly|예측|prediction)/.test(probe);
  };

  const normalizeMetricEqForSave = (row: AnalysisResult): AnalysisResult => {
    const rawRow = row as Record<string, any>;
    const aiLike = isAiLikeRow(rawRow as Partial<AnalysisResult> & Record<string, any>);
    const metrics = pickTextValueLoose(rawRow, ['Metrics', 'metrics', 'METRICS', 'metric']) || (aiLike ? '정확도, F1 점수 등 AI 성능 지표' : '해당없음');
    const eq = pickTextValueLoose(rawRow, ['EQ', 'eq', 'Eq', 'equation', 'Equation']) || (aiLike ? 'AI 산식 또는 모델 정보' : '해당없음');

    return {
      ...row,
      Metrics: metrics,
      EQ: eq
    };
  };

  const buildLegacyAnalysisPrompt = (contentText: string) => {
    const prompt = `아래는 시험성적서의 텍스트입니다.\n${contentText || ''}\n이 시험성적서를 분석하여 다음 지침에 따라 JSON 배열을 반환하세요:\n**추출 및 분류 지침:**\n1. **Report_No (보고서 번호)**: 문서에서 찾은 성적서번호를 그대로 입력. 없으면 파일명 사용.\n2. **기본 정보 (원문 그대로 추출)**\n - company_name (기관명): 문서에 명시된 기관/회사명\n - productName (제품명): 시험대상 제품명\n - overview (제품의 개요): 제품에 대한 설명 및 개요\n - created_at (발급일): 문서에 명시된 발급일\n3. **시험항목 정보 (문서 내 시험 결과 요약 기반)**\n - Test_Item (시험항목): 시험 항목명\n - Parameter (신청기관 기준): 시험 기준값, 규격, 한계값\n - testResult (시험결과): 문서 내 시험 결과 요약을 기반으로 작성\n4. **도메인 분류 (시험항목별 대표 도메인)**\n - representativeDomain (대표 도메인): 시험항목의 특성으로부터 해당 산업분야 도출\n5. **기술 분류**\n - mainTechField (주요기술 분야): 다음 중 선택 인공지능(AI), 블록체인, 메타버스, 사물인터넷(IoT), 임베디드 시스템, 로봇, 클라우드, 정보보안, 통신, 빅데이터, 그외 (그외 선택 시 "그외(세부기술 분야)" 형식으로 작성)\n - AI_Domain (도메인AI추천): 이 시험항목을 대표적으로 사용하는 AI 도메인 (괄호로 설명 추가)\n - AI_Tech (적용기술AI추천): 이 시험항목을 대표적으로 사용하는 AI 기술 (괄호로 설명 추가)\n**JSON 배열 형식:**\n[\n {\n \"Report_No\": \"\",\n \"created_at\": \"\",\n \"company_name\": \"\",\n \"representativeDomain\": \"\",\n \"mainTechField\": \"\",\n \"productName\": \"\",\n \"overview\": \"\",\n \"Test_Item\": \"\",\n \"Parameter\": \"\",\n \"testResult\": \"\",\n \"AI_Domain\": \"\",\n \"AI_Tech\": \"\"\n }\n]\n**작성 규칙:**\n- company_name, productName, overview, Test_Item, Parameter, testResult는 문서의 원문을 그대로 추출하세요.\n- overview는 반드시 제품의 개요(제품 설명)만 작성하고, 시험항목/기준/결과 문구는 넣지 마세요.\n- 반드시 시험항목 1개당 JSON 객체 1개로 분리하세요. 여러 시험항목을 한 객체에 합치지 마세요.\n- 절대 번역, 요약, 의역하지 마세요.\n- representativeDomain, mainTechField는 시험항목 내용을 분석하여 적절한 값으로 채우세요.\n- mainTechField가 그외인 경우 반드시 "그외(세부기술 분야)" 형식으로 작성하세요.\n- AI_Domain과 AI_Tech는 시험항목에서 실제 사용된 기술을 대중적으로 직관적인 명칭으로 작성하고, 괄호 안에는 핵심 설명을 짧게 요약하세요.\n- 빈 필드가 없도록 모든 항목을 채우세요.\n- 설명 문장 없이 JSON 데이터만 반환하세요.`;
    const reportTypeDirectionRules = `- AI 성적서 방향: AI 모델/알고리즘/추론 성능 중심으로 분석하고, 시험항목 근거로 AI_Domain/AI_Tech를 구체적으로 작성하세요.\n- 일반 성적서 방향: 제품 성능/규격 적합성 중심으로 분석하고, 문서 근거가 약하면 AI 용어를 과도하게 확장하지 마세요.\n- AI/일반 구분은 Report_No, gubun_code, 시험항목 키워드를 함께 참고해 판단하세요.\n- 혼합 케이스 주의: AI 성적서에도 일반 시험항목이 있을 수 있고, 일반 성적서에도 AI 시험항목이 있을 수 있으므로 시험항목 단위로 개별 판단하세요.\n- AI_Domain/AI_Tech는 시험항목(Test_Item), 시험항목 목적(Parameter/testResult), 시험방법(method) 맥락을 함께 반영해 항목별로 결정하세요.\n- AI_Domain/AI_Tech는 시험항목에 사용된 기술을 대중적으로 이해하기 쉬운 명칭으로 작성하고, 괄호 안에는 핵심 설명을 짧게 요약하세요.`;
    const mainTechGuardRules = `- 주요기술 분야는 반드시 다음 목록에서만 선택하세요: 인공지능(AI), 블록체인, 메타버스, 사물인터넷(IoT), 임베디드 시스템, 로봇, 클라우드, 정보보안, 통신, 빅데이터, 그외.\n- 분류는 시험항목(Test_Item)과 신청기관 기준/시험결과(Parameter/testResult)의 명시 근거를 최우선으로 판단하고, 제품명/대상장치/개요는 보조 근거로만 사용하세요.\n- 특정 분야를 암시하는 명확한 근거가 없으면 과도하게 단정하지 말고 그외로 분류하세요.\n- 약어/부분 문자열 오탐을 방지하세요. 약어가 일반 단어 일부로 포함된 경우 해당 기술분야 근거로 사용하지 마세요.\n- 상충 근거가 있을 때는 시험항목 직접 근거가 있는 분야를 우선하고, 동점이면 더 보수적인 분류(그외 포함)를 선택하세요.\n- 데이터 수집/정합성/품질/가공/분석/저장/처리 중심 시험항목은 데이터 처리 성격을 우선 반영해 빅데이터 또는 클라우드로 판단하고, 다른 분야의 직접 근거가 있을 때만 해당 분야를 선택하세요.`;
    const conservativeClassificationRules = `- 분류 우선순위: 시험항목(Test_Item) > 신청기관 기준/시험결과(Parameter/testResult) > 시험방법(method) > 제품/대상장치(productName/overview/platform).\n- 시험항목 직접 근거가 없으면 과도한 특정 기술분야로 단정하지 말고 그외로 보수적으로 분류하세요.\n- AI_Domain/AI_Tech는 시험방법/목적 직접 근거가 없으면 과도한 특정 기술로 단정하지 마세요.\n- 이상탐지는 anomaly/fraud/결함탐지 등 명시 근거가 있을 때만 선택하세요.`;
    const testItemSplitRules = `- 시험항목(Test_Item)은 시험 결과 요약(testResult) 각 항목의 시험항목명을 기준으로 작성하고 1:1로 대응시키세요.\n- 신청기관 기준(Parameter), 시험표준(testStandard), 시험결과(testResult)는 반드시 시험 결과 요약 표의 동일 행에서 추출하세요.\n- 시험 결과 요약 표 외 문장(개요/기타 본문)으로 Parameter/testStandard/testResult를 추정·보완하지 마세요.\n- 시험항목 행 분리는 시험 결과 요약(testResult) 항목 단위를 우선 기준으로 하세요.\n- 시험항목 구분 시 쉼표(,)는 구분자로 사용하지 마세요.\n- 하나의 시험항목에 기준/결과가 콤마로 복수 표기되어도 하나의 항목으로 유지하세요.\n- 여러 시험항목을 한 줄에 적어야 할 경우 줄바꿈(\\n), 세미콜론(;), 불릿(○/●)만 구분자로 사용하세요.`;
    const orgPlatformPriorityRules = `- 시험항목 분석 필드(representativeDomain, platform, mainTechField, AI_Domain, AI_Tech)는 시험항목(Test_Item)과 시험기록(Parameter/testResult/시험방법) 근거를 최우선으로 판단하세요.\n- 기관 정보 요약 표시 시에는 기관명(company_name)·제품명(productName)·개요(overview)를 우선 참고하고, 플랫폼/도메인이 불명확할 때만 시험기록을 보조로 참고하세요.`;
    const antiHallucinationRules = `- 오독 및 Hallucination 방지: 문서에 없는 단어/수치/단위를 임의로 생성하지 마세요.\n- 숫자, 기호, 단위(%, dB, ms, V, A 등)는 원문 표기를 그대로 유지하세요.\n- 판독이 애매한 텍스트는 임의 추정하지 말고 주변 문맥을 재확인해 근거가 있는 값만 작성하세요.`;

    return `${prompt}\n${reportTypeDirectionRules}\n${mainTechGuardRules}\n${conservativeClassificationRules}\n${testItemSplitRules}\n${orgPlatformPriorityRules}\n${antiHallucinationRules}`
      .replace(/\n{2,}/g, '\n')
      .replace(/ {2,}/g, ' ');
  };

  const buildDocumentExtractionPrompt = (sourceText: string, fileName: string) => `아래는 시험성적서 원문입니다.
파일명: ${fileName}

${sourceText}

위 문서에서 다음 필드만 추출해서 JSON 배열로 반환하세요.
- Report_No: 문서 내 성적서번호를 그대로 작성. 없으면 파일명 사용
- receiptNumber: 문서 내 접수번호
- practitioner: 문서 내 작성자
- company_name: 기관명 또는 회사명
- gubun_code: 문서에 명시된 보고서 종류 문구
- created_at: 발급 일자
- testApplicationDate: 시험신청일(신청일자)
- testPeriod: 시험기간(시험일자)
- productName: 제품명
- overview: 제품의 개요(제품 설명)
- Test_Item: 시험항목(문서 내 시험 결과 요약 기준)
- Parameter: 신청기관 기준(문서 내 시험 결과 요약 기준)
- testStandard: 시험표준(시험방법/시험규격)
- testResult: 시험결과(문서 내 시험 결과 요약 기준)
- platform: 시험항목별 플랫폼
- mainTechField: 주요기술 분야
- qualityCharacteristic: 시험항목별 품질특성(부특성 기준)
- qualityCharacteristic_ect: 시험항목별 품질특성(부특성 기준) 기타
- AI_Domain: 도메인(AI)추천
- AI_Tech: 적용기술(AI)추천

규칙:
- company_name, productName, overview는 문서에서 찾아 원문 그대로 작성하세요.
- overview는 제품 개요만 작성하고 시험항목/기준/결과를 넣지 마세요.
- Test_Item, Parameter, testResult는 문서 내 시험 결과 요약 표를 기반으로 작성하세요.
- Test_Item은 testResult 각 항목의 시험항목명을 기준으로 작성하고, testResult와 1:1 대응되게 맞추세요.
- testResult, platform, mainTechField, qualityCharacteristic, AI_Domain, AI_Tech, testStandard는 반드시 시험항목별로 1:1 대응되게 작성하세요.
- Parameter, testStandard, testResult는 반드시 시험 결과 요약 표의 동일 행에서 함께 추출하세요.
- 시험 결과 요약 표 외 문장(개요/기타 본문/시험기록 서술문)으로 Parameter/testStandard/testResult를 추정·보완하지 마세요.
- 문서의 "5. 시험기록" 섹션에 시험항목별 내용이 있으면 이를 최우선 근거로 사용해 위 7개 필드를 분석하세요.
- 시험항목 구분 시 쉼표(,)는 구분자로 사용하지 마세요.
- 하나의 시험항목에 신청기관 기준/시험결과가 콤마로 복수 표기되어도 하나의 항목으로 유지하세요.
- 여러 시험항목을 한 줄에 적어야 할 경우 줄바꿈(\n), 세미콜론(;), 불릿(○/●)만 구분자로 사용하세요.
- testStandard는 문서에 있는 시험표준/시험방법/시험규격을 원문 그대로 작성하세요.
- platform은 시험항목별 시험기록(시험방법/시험대상/적용환경) 근거로 판단해 작성하세요.
- mainTechField는 시험항목별 시험기록(시험방법/측정대상/판정근거)에서 확인되는 기술 성격으로 분류하세요.
- qualityCharacteristic는 시험항목별 품질특성(부특성 기준)을 원문 그대로 작성하세요.
- qualityCharacteristic_ect는 qualityCharacteristic가 기타/그외일 때만 세부 내용을 작성하고, 아니면 빈 문자열로 두세요.
- AI_Domain, AI_Tech는 반드시 해당 시험항목의 시험기록 근거로만 작성하고, 근거가 약하면 과도하게 특정 기술로 단정하지 마세요.
- 시험항목 행을 나눌 때는 시험 결과 요약(testResult) 항목 단위를 우선 기준으로 맞추세요.
- 기관명/제품명/개요에 포함된 도메인·플랫폼 단서 키워드는 누락/치환 없이 원문 그대로 보존하세요.
- 플랫폼이 기관/제품 정보만으로 확정되지 않을 수 있으므로 시험항목·기준·결과·시험방법 단서도 정확히 추출하세요.
- testResult에서는 "적합", "부적합" 문구를 제외하고 측정값/판정 근거 중심으로 작성하세요.
- Report_No와 receiptNumber는 매 페이지 상단 표기를 우선 참고해 추출하세요.
- receiptNumber는 문서에 있는 값을 그대로 작성하고, 없으면 빈 문자열로 두세요.
- practitioner는 문서에 있는 작성자 이름을 그대로 작성하고, 없으면 빈 문자열로 두세요.
- created_at은 문서에 명시된 발급일만 사용하세요. 문서 근거가 없으면 빈 문자열로 두고 오늘 날짜를 임의로 넣지 마세요.
- 번역, 요약, 의역하지 마세요.
- AI/일반 구분 단서는 Report_No, gubun_code, 시험항목 키워드를 원문 그대로 보존하세요.
- AI 성적서 가능성이 보이면 모델명/지표명/AI 관련 용어를 오탈자 없이 정확히 추출하세요.
- 일반 성적서는 성능/규격/적합성 중심 용어를 정확히 추출하세요.
- 오독 및 Hallucination 방지: 문서에 없는 단어/수치/단위를 임의로 생성하지 마세요.
- 숫자, 기호, 단위(%, dB, ms, V, A 등)는 원문 표기를 그대로 유지하세요.
- 판독이 애매한 텍스트는 임의 추정하지 말고 주변 문맥을 재확인해 근거가 있는 값만 작성하세요.
- 시험항목이 여러 개면 배열의 각 원소로 분리하세요.
- 설명 문장 없이 JSON 배열만 반환하세요.`
    .replace(/\n{2,}/g, '\n')
    .replace(/ {2,}/g, ' ');

  const extractWordSourceText = async (inputFile: File) => {
    const arrayBuffer = await inputFile.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const bodyText = (result.value || '').trim();
    const headerText = await extractWordHeaderText(arrayBuffer);
    const text = [
      headerText ? `[문서 머리말]\n${headerText}` : '',
      bodyText ? `[문서 본문]\n${bodyText}` : ''
    ]
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!text || text.trim().length === 0) {
      throw new Error('Word 파일에서 텍스트를 추출할 수 없습니다.');
    }

    return text.trim();
  };

  const extractPdfSourceText = async (inputFile: File) => {
    const arrayBuffer = await inputFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    const pageTopSections: string[] = [];
    let topReportNo = '';
    let topReceiptNo = '';

    const extractTopBandText = (items: any[]) => {
      const positioned = items
        .map(item => {
          if (!('str' in item)) return null;
          const raw = typeof item.str === 'string' ? item.str : '';
          const text = raw.replace(/\s+/g, ' ').trim();
          if (!text) return null;
          const transform = Array.isArray(item.transform) ? item.transform : [];
          const x = Number(transform[4] ?? 0);
          const y = Number(transform[5] ?? 0);
          return { text, x, y };
        })
        .filter((entry): entry is { text: string; x: number; y: number } => !!entry);

      if (positioned.length === 0) return '';
      const maxY = Math.max(...positioned.map(entry => entry.y));
      const topBandThreshold = maxY - 80;
      const topItems = positioned
        .filter(entry => entry.y >= topBandThreshold)
        .sort((a, b) => (b.y - a.y) || (a.x - b.x));

      if (topItems.length === 0) return '';

      let output = '';
      let prevY: number | null = null;
      for (const item of topItems) {
        if (prevY !== null && Math.abs(prevY - item.y) > 2.5) {
          output += '\n';
        } else if (output && !output.endsWith('\n')) {
          output += ' ';
        }
        output += item.text;
        prevY = item.y;
      }

      return output
        .split(/\r?\n/)
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
    };

    const extractRightValueByLabel = (items: any[], labelPattern: RegExp) => {
      const positioned = items
        .map(item => {
          if (!('str' in item)) return null;
          const raw = typeof item.str === 'string' ? item.str : '';
          const text = raw.replace(/\s+/g, ' ').trim();
          if (!text) return null;
          const transform = Array.isArray(item.transform) ? item.transform : [];
          const x = Number(transform[4] ?? 0);
          const y = Number(transform[5] ?? 0);
          const normalized = text.replace(/([가-힣])\s+(?=[가-힣])/g, '$1');
          return { text, normalized, x, y };
        })
        .filter((entry): entry is { text: string; normalized: string; x: number; y: number } => !!entry);

      if (positioned.length === 0) return '';
      const labelItem = positioned.find(item => labelPattern.test(item.normalized));
      if (!labelItem) return '';

      const stripByNextLabel = (value: string) => value
        .split(/(?=(?:성적서(?:번호)?|보고서(?:번호)?|접수(?:번호)?|의뢰번호|신청번호|작성자|담당자|실무자|기관명|회사명|제품명|시험항목|발급일))/i)[0]
        .trim();
      const cleanCandidate = (value: string) => sanitizeIdentifierValue(
        stripByNextLabel(
          value
            .replace(/^[\s:：=\-]+/, '')
            .replace(/\s+/g, ' ')
            .trim()
        )
      );

      const sameRow = positioned
        .filter(item => Math.abs(item.y - labelItem.y) <= 3.5)
        .sort((a, b) => a.x - b.x);
      const rowJoined = sameRow.map(item => item.normalized).join(' ');
      const removedLabel = rowJoined.replace(/^.*?(성적서\s*번호|보고서\s*번호|report\s*(?:no\.?|number)|certificate\s*(?:no\.?|number)|접\s*수\s*번\s*호|receipt\s*(?:no\.?|number)|registration\s*(?:no\.?|number)|의뢰번호|신청번호)/i, '');
      const fromJoined = cleanCandidate(removedLabel);
      if (fromJoined) return fromJoined;

      const rightSameRow = sameRow
        .filter(item => item.x > labelItem.x + 1)
        .map(item => item.normalized)
        .join(' ');
      const fromRightSameRow = cleanCandidate(rightSameRow);
      if (fromRightSameRow) return fromRightSameRow;

      const belowRows = positioned
        .filter(item => item.y < labelItem.y && (labelItem.y - item.y) <= 14 && item.x > labelItem.x - 1)
        .sort((a, b) => (b.y - a.y) || (a.x - b.x))
        .map(item => item.normalized)
        .join(' ');
      return cleanCandidate(belowRows);
    };

    const readPageText = async (pageNumber: number) => {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const fullText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      const topText = extractTopBandText(textContent.items as any[]);
      const headerReportNo = extractRightValueByLabel(
        textContent.items as any[],
        /(성적서\s*번호|보고서\s*번호|report\s*(?:no\.?|number)|certificate\s*(?:no\.?|number))/i
      );
      const headerReceiptNo = extractRightValueByLabel(
        textContent.items as any[],
        /(접\s*수\s*번\s*호|receipt\s*(?:no\.?|number)|registration\s*(?:no\.?|number)|의뢰번호|신청번호)/i
      );
      return { pageNumber, fullText, topText, headerReportNo, headerReceiptNo };
    };

    // PDF 페이지를 소량 병렬 처리해 추출 시간을 단축합니다.
    const PARALLEL_PAGE_BATCH = 4;
    for (let start = 1; start <= pdf.numPages; start += PARALLEL_PAGE_BATCH) {
      const end = Math.min(start + PARALLEL_PAGE_BATCH - 1, pdf.numPages);
      const pageNumbers = Array.from({ length: end - start + 1 }, (_, index) => start + index);
      const batchTexts = await Promise.all(pageNumbers.map(readPageText));
      batchTexts.forEach(({ pageNumber, fullText, topText, headerReportNo, headerReceiptNo }) => {
        if (!topReportNo && headerReportNo) topReportNo = headerReportNo;
        if (!topReceiptNo && headerReceiptNo) topReceiptNo = headerReceiptNo;
        if (topText) {
          pageTopSections.push(`[페이지 ${pageNumber} 상단]\n${topText}`);
        }
        if (fullText) {
          pages.push(`[페이지 ${pageNumber}]\n${fullText}`);
        }
      });
    }

    const extractedText = [
      (topReportNo || topReceiptNo)
        ? `[페이지 상단 직접추출]\n${topReportNo ? `성적서번호: ${topReportNo}\n` : ''}${topReceiptNo ? `접수번호: ${topReceiptNo}` : ''}`.trim()
        : '',
      pageTopSections.length > 0 ? `[페이지 상단 요약]\n${pageTopSections.join('\n')}` : '',
      `[페이지 전체 본문]\n${pages.join('\n')}`
    ]
      .filter(Boolean)
      .join('\n');
    if (!extractedText.trim()) {
      throw new Error('PDF 파일에서 텍스트를 추출할 수 없습니다.');
    }

    return extractedText.trim();
  };

  const extractSourceText = async (inputFile: File) => {
    const fileKey = `${inputFile.name}:${inputFile.size}:${inputFile.lastModified}:${inputFile.type}`;
    const cached = sourceTextCacheRef.current.get(fileKey);
    if (cached) return cached;

    const extracted = inputFile.type === 'application/pdf'
      ? await extractPdfSourceText(inputFile)
      : await extractWordSourceText(inputFile);
    sourceTextCacheRef.current.set(fileKey, extracted);
    return extracted;
  };

  const buildAnalysisPrompt = async () => {
    if (!file) {
      throw new Error('분석할 파일이 없습니다.');
    }

    let contentText = '';
    if (file.type === 'application/pdf') {
      contentText = `다음은 시험성적서 PDF 문서입니다. 파일명: ${file.name}`;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      if (!text || text.trim().length === 0) {
        throw new Error('Word 파일에서 텍스트를 추출할 수 없습니다.');
      }

      contentText = `다음은 시험성적서 문서의 텍스트 내용입니다:\n\n${text}`;
    }

    const apiBase = getApiUrl();
    const openaiProxyUrl = `${apiBase}/openai-analyze`;
    const legacyProxyUrl = `${apiBase}/gemini-analyze`;
    const match = file.name.match(/^(.*)\.[^.]+$/);
    const fileName = match ? match[1] : file.name;

    const prompt = `아래는 시험성적서의 텍스트입니다.\n${contentText || ''}\n이 시험성적서를 분석하여 다음 지침에 따라 JSON 배열을 반환하세요:\n**추출 및 분류 지침:**\n1. **Report_No (보고서 번호)**: 문서에서 찾은 성적서번호를 그대로 입력. 없으면 파일명 사용.\n2. **기본 정보 (원문 그대로 추출)**\n - company_name (기관명): 문서에 명시된 기관/회사명\n - productName (제품명): 시험대상 제품명\n - overview (제품의 개요): 제품에 대한 설명 및 개요\n - created_at (발급일): 문서에 명시된 발급일\n3. **시험항목 정보 (문서 내 시험 결과 요약 기반)**\n - Test_Item (시험항목): 시험 항목명 (예: 인장강도, 내습성, 안전성)\n - Parameter (신청기관 기준): 시험 기준값, 규격, 한계값\n - testResult (시험결과): 문서 내 시험 결과 요약을 기반으로 작성 (측정값, 평가결과 포함)\n4. **도메인 분류 (시험항목별 대표 도메인)**\n - representativeDomain (대표 도메인): 시험항목의 특성으로부터 해당 산업분야 도출 (예: 전자, 화학, 기계, 의료, 식품, 모빌리티)\n5. **기술 분류**\n - mainTechField (주요기술 분야): 다음 중 선택 인공지능(AI), 블록체인, 메타버스, 사물인터넷(IoT), 임베디드 시스템, 로봇, 클라우드, 정보보안, 통신, 빅데이터, 그외 (그외 선택 시 "그외(세부기술 분야)" 형식으로 작성)\n - AI_Domain (도메인AI추천): 이 시험항목을 대표적으로 사용하는 AI 도메인 (괄호로 설명 추가) 예: \"컴퓨터 비전(이미지 인식 및 분석)\", \"자연어 처리(텍스트 분석)\"\n - AI_Tech (적용기술AI추천): 이 시험항목을 대표적으로 사용하는 AI 기술 (괄호로 설명 추가) 예: \"이상탐지(정상 데이터와의 편차 감지)\", \"시계열 예측(시간별 추세 분석)\"\n**JSON 배열 형식:**\n[\n {\n "Report_No": "",\n "created_at": "",\n "company_name": "",\n "representativeDomain": "",\n "mainTechField": "",\n "productName": "",\n "overview": "",\n "Test_Item": "",\n "Parameter": "",\n "testResult": "",\n "AI_Domain": "",\n "AI_Tech": ""\n }\n]\n**작성 규칙:**\n- company_name, productName, overview, Test_Item, Parameter, testResult는 문서의 원문을 그대로 추출하세요.\n- 절대 번역, 요약, 의역하지 마세요.\n- representativeDomain, mainTechField는 시험항목 내용을 분석하여 적절한 값으로 채우세요.\n- mainTechField가 그외인 경우 반드시 "그외(세부기술 분야)" 형식으로 작성하세요.\n- AI_Domain과 AI_Tech는 시험항목에서 실제 사용된 기술을 대중적으로 직관적인 명칭으로 작성하고, 괄호 안에는 핵심 설명을 짧게 요약하세요.\n- 빈 필드가 없도록 모든 항목을 채우세요.\n- 설명 문장 없이 JSON 데이터만 반환하세요.`;

    const enhancedPrompt = prompt.replace(
      '- 설명 문장 없이 JSON 데이터만 반환하세요.',
      '- 설명 문장 없이 JSON 데이터만 반환하세요.\n\n**추가 주의사항:**\n- Report_No는 문서의 성적서번호를 우선적으로 사용하세요.\n- Test_Item은 시험 결과 요약(testResult) 항목명을 기준으로 작성하고 testResult와 1:1 대응되게 맞추세요.\n- 시험항목 구분 시 쉼표(,)는 구분자로 사용하지 마세요.\n- 여러 시험항목을 한 줄에 적어야 할 경우 줄바꿈(\\n), 세미콜론(;), 불릿(○/●)만 구분자로 사용하세요.\n- AI_Domain과 AI_Tech는 대중적으로 이해하기 쉬운 명칭으로 쓰고, 괄호 안에 핵심 설명을 짧게 넣어야 합니다.\n- 모든 필드를 채우되, 빈 칸이 없도록 하세요.'
    );

    // 모달에 노출되는 프롬프트 정규화 (줄바꿈 2개 이상 → 1개, 공백 2개 이상 → 1개)
    const normalizedPrompt = enhancedPrompt
      .replace(/\n{2,}/g, '\n')  // 2개 이상의 줄바꿈을 1개로
      .replace(/ {2,}/g, ' ');   // 2개 이상의 공백을 1개로

    return { enhancedPrompt: normalizedPrompt, openaiProxyUrl, legacyProxyUrl, fileName };
  };

  const buildPreparedAnalysisRequest = async () => {
    if (!file) {
      throw new Error('분석할 파일이 없습니다.');
    }

    const apiBase = getApiUrl();
    const openaiProxyUrl = `${apiBase}/openai-analyze`;
    const legacyProxyUrl = `${apiBase}/gemini-analyze`;
    const reportAnalyzeProxyUrl = `${apiBase}/openai-analyze-report`;
    const match = file.name.match(/^(.*)\.[^.]+$/);
    const fileName = match ? match[1] : file.name;

    if (file.type === 'application/pdf') {
      const contentText = `다음은 시험성적서 PDF 문서입니다. 파일명: ${file.name}`;
      return {
        mode: 'legacy' as const,
        prompt: buildLegacyAnalysisPrompt(contentText),
        openaiProxyUrl,
        legacyProxyUrl,
        fileName
      };
    }

    const sourceText = await extractWordSourceText(file);
    return {
      mode: 'report-agent' as const,
      prompt: buildDocumentExtractionPrompt(sourceText, fileName),
      reportAnalyzeProxyUrl,
      fileName,
      sourceText,
      fileType: file.type
    };
  };

  const prepareAgentAnalysisRequest = async () => {
    if (!file) {
      throw new Error('분석할 파일이 없습니다.');
    }

    const apiBase = getApiUrl();
    const reportAnalyzeProxyUrl = `${apiBase}/openai-analyze-report`;
    const match = file.name.match(/^(.*)\.[^.]+$/);
    const fileName = match ? match[1] : file.name;
    const sourceText = await extractSourceText(file);

    return {
      mode: 'report-agent' as const,
      prompt: buildDocumentExtractionPrompt(sourceText, fileName),
      reportAnalyzeProxyUrl,
      fileName,
      sourceText,
      fileType: file.type
    };
  };

  const analyzeReport = async () => {
    if (!file) return;

    setPreparingPrompt(true);
    setError(null);

    try {
      const preparedRequest = await prepareAgentAnalysisRequest();
      const promptToUse = (preparedRequest.prompt || '').trim();
      if (!promptToUse) {
        throw new Error('분석 프롬프트를 생성하지 못했습니다.');
      }
      setPromptDraft(promptToUse);
      setPreparingPrompt(false);
      await executePreparedAnalysis(preparedRequest, promptToUse);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '프롬프트 준비 중 오류가 발생했습니다.');
      setPreparingPrompt(false);
    }
  };

  const executePreparedAnalysis = async (
    preparedRequest: Awaited<ReturnType<typeof prepareAgentAnalysisRequest>>,
    promptOverride: string
  ) => {
    setLoading(true);
    setError(null);
    setIsPromptModalOpen(false);

    try {
      let response = await fetchWithTimeout(preparedRequest.reportAnalyzeProxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: preparedRequest.fileName,
            fileType: preparedRequest.fileType,
            sourceText: preparedRequest.sourceText,
            promptOverride,
            analysisMode: quickAnalysisMode ? 'fast' : 'full',
            skipRecommendations: quickAnalysisMode
          })
        });

      if (response.status === 404) {
        const openaiFallbackUrl = `${getApiUrl()}/openai-analyze`;
        response = await fetchWithTimeout(openaiFallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: promptOverride })
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI 프록시 호출 실패: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const rawData = await response.text();
      let data: any = {};
      try {
        data = rawData ? JSON.parse(rawData) : {};
      } catch {
        const preview = (rawData || '').slice(0, 140).replace(/\s+/g, ' ');
        throw new Error(`AI 응답이 JSON 형식이 아닙니다. (URL: ${response.url || preparedRequest.reportAnalyzeProxyUrl}) 응답 미리보기: ${preview}`);
      }
      if (data.recommendationError) {
        console.warn('Recommendation agent fallback was used:', data.recommendationError);
      }

      let textResponse = Array.isArray(data.results)
        ? JSON.stringify(data.results)
        : data.generated_text || data.candidates?.[0]?.content || data.text || JSON.stringify(data);

      if (!textResponse) {
        throw new Error('분석 결과를 가져오지 못했습니다.');
      }

      if (typeof textResponse !== 'string') {
        textResponse = JSON.stringify(textResponse);
      }

      const jsonMatch = textResponse.match(/\[.*\]/s);
      const jsonString = jsonMatch ? jsonMatch[0] : textResponse;
      const parsedResult = JSON.parse(jsonString);

      if (!Array.isArray(parsedResult)) {
        throw new Error(`AI 응답이 배열 형식이 아닙니다.\n원본 응답: ${textResponse}`);
      }

      const reportNoFromResult = parsedResult.reduce((acc: string, row: unknown) => {
        if (acc) return acc;
        if (!row || typeof row !== 'object') return acc;
        const candidate = sanitizeIdentifierValue(pickTextValueLoose(row as Record<string, any>, [
          'Report_No',
          'reportNo',
          'report_no',
          'reportNumber',
          'report_number',
          'certificateNo',
          'certificateNumber',
          '성적서번호',
          '성적서 번호',
          '보고서번호',
          '보고서 번호'
        ]));
        return candidate || acc;
      }, '');
      const reportNoFromSource = sanitizeIdentifierValue(extractReportNumberFromSourceText(preparedRequest.sourceText || ''));
      const resolvedReportNo = reportNoFromResult || reportNoFromSource || sanitizeIdentifierValue(preparedRequest.fileName) || preparedRequest.fileName;

      const receiptNumberFromResult = parsedResult.reduce((acc: string, row: unknown) => {
        if (acc) return acc;
        if (!row || typeof row !== 'object') return acc;
        const candidate = sanitizeIdentifierValue(pickTextValueLoose(row as Record<string, any>, [
          'receiptNumber',
          'receipt_number',
          'receiptNo',
          'receipt_no',
          'registrationNo',
          'registrationNumber',
          'registration_no',
          'registration_number',
          'requestNo',
          'requestNumber',
          'request_no',
          'request_number',
          '의뢰번호',
          '신청번호',
          '접수번호',
          '접수 번호'
        ]));
        return candidate || acc;
      }, '');
      const receiptNumberFromSource = sanitizeIdentifierValue(extractReceiptNumberFromSourceText(
        preparedRequest.sourceText || '',
        resolvedReportNo
      ));
      const resolvedReceiptNumber = receiptNumberFromResult || receiptNumberFromSource;
      const topPriorityPreview = getTopPrioritySourceText(preparedRequest.sourceText || '')
        .split(/\r?\n/)
        .slice(0, 6)
        .join(' | ')
        .slice(0, 500);
      console.log('[접수번호 추출 디버그]', {
        reportNoFromResult,
        reportNoFromSource,
        resolvedReportNo,
        receiptNumberFromResult,
        receiptNumberFromSource,
        resolvedReceiptNumber,
        topPriorityPreview
      });
      setReceiptNumber(resolvedReceiptNumber || '');

      const practitionerFromResult = parsedResult.reduce((acc: string, row: unknown) => {
        if (acc) return acc;
        if (!row || typeof row !== 'object') return acc;
        return pickTextValueLoose(row as Record<string, any>, [
          '작성자',
          'author',
          'practitioner',
          'manager',
          '담당자',
          '실무자',
          '책임자'
        ]);
      }, '');
      const practitionerFromSource = extractPractitionerFromSourceText(preparedRequest.sourceText || '');
      const resolvedPractitioner = practitionerFromResult || practitionerFromSource;

      const sourceIssuedDate = extractIssuedDateFromSourceText(preparedRequest.sourceText || '');
      const fixedResult = parsedResult.map((row: Partial<AnalysisResult>) => {
        const rawRow = row as Record<string, any>;
        const rowReportNo = sanitizeIdentifierValue(pickTextValueLoose(rawRow, [
          'Report_No',
          'reportNo',
          'report_no',
          'reportNumber',
          'report_number',
          'certificateNo',
          'certificateNumber',
          '성적서번호',
          '성적서 번호',
          '보고서번호',
          '보고서 번호'
        ])) || sanitizeIdentifierValue(row.Report_No) || '';
        const reportNo = getRequiredText((!rowReportNo || rowReportNo === '-') ? resolvedReportNo : rowReportNo, resolvedReportNo);
        const reportType = resolveReportTypeByLegacyRule(reportNo, row.gubun_code);
        const isAiByReportType =
          /AI/u.test(reportType) ||
          reportType === '일반 AI 성적서' ||
          (reportType === 'KOLAS 시험성적서' && reportNo.includes('AI'));
        const isAiByRowContext = isAiLikeRow(rawRow as Partial<AnalysisResult> & Record<string, any>);
        const isAiReport = isAiByReportType || isAiByRowContext;
        const metricsValue = pickTextValueLoose(rawRow, ['Metrics', 'metrics', 'METRICS', 'metric']);
        const eqValue = pickTextValueLoose(rawRow, ['EQ', 'eq', 'Eq', 'equation', 'Equation']);
        const mainTechFieldEtcRaw = pickTextValueLoose(rawRow, ['mainTechField_ect', 'mainTechFieldEtc', 'mainTechField_etc']);
        const platformEtcRaw = pickTextValueLoose(rawRow, ['platform_ect', 'platformEtc', 'platform_etc']);
        const sanitizedTestResult = stripConformanceWords(row.testResult);
        const normalizedCreatedAt = normalizeDateValue(typeof row.created_at === 'string' ? row.created_at : '');
        const resolvedCreatedAt = sourceIssuedDate || normalizedCreatedAt || getRequiredText(row.created_at);

        const normalizedcompany_name = getRequiredText(row.company_name);
        const normalizedProductName = getRequiredText(row.productName);
        const normalizedOverview = getRequiredText(row.overview);
        const normalizedTestItem = getRequiredText(row.Test_Item);
        const normalizedParameter = getRequiredText(row.Parameter);
        const normalizedTestStandard = getRequiredText(
          pickTextValueLoose(rawRow, [
            'testStandard',
            'test_standard',
            '시험표준',
            '시험 표준',
            'testMethod',
            'test_method',
            'method',
            '시험방법',
            '시험 방법',
            '시험규격',
            '시험 규격'
          ]) || row.testStandard
        );
        const qualityCharacteristicRaw = pickTextValueLoose(rawRow, [
          'qualityCharacteristic',
          'quality_characteristic',
          '품질특성',
          '품질 특성',
          '시험항목별품질특성',
          '시험항목별 품질특성',
          '부특성',
          'representativeDomain',
          '대표도메인',
          '대표 도메인'
        ]) || row.qualityCharacteristic;
        const qualityCharacteristicEtcRaw = pickTextValueLoose(rawRow, [
          'qualityCharacteristic_ect',
          'qualityCharacteristicEtc',
          'qualityCharacteristic_etc',
          'quality_characteristic_ect',
          'quality_characteristic_etc',
          '품질특성기타',
          '품질특성 기타',
          '시험항목별품질특성기타',
          '시험항목별 품질특성 기타'
        ]) || row.qualityCharacteristic_ect;
        const receiptNumberValue = sanitizeIdentifierValue(
          pickTextValueLoose(rawRow, [
            'receiptNumber',
            'receipt_number',
            'receiptNo',
            'receipt_no',
            'registrationNo',
            'registrationNumber',
            'registration_no',
            'registration_number',
            'requestNo',
            'requestNumber',
            'request_no',
            'request_number',
            '의뢰번호',
            '신청번호',
            '접수번호',
            '접수 번호'
          ])
        ) || resolvedReceiptNumber;
        const practitionerValue =
          pickTextValueLoose(rawRow, ['작성자', 'author', 'practitioner', 'manager', '담당자', '실무자', '책임자']) ||
          resolvedPractitioner;

        // 시험항목 분석 필드는 시험항목/시험기록(Test_Item, Parameter, testResult)을 기준으로 재산정
        const analysisBaseRow: Partial<AnalysisResult> = {
          ...row,
          company_name: normalizedcompany_name,
          productName: normalizedProductName,
          overview: normalizedOverview,
          Test_Item: normalizedTestItem,
          Parameter: normalizedParameter,
          testStandard: normalizedTestStandard,
          testResult: sanitizedTestResult,
          representativeDomain: '',
          platform: ''
        };

        const normalizedRepresentativeDomain = normalizeRepresentativeDomainValue('', analysisBaseRow);
        const normalizedQualityCharacteristic = stripRepresentativeDomainDetail(
          (typeof qualityCharacteristicRaw === 'string' ? qualityCharacteristicRaw : '') || normalizedRepresentativeDomain
        ) || normalizedRepresentativeDomain;
        const inferredMainTechField = getStandardMainTechField(analysisBaseRow);
        const normalizedMainTechField = normalizeMainTechFieldValue(inferredMainTechField, inferredMainTechField, analysisBaseRow);
        const parsedMainTechField = splitOtherWithDetail(normalizedMainTechField, '그외');

        const normalizedPlatform = getPlatform({
          ...analysisBaseRow,
          representativeDomain: normalizedRepresentativeDomain,
          mainTechField: parsedMainTechField.value || normalizedMainTechField,
          platform: ''
        });
        const parsedPlatformLegacy = splitOtherWithDetail(normalizedPlatform, '기타');
        const parsedPlatform = parsedPlatformLegacy.value === '기타'
          ? { value: '그외', detail: parsedPlatformLegacy.detail }
          : splitOtherWithDetail(normalizedPlatform, '그외');

        const contextRow: Partial<AnalysisResult> = {
          ...analysisBaseRow,
          representativeDomain: normalizedRepresentativeDomain,
          mainTechField: parsedMainTechField.value || normalizedMainTechField,
          platform: parsedPlatform.value || normalizedPlatform
        };
        const fallbackAIDomain = getRepresentativeAIDomain(contextRow);
        const fallbackAITech = getRepresentativeAITech(contextRow);
        const resolvedMainTechFieldEtc =
          parsedMainTechField.value === '그외'
            ? (mainTechFieldEtcRaw || parsedMainTechField.detail || getOtherTechDetail(contextRow))
            : '';
        const resolvedTestStandard = getRequiredText(normalizedTestStandard, '미기재');

        return {
          ...row,
          Report_No: reportNo,
          receiptNumber: receiptNumberValue,
          created_at: resolvedCreatedAt,
          company_name: normalizedcompany_name,
          representativeDomain: getRequiredText(normalizedRepresentativeDomain, '미분류'),
          mainTechField: getRequiredText(parsedMainTechField.value || normalizedMainTechField),
          mainTechField_ect: resolvedMainTechFieldEtc,
          productName: normalizedProductName,
          overview: normalizedOverview,
          Test_Item: normalizedTestItem,
          Parameter: normalizedParameter,
          testStandard: resolvedTestStandard,
          practitioner: practitionerValue,
          AI_Domain: ensureAiRecommendationFormat(fallbackAIDomain, fallbackAIDomain),
          AI_Tech: ensureAiRecommendationFormat(fallbackAITech, fallbackAITech),
          platform: getRequiredText(parsedPlatform.value || normalizedPlatform),
          platform_ect: (parsedPlatform.value === '그외' ? (platformEtcRaw || parsedPlatform.detail || getOtherPlatformDetail(contextRow)) : ''),
          qualityCharacteristic: getRequiredText(normalizedQualityCharacteristic, normalizedRepresentativeDomain || '미분류'),
          qualityCharacteristic_ect: typeof qualityCharacteristicEtcRaw === 'string' ? qualityCharacteristicEtcRaw.trim() : '',
          testResult: getRequiredText(sanitizedTestResult),
          gubun_code: reportType,
          Metrics: isAiReport
            ? (metricsValue || '정확도, F1 점수 등 AI 성능 지표')
            : metricsValue,
          EQ: isAiReport
            ? (eqValue || 'AI 산식 또는 모델 정보')
            : eqValue
        } as AnalysisResult;
      });

      const expandedResult = expandRowsByTestItem(fixedResult);

      // 분할 이후 각 row를 시험항목 단위로 다시 계산해 1 row = 1 시험항목 기준을 보장
      const reAnalyzedPerTestItem = expandedResult.map((row: AnalysisResult) => {
        const rawRow = row as Record<string, any>;
        const sanitizedTestResult = stripConformanceWords(row.testResult);
        const normalizedcompany_name = getRequiredText(row.company_name);
        const normalizedProductName = getRequiredText(row.productName);
        const normalizedOverview = getRequiredText(row.overview);
        const normalizedTestItem = getRequiredText(row.Test_Item);
        const normalizedParameter = getRequiredText(row.Parameter);
        const normalizedTestStandard = getRequiredText(
          pickTextValueLoose(rawRow, [
            'testStandard',
            'test_standard',
            '시험표준',
            '시험 표준',
            'testMethod',
            'test_method',
            'method',
            '시험방법',
            '시험 방법',
            '시험규격',
            '시험 규격'
          ]) || row.testStandard
        );
        const mainTechFieldEtcRaw = pickTextValueLoose(rawRow, ['mainTechField_ect', 'mainTechFieldEtc', 'mainTechField_etc']);
        const platformEtcRaw = pickTextValueLoose(rawRow, ['platform_ect', 'platformEtc', 'platform_etc']);
        const qualityCharacteristicRaw = pickTextValueLoose(rawRow, [
          'qualityCharacteristic',
          'quality_characteristic',
          '품질특성',
          '품질 특성',
          '시험항목별품질특성',
          '시험항목별 품질특성',
          '부특성',
          'representativeDomain',
          '대표도메인',
          '대표 도메인'
        ]) || row.qualityCharacteristic;
        const qualityCharacteristicEtcRaw = pickTextValueLoose(rawRow, [
          'qualityCharacteristic_ect',
          'qualityCharacteristicEtc',
          'qualityCharacteristic_etc',
          'quality_characteristic_ect',
          'quality_characteristic_etc',
          '품질특성기타',
          '품질특성 기타',
          '시험항목별품질특성기타',
          '시험항목별 품질특성 기타'
        ]) || row.qualityCharacteristic_ect;

        const analysisBaseRow: Partial<AnalysisResult> = {
          ...row,
          company_name: normalizedcompany_name,
          productName: normalizedProductName,
          overview: normalizedOverview,
          Test_Item: normalizedTestItem,
          Parameter: normalizedParameter,
          testStandard: normalizedTestStandard,
          testResult: sanitizedTestResult,
          representativeDomain: '',
          platform: ''
        };

        const normalizedRepresentativeDomain = normalizeRepresentativeDomainValue('', analysisBaseRow);
        const normalizedQualityCharacteristic = stripRepresentativeDomainDetail(
          (typeof qualityCharacteristicRaw === 'string' ? qualityCharacteristicRaw : '') || normalizedRepresentativeDomain
        ) || normalizedRepresentativeDomain;
        const inferredMainTechField = getStandardMainTechField(analysisBaseRow);
        const normalizedMainTechField = normalizeMainTechFieldValue(inferredMainTechField, inferredMainTechField, analysisBaseRow);
        const parsedMainTechField = splitOtherWithDetail(normalizedMainTechField, '그외');
        const normalizedPlatform = getPlatform({
          ...analysisBaseRow,
          representativeDomain: normalizedRepresentativeDomain,
          mainTechField: parsedMainTechField.value || normalizedMainTechField,
          platform: ''
        });
        const parsedPlatformLegacy = splitOtherWithDetail(normalizedPlatform, '기타');
        const parsedPlatform = parsedPlatformLegacy.value === '기타'
          ? { value: '그외', detail: parsedPlatformLegacy.detail }
          : splitOtherWithDetail(normalizedPlatform, '그외');
        const contextRow: Partial<AnalysisResult> = {
          ...analysisBaseRow,
          representativeDomain: normalizedRepresentativeDomain,
          mainTechField: parsedMainTechField.value || normalizedMainTechField,
          platform: parsedPlatform.value || normalizedPlatform
        };

        const fallbackAIDomain = getRepresentativeAIDomain(contextRow);
        const fallbackAITech = getRepresentativeAITech(contextRow);
        const resolvedMainTechFieldEtc =
          parsedMainTechField.value === '그외'
            ? (mainTechFieldEtcRaw || parsedMainTechField.detail || getOtherTechDetail(contextRow))
            : '';
        const resolvedTestStandard = getRequiredText(normalizedTestStandard, '미기재');

        return {
          ...row,
          company_name: normalizedcompany_name,
          representativeDomain: getRequiredText(normalizedRepresentativeDomain, '미분류'),
          mainTechField: getRequiredText(parsedMainTechField.value || normalizedMainTechField),
          mainTechField_ect: resolvedMainTechFieldEtc,
          productName: normalizedProductName,
          overview: normalizedOverview,
          Test_Item: normalizedTestItem,
          Parameter: normalizedParameter,
          testStandard: resolvedTestStandard,
          AI_Domain: ensureAiRecommendationFormat(fallbackAIDomain, fallbackAIDomain),
          AI_Tech: ensureAiRecommendationFormat(fallbackAITech, fallbackAITech),
          platform: getRequiredText(parsedPlatform.value || normalizedPlatform),
          platform_ect: (parsedPlatform.value === '그외' ? (platformEtcRaw || parsedPlatform.detail || getOtherPlatformDetail(contextRow)) : ''),
          qualityCharacteristic: getRequiredText(normalizedQualityCharacteristic, normalizedRepresentativeDomain || '미분류'),
          qualityCharacteristic_ect: typeof qualityCharacteristicEtcRaw === 'string' ? qualityCharacteristicEtcRaw.trim() : '',
          testResult: getRequiredText(sanitizedTestResult)
        } as AnalysisResult;
      });

      const mergedPerTestItem = mergeRowsBySameTestItem(reAnalyzedPerTestItem);
      setResults(mergedPerTestItem);
    } catch (err: any) {
      console.error(err);
      if (err?.name === 'AbortError') {
        setError('분석 요청 시간이 초과되었습니다. 빠른 분석 모드를 켜거나 문서 분량을 줄여 다시 시도해 주세요.');
        setResults([]);
        return;
      }
      const message = err instanceof SyntaxError
        ? 'AI 응답에서 JSON을 추출하지 못했습니다. 응답 형식을 확인해 주세요.'
        : err.message || '분석 중 오류가 발생했습니다.';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysisWithPrompt = async () => {
    if (!file || !promptDraft.trim()) return;

    try {
      const preparedRequest = await prepareAgentAnalysisRequest();
      await executePreparedAnalysis(preparedRequest, promptDraft.trim());
    } catch (err: any) {
      console.error(err);
      setError(err.message || '분석 요청 준비 중 오류가 발생했습니다.');
    }
  };

  const resetAnalyzePage = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setPromptDraft('');
    setIsInsertQueryModalOpen(false);
    setInsertQueryPreview('');
    setCopyQueryMessage('');
    setPendingInsertPayload([]);
    setPendingSummaryPayload(null);
    setReceiptNumber('');
    setSubmissionOffice('');
    setParticipatingProjectName('');
    setIsPromptModalOpen(false);
    setPreparingPrompt(false);
    sourceTextCacheRef.current.clear();
  };

  const buildAccumulatedPayload = () => {
    if (!results || results.length === 0) {
      setError('저장할 분석 결과가 없습니다.');
      return null;
    }

    // 누적 데이터 중에 동일한 Report_No가 있는지 확인
    const reportNoSet = new Set(accumulatedResults.map(r => r.Report_No));
    const nonDuplicateResults = results.filter(r => !(r.Report_No && reportNoSet.has(r.Report_No)));
    if (nonDuplicateResults.length === 0) {
      setError('이미 분석된 보고서 번호가 있습니다. 중복된 결과는 저장할 수 없습니다.');
      return null;
    }

    return nonDuplicateResults.map(normalizeMetricEqForSave);
  };

  const buildAnalysisInfoPayload = (rows: AnalysisResult[]): AnalysisInfoPayload | null => {
    if (!rows || rows.length === 0) return null;

    const pickFromRows = (keys: string[]) => {
      for (const row of rows) {
        const value = pickTextValueLoose(row, keys);
        if (value && value.trim()) return value.trim();
      }
      return '';
    };
    const toNullableText = (value: unknown) => {
      const text = String(value ?? '').trim();
      if (!text || text === '-') return null;
      return text;
    };
    const toNullableNumber = (value: unknown) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const platformValue = toNullableText(pickFromRows(['platform']));
    const platformEtcValue = toNullableText(pickFromRows(['platform_ect', 'platformEtc', 'platform_etc']));
    const normalizedPlatform = (() => {
      // analysis_info는 플랫폼/플랫폼_기타를 platform 1개 컬럼으로 합쳐 저장
      if (platformValue && platformEtcValue) return `${platformValue}(${platformEtcValue})`;
      if (platformValue) return platformValue;
      if (platformEtcValue) return `기타(${platformEtcValue})`;
      return null;
    })();

    return {
      report_no: toNullableText(pickFromRows(['Report_No', 'reportNo', 'report_no'])),
      submission_id: toNullableText(receiptNumber || pickFromRows(['receiptNumber', 'receipt_number', 'receiptNo', 'requestNo', '접수번호', '접수 번호'])),
      gubun_code: toNullableText(pickFromRows(['gubun_code', 'gubunCode', 'reportType', '보고서구분', '시험성적서구분'])),
      company_name: toNullableText(pickFromRows(['company_name', '기관명', '회사명'])),
      company_domain: toNullableText(pickFromRows(['company_domain', 'organizationDomain', 'representativeDomain', '기관도메인', '기관 도메인'])),
      product_name: toNullableText(pickFromRows(['productName', 'product_name', '제품명'])),
      request_Date: toNullableText(
        pickFromRows([
          'testApplicationDate',
          'test_application_date',
          'applicationDate',
          'application_date',
          'requestDate',
          'request_date',
          'applyDate',
          'apply_date',
          '시험신청일자',
          '시험신청일',
          '신청일자',
          '신청일'
        ])
      ),
      test_Date: toNullableText(
        pickFromRows([
          'testPeriod',
          'test_period',
          'testDatePeriod',
          'test_date_period',
          'testDateRange',
          'test_date_range',
          'testDate',
          'test_date',
          'executionDate',
          'execution_date',
          'performedDate',
          'performed_date',
          '시험기간',
          '시험일자',
          '시험일',
          '수행일자',
          '수행일'
        ])
      ),
      release_Date: toNullableText(pickFromRows(['created_at', 'releaseDate', 'release_date', 'issuedAt', '발급일자', '발급 일자'])),
      platform: normalizedPlatform,
      mainTechField: toNullableText(pickFromRows(['mainTechField', 'main_tech_field', '주요기술분야', '주요기술 분야'])),
      mainTechField_ect: toNullableText(pickFromRows(['mainTechField_ect', 'mainTechFieldEtc', 'mainTechField_etc', '주요기술분야_기타', '주요기술 분야_기타'])),
      overview: toNullableText(pickFromRows(['overview', '개요'])),
      test_item_count: toNullableNumber(rows.length),
      receiving_org: toNullableText(participatingProjectName || pickFromRows(['receiving_org', 'receivingOrg', 'participatingProjectName', '참여사업명'])),
      program_name: toNullableText(submissionOffice || pickFromRows(['program_name', 'programName', 'submissionOffice', '제출처'])),
      operator: toNullableText(
        pickFromRows(['operator', 'practitioner', '작성자', '실무자', '담당자', 'manager'])
      )
    };
  };

  const buildAnalysisInfoInsertQueryPreview = (summaryInfo: AnalysisInfoPayload | null) => {
    if (!summaryInfo) return '';

    const insertColumns = [
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
    ] as const;

    const toSqlValue = (value: unknown) => {
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'number' || typeof value === 'bigint') return String(value);
      if (typeof value === 'boolean') return value ? '1' : '0';
      const text = String(value).trim();
      if (!text) return 'NULL';
      return `'${text.replace(/'/g, "''")}'`;
    };

    const values = insertColumns.map((column) => toSqlValue(summaryInfo[column]));
    return `INSERT INTO analysis_info (\n  ${insertColumns.map(column => `\`${column}\``).join(',\n  ')}\n) VALUES\n(${values.join(', ')});`;
  };

  const buildInsertQueryPreview = (rows: AnalysisResult[], summaryInfo: AnalysisInfoPayload | null) => {
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
      'item_attribute_ect',
      'ai_domain',
      'ai_tech'
    ];

    const toSqlValue = (value: unknown) => {
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'number' || typeof value === 'bigint') return String(value);
      if (typeof value === 'boolean') return value ? '1' : '0';
      const text = String(value).trim();
      if (!text) return 'NULL';
      return `'${text.replace(/'/g, "''")}'`;
    };

    const valuesSql = rows
      .map((row) => {
        const values = [
          row.Report_No,
          row.Test_Item,
          row.Parameter,
          row.testStandard,
          row.testResult,
          row.platform,
          row.platform_ect,
          row.mainTechField,
          row.mainTechField_ect,
          row.qualityCharacteristic,
          row.qualityCharacteristic_ect,
          row.AI_Domain,
          row.AI_Tech
        ];
        return `(${values.map(toSqlValue).join(', ')})`;
      })
      .join(',\n');

    const resultsQuery = `INSERT INTO analysis_results (\n  ${insertColumns.map(column => `\`${column}\``).join(',\n  ')}\n) VALUES\n${valuesSql};\n-- 총 ${rows.length}건 저장 예정`;
    const summaryQuery = buildAnalysisInfoInsertQueryPreview(summaryInfo);
    return summaryQuery ? `${summaryQuery}\n\n${resultsQuery}` : resultsQuery;
  };

  const openInsertQueryModal = async () => {
    const payloadResults = buildAccumulatedPayload();
    if (!payloadResults || payloadResults.length === 0) return;
    const summaryPayload = buildAnalysisInfoPayload(payloadResults);
    if (!summaryPayload) {
      setError('analysis_info 요약 데이터 생성에 실패했습니다. 저장을 중단합니다.');
      return;
    }
    await addToAccumulated(payloadResults, summaryPayload);
  };

  const copyInsertQueryPreview = async () => {
    const queryText = insertQueryPreview.trim();
    if (!queryText) {
      setCopyQueryMessage('복사할 쿼리문이 없습니다.');
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(queryText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = queryText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyQueryMessage('쿼리문을 클립보드에 복사했습니다.');
    } catch {
      setCopyQueryMessage('쿼리 복사에 실패했습니다. 쿼리문을 직접 선택해 복사해 주세요.');
    }
  };

  const addToAccumulated = async (payloadOverride?: AnalysisResult[], summaryOverride?: AnalysisInfoPayload | null) => {
    const payloadResults = payloadOverride || buildAccumulatedPayload();
    if (!payloadResults || payloadResults.length === 0) return;
    const summaryPayload = summaryOverride ?? buildAnalysisInfoPayload(payloadResults);
    if (!summaryPayload) {
      setError('analysis_info 요약 데이터 생성에 실패했습니다. 저장을 중단합니다.');
      return;
    }

    try {
      setSavingAccumulated(true);
      console.log('?? 저장할 데이터:', {
        건수: payloadResults.length,
        첫번째: payloadResults[0],
        Metrics: payloadResults[0]?.Metrics,
        EQ: payloadResults[0]?.EQ
      });
      console.log('?? 저장 요청 시작:', {
        url: `${getApiUrl()}/analysis-results/insert`,
        dataCount: payloadResults.length,
        firstRow: payloadResults[0]
      });

      const response = await fetch(`${getApiUrl()}/analysis-results/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: payloadResults,
          summaryInfo: summaryPayload
        })
      });

      console.log('?? 서버 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const rawErrorText = await response.text();
        let parsedError: Record<string, any> | null = null;
        if (rawErrorText) {
          try {
            parsedError = JSON.parse(rawErrorText);
          } catch {
            parsedError = null;
          }
        }

        const serverMessage =
          parsedError?.error ||
          parsedError?.message ||
          response.statusText ||
          '알 수 없는 서버 오류';
        const detailLines = [
          parsedError?.details ? `details: ${String(parsedError.details)}` : '',
          parsedError?.sqlMessage ? `sqlMessage: ${String(parsedError.sqlMessage)}` : '',
          parsedError?.code ? `code: ${String(parsedError.code)}` : '',
          parsedError?.errno ? `errno: ${String(parsedError.errno)}` : '',
          parsedError?.sqlState ? `sqlState: ${String(parsedError.sqlState)}` : ''
        ].filter(Boolean);

        const fallbackBody = !parsedError && rawErrorText
          ? rawErrorText.slice(0, 1600)
          : '';
        const technicalMessage = [serverMessage, ...detailLines, fallbackBody].filter(Boolean).join('\n');
        const lowerTechnical = technicalMessage.toLowerCase();
        let composedErrorMessage = `저장에 실패했습니다. (HTTP ${response.status})`;

        if (
          /foreign key constraint fails|fk_analysis_report_no|analysis_results.*report_no|analysis_info.*report_no/i.test(technicalMessage)
        ) {
          composedErrorMessage =
            '저장에 실패했습니다. 보고서 번호(report_no) 참조가 맞지 않아 저장할 수 없습니다.\n' +
            'analysis_info 저장값과 analysis_results 저장값이 같은지 확인 후 다시 시도해 주세요.';
        } else if (/analysis_info\(summaryinfo\).*(필수|required)/i.test(technicalMessage)) {
          composedErrorMessage = '저장에 실패했습니다. analysis_info 요약 정보가 없어 저장할 수 없습니다.';
        } else if (/analysis_info 저장(에 실패| 확인 조회에 실패)|analysis_info/i.test(technicalMessage)) {
          composedErrorMessage = '저장에 실패했습니다. analysis_info 저장/검증 단계에서 오류가 발생했습니다.';
        } else if (/report_no가 없어|report_no.*(missing|null|empty)/i.test(technicalMessage)) {
          composedErrorMessage = '저장에 실패했습니다. 보고서 번호(report_no)를 찾지 못했습니다.';
        } else if (response.status >= 500) {
          composedErrorMessage = '서버 내부 오류로 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';
        }

        console.error('? 저장 실패 상세:', {
          status: response.status,
          statusText: response.statusText,
          parsedError,
          rawErrorText,
          technicalMessage
        });
        throw new Error(composedErrorMessage);
      }

      const data = await response.json();
      console.log('? 저장 성공:', data);

      // 누적 결과를 즉시 반영
      const savedProductPlatform = (() => {
        const platformFromResponse =
          typeof data?.analysisInfo?.platform === 'string'
            ? data.analysisInfo.platform.trim()
            : '';
        if (platformFromResponse) return platformFromResponse;
        const platformFromPayload =
          typeof summaryPayload.platform === 'string'
            ? summaryPayload.platform.trim()
            : '';
        return platformFromPayload;
      })();
      const savedReleaseDate = (() => {
        const releaseFromResponse =
          typeof data?.analysisInfo?.release_Date === 'string'
            ? data.analysisInfo.release_Date.trim()
            : '';
        if (releaseFromResponse) return releaseFromResponse;
        const releaseFromPayload =
          typeof summaryPayload?.release_Date === 'string'
            ? summaryPayload.release_Date.trim()
            : '';
        return releaseFromPayload;
      })();

      const savedRows = Array.isArray(data.results)
        ? data.results
          .map((row: any, index: number) => normalizeAccumulatedRow({
            ...row,
            release_Date:
              (typeof row?.release_Date === 'string' ? row.release_Date.trim() : '') ||
              savedReleaseDate,
            productPlatform:
              (typeof row?.productPlatform === 'string' ? row.productPlatform.trim() : '') ||
              savedProductPlatform
          }, -(Date.now() + index)))
          .filter((row: AnalysisResult | null): row is AnalysisResult => row !== null)
        : payloadResults
          .map((row, index) => normalizeAccumulatedRow({
            ...row,
            release_Date: savedReleaseDate,
            productPlatform: savedProductPlatform
          }, -(Date.now() + index)))
          .filter((row): row is AnalysisResult => row !== null);
      setAccumulatedResults(prev => [...savedRows, ...prev]);
      setIsInsertQueryModalOpen(false);
      setInsertQueryPreview('');
      setCopyQueryMessage('');
      setPendingInsertPayload([]);
      setPendingSummaryPayload(null);
      resetAnalyzePage();
      setActiveTab('accumulated');
    } catch (err: any) {
      console.error('? 저장 중 오류:', err);
      const networkMessage =
        err?.name === 'TypeError' && /fetch/i.test(String(err?.message || ''))
          ? '서버 연결에 실패했습니다. 서버 실행 상태와 네트워크를 확인해 주세요.'
          : '';
      const errorMessage = networkMessage || err?.message || '결과를 저장하는 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setSavingAccumulated(false);
    }
  };

  const confirmAddToAccumulated = async () => {
    if (pendingInsertPayload.length === 0) return;
    await addToAccumulated(pendingInsertPayload, pendingSummaryPayload);
  };

  const buildExcelExportRows = (rows: Record<string, unknown>[]) => (
    rows.map((row) => {
      const next: Record<string, unknown> = {};
      EXCEL_EXPORT_COLUMNS.forEach(({ header, key }) => {
        const value = row[key];
        next[header] = value === null || value === undefined ? '' : value;
      });
      return next;
    })
  );

  const buildExcelFallbackRowsFromAccumulated = () => {
    const countByReportNo: Record<string, number> = {};
    accumulatedResults.forEach((row) => {
      const reportNo = (row.Report_No || '').trim();
      if (!reportNo) return;
      countByReportNo[reportNo] = (countByReportNo[reportNo] || 0) + 1;
    });

    return accumulatedResults.map((row) => {
      const reportNo = (row.Report_No || '').trim();
      return {
        report_no: reportNo,
        submission_id: row.receiptNumber || '',
        gubun_code: row.gubun_code || '',
        companyName: row.company_name || '',
        company_domain: row.company_domain || '',
        product_name: row.productName || '',
        request_Date: '',
        test_Date: '',
        release_Date: row.release_Date || row.created_at || '',
        platform: row.productPlatform || row.platform || '',
        platform_ect: row.platform_ect || '',
        mainTechField: row.mainTechField || '',
        mainTechField_ect: row.mainTechField_ect || '',
        overview: row.overview || '',
        test_item_count: reportNo ? (countByReportNo[reportNo] || 0) : '',
        receiving_org: '',
        program_name: '',
        operator: row.practitioner || '',
        test_item: row.Test_Item || '',
        test_spec: row.Parameter || '',
        test_standard: row.testStandard || '',
        test_result: row.testResult || '',
        item_platform: row.platform || '',
        item_platform_ect: row.platform_ect || '',
        item_mainTechField: row.mainTechField || '',
        item_mainTechField_ect: row.mainTechField_ect || '',
        item_attribute: row.qualityCharacteristic || row.representativeDomain || '',
        item_attribute_ect: row.qualityCharacteristic_ect || '',
        ai_domain: row.AI_Domain || '',
        ai_tech: row.AI_Tech || ''
      } as Record<string, unknown>;
    });
  };

  const mergeRowsBySameTestItem = (rows: AnalysisResult[]) => {
    const mergedRows: AnalysisResult[] = [];
    const mergeIndexByKey = new Map<string, number>();

    const appendDistinctMultiline = (base: unknown, next: unknown) => {
      const baseText = typeof base === 'string' ? base.trim() : String(base || '').trim();
      const nextText = typeof next === 'string' ? next.trim() : String(next || '').trim();
      if (!baseText) return nextText;
      if (!nextText) return baseText;
      if (baseText === nextText) return baseText;
      const baseLines = baseText.split(/\n+/).map(v => v.trim()).filter(Boolean);
      if (baseLines.includes(nextText)) return baseText;
      return `${baseText}\n${nextText}`;
    };

    rows.forEach((row, index) => {
      const reportNo = (row.Report_No || '').trim();
      const testItem = (row.Test_Item || '').trim();
      if (!reportNo || !testItem) {
        mergedRows.push(row);
        return;
      }

      const key = `${reportNo}__${testItem}`;
      if (!mergeIndexByKey.has(key)) {
        mergeIndexByKey.set(key, mergedRows.length);
        mergedRows.push(row);
        return;
      }

      const targetIndex = mergeIndexByKey.get(key)!;
      const existing = mergedRows[targetIndex];
      mergedRows[targetIndex] = {
        ...existing,
        Parameter: appendDistinctMultiline(existing.Parameter, row.Parameter),
        testStandard: appendDistinctMultiline(existing.testStandard, row.testStandard),
        testResult: appendDistinctMultiline(existing.testResult, row.testResult),
        platform: appendDistinctMultiline(existing.platform, row.platform),
        mainTechField: appendDistinctMultiline(existing.mainTechField, row.mainTechField),
        qualityCharacteristic: appendDistinctMultiline(existing.qualityCharacteristic, row.qualityCharacteristic),
        AI_Domain: appendDistinctMultiline(existing.AI_Domain, row.AI_Domain),
        AI_Tech: appendDistinctMultiline(existing.AI_Tech, row.AI_Tech),
      };
    });

    return mergedRows;
  };

  const fetchExcelExportRowsFromServer = async () => {
    const candidateUrls = Array.from(new Set([
      `${getApiUrl()}/analysis-results-export`,
      '/analysis-results-export'
    ]));

    let lastErrorMessage = '';

    for (const url of candidateUrls) {
      try {
        const response = await fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }, 30000);

        if (!response.ok) {
          const errorText = await response.text();
          let parsed: Record<string, any> | null = null;
          try {
            parsed = errorText ? JSON.parse(errorText) : null;
          } catch {
            parsed = null;
          }
          lastErrorMessage = parsed?.error || parsed?.message || `엑셀 다운로드 조회 실패 (HTTP ${response.status})`;
          continue;
        }

        const data = await response.json();
        return Array.isArray(data?.results) ? (data.results as Record<string, unknown>[]) : [];
      } catch (err: any) {
        lastErrorMessage = err?.message || 'Failed to fetch';
      }
    }

    throw new Error(lastErrorMessage || '엑셀 데이터를 조회하지 못했습니다.');
  };

  const downloadExcelFile = (rows: Record<string, unknown>[]) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      setError('엑셀로 내보낼 데이터가 없습니다.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analysis Results");
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Test_Report_Analysis_${date}.xlsx`);
  };

  const exportToExcel = async () => {
    try {
      setIsPreparingExcelPreview(true);
      setError(null);
      setExcelPreviewErrorMessage('');
      setExcelPreviewNoticeMessage('');
      setExcelPreviewRows([]);
      setIsExcelPreviewModalOpen(true);

      const rows = await fetchExcelExportRowsFromServer();

      if (rows.length === 0) {
        const message = '엑셀로 내보낼 데이터가 없습니다.';
        setError(message);
        setExcelPreviewErrorMessage(message);
        return;
      }

      const dataToExport = buildExcelExportRows(rows);
      setExcelPreviewRows(dataToExport);
    } catch (err: any) {
      console.error(err);
      const message = err?.message || '엑셀 다운로드 중 오류가 발생했습니다.';
      if (accumulatedResults.length > 0) {
        const fallbackRows = buildExcelFallbackRowsFromAccumulated();
        const dataToExport = buildExcelExportRows(fallbackRows);
        setExcelPreviewRows(dataToExport);
        setExcelPreviewErrorMessage('');
        setExcelPreviewNoticeMessage('서버 연결 실패로 현재 누적 결과 기준 미리보기를 표시합니다. 일부 analysis_info 항목은 비어있을 수 있습니다.');
      } else {
        setError(message);
        setExcelPreviewErrorMessage(message);
      }
    } finally {
      setIsPreparingExcelPreview(false);
    }
  };

  const clearAccumulated = async () => {
    if (window.confirm("누적된 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        const response = await fetch(`${getApiUrl()}/analysis-results/all`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) throw new Error('삭제 실패');
        const data = await response.json();
        setAccumulatedResults([]);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || '결과를 삭제하는 중 오류가 발생했습니다.');
      }
    }
  };


  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem('session_expire');
    localStorage.removeItem('login_id');
    localStorage.removeItem('member');
    setIsLoggedIn(false);
    setLoginId(null);
    setIsAdminMember(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={(id?: string) => {
      // 로그인 성공 시 세션 만료 시간 갱신
      const expire = Date.now() + 60 * 60 * 1000;
      localStorage.setItem('session_expire', expire.toString());
      if (id) {
        localStorage.setItem('login_id', id);
        setLoginId(id);
      } else {
        // 기존 방식: login_id가 없는 경우에도 localStorage에서 가져옴
        const storedId = localStorage.getItem('login_id');
        setLoginId(storedId);
      }
      setIsAdminMember(getStoredAdminFlag());
      setIsLoggedIn(true);
    }} />;
  }

  const analysisStepItems = [
    { label: '파일 업로드', ready: !!file },
    { label: '프롬프트 확인', ready: !!promptDraft.trim() },
    { label: '결과 확인/누적', ready: !!results?.length }
  ];
  const activeTabLabel = activeTab === 'analyze'
    ? '시험 성적서 분석'
    : activeTab === 'accumulated'
      ? '누적 결과 확인'
      : '시험 성적서  분석 결과';
  const activeTabDescription = activeTab === 'analyze'
    ? 'PDF/Word 성적서를 업로드하고 시험항목 중심으로 결과를 빠르게 확인할 수 있습니다.'
    : activeTab === 'accumulated'
      ? '시험 성적서 데이터 결과를 필터링하고 검색할 수 있습니다.'
      : '시험 성적서  분석 결과를 확인할 수 있습니다.';
  const firstAnalysisRow = results && results.length > 0 ? results[0] : null;
  const getFirstNonEmptyFromResults = (getter: (row: AnalysisResult) => unknown) => {
    if (!results || results.length === 0) return '';
    for (const row of results) {
      const value = getter(row);
      const normalized = typeof value === 'string' ? value.trim() : String(value || '').trim();
      if (normalized) return normalized;
    }
    return '';
  };
  const inferOrganizationDomainFromOrgProduct = (company_name: string, productName: string, overview: string) => {
    const text = `${company_name} ${productName} ${overview}`.toLowerCase();
    if (!text.trim()) return '';

    const rules: Array<{ label: string; pattern: RegExp }> = [
      { label: '의료/헬스케어', pattern: /병원|의료|헬스|health|clinic|medical|바이오|진단|내시경/ },
      { label: '교육/연구', pattern: /대학교|대학|학교|교육|연구원|연구소|laboratory|lab|academy/ },
      { label: '공공/행정', pattern: /정부|공공|행정|시청|구청|군청|공단|공사|협회|기관/ },
      { label: '금융/보안', pattern: /은행|금융|보험|증권|카드|핀테크|보안|security|인증/ },
      { label: '모빌리티/자동차', pattern: /자동차|차량|모빌리티|자율주행|driving|vehicle|mobility/ },
      { label: '통신/네트워크', pattern: /통신|네트워크|telecom|network|5g|6g|lte/ },
      { label: '제조/산업', pattern: /제조|산업|factory|공정|설비|장비|센서|로봇/ },
      { label: '정보통신/소프트웨어', pattern: /소프트웨어|software|platform|시스템|system|클라우드|cloud|ai|인공지능|앱|application/ },
      { label: '콘텐츠/미디어', pattern: /콘텐츠|미디어|방송|영상|게임|metaverse|메타버스/ }
    ];

    const matched = rules.find(rule => rule.pattern.test(text));
    return matched?.label || '';
  };
  const inferPlatformFromOrgProduct = (company_name: string, productName: string, overview: string) => {
    const text = `${company_name} ${productName} ${overview}`.toLowerCase();
    if (!text.trim()) return '';

    if (/web|웹|browser|브라우저|portal|포털|dashboard|대시보드/.test(text)) return '웹(Web)';
    if (/desktop|pc|windows|win32|mac|linux|워크스테이션|데스크톱/.test(text)) return '데스크톱';
    if (/mobile|모바일|android|ios|스마트폰|태블릿|wearable/.test(text)) return '모바일(Mobile)';
    if (/server|서버|backend|백엔드|api|database|db|middleware/.test(text)) return '서버(Server)';
    if (/(^|[^a-z])app([^a-z]|$)|앱|application|애플리케이션/.test(text)) return '앱(APP)';
    if (/cloud|클라우드|aws|azure|gcp|kubernetes|docker|saas|paas|iaas/.test(text)) return '클라우드';
    if (/embedded|임베디드|firmware|펌웨어|mcu|rtos|haptic|햅틱|장치|단말/.test(text)) return '임베디드(Embedded)';
    if (/iot|사물인터넷|sensor|센서|gateway|게이트웨이|mqtt|zigbee|rfid|lora/.test(text)) return 'IoT';
    if (/성능|보안|취약점|침투|암호|인증|latency|throughput|stress|부하|qos/.test(text)) return '성능 및 보안 특화';
    return '';
  };
  const rawSummarySource = (firstAnalysisRow || {}) as Record<string, any>;
  const hasAnalysisResults = !!(results && results.length > 0);
  const reportNoSummary = getFirstNonEmptyFromResults(row => row.Report_No) || '-';
  const reportTypeSummary = (() => {
    const byReportNo = reportNoSummary !== '-' ? getReportType(reportNoSummary) : '';
    if (byReportNo) return byReportNo;
    return getFirstNonEmptyFromResults(row => row.gubun_code) || '-';
  })();
  const summarycompany_name = getFirstNonEmptyFromResults(row => row.company_name) || '-';
  const summaryProductName = getFirstNonEmptyFromResults(row => row.productName) || '-';
  const summaryOverview = getFirstNonEmptyFromResults(row => row.overview) || '-';
  const orgDomainFromOrgProduct = inferOrganizationDomainFromOrgProduct(summarycompany_name, summaryProductName, summaryOverview);
  const orgDomainFromTestRecords = getFirstNonEmptyFromResults(row => row.representativeDomain);
  const summaryOrganizationDomain = orgDomainFromOrgProduct || orgDomainFromTestRecords || '-';
  const platformFromOrgProduct = inferPlatformFromOrgProduct(summarycompany_name, summaryProductName, summaryOverview);
  const platformFromTestRecords = hasAnalysisResults
    ? (
      getFirstNonEmptyFromResults(row => normalizePlatformValue(row.platform, row)) ||
      getPlatform({
        company_name: summarycompany_name,
        productName: summaryProductName,
        overview: summaryOverview,
        Test_Item: getFirstNonEmptyFromResults(row => row.Test_Item),
        Parameter: getFirstNonEmptyFromResults(row => row.Parameter),
        testResult: getFirstNonEmptyFromResults(row => row.testResult)
      })
    )
    : '';
  const summaryPlatform = hasAnalysisResults
    ? (platformFromOrgProduct || platformFromTestRecords || '-')
    : '-';
  const summaryMainTechField = (() => {
    if (!results || results.length === 0) return '-';
    for (const row of results) {
      const display = formatMainTechFieldForDisplay(row);
      if (display && display !== '-') return display;
    }
    return '-';
  })();
  const summaryPractitioner = (() => {
    const fromResults = getFirstNonEmptyFromResults(row =>
      pickTextValueLoose(row as Record<string, any>, ['작성자', 'author', 'practitioner', 'manager', '담당자', '실무자', '책임자'])
    );
    if (fromResults) return fromResults;
    const fromSummarySource = pickTextValueLoose(rawSummarySource, ['작성자', 'author', 'practitioner', 'manager', '담당자', '실무자', '책임자']);
    return fromSummarySource || '-';
  })();
  const companySummary = {
    reportNo: reportNoSummary,
    reportType: reportTypeSummary,
    practitioner: summaryPractitioner,
    company_name: summarycompany_name,
    organizationDomain: summaryOrganizationDomain,
    productName: summaryProductName,
    applicationDate: (() => {
      const raw = pickTextValueLoose(rawSummarySource, ['testApplicationDate', 'test_application_date', 'applicationDate', 'application_date', 'requestDate', 'request_date', 'applyDate', 'apply_date', '시험신청일자', '시험신청일', '신청일자', '신청일']);
      return raw ? formatIssuedDate(raw) : '-';
    })(),
    executionDate: (() => {
      const raw = pickTextValueLoose(rawSummarySource, ['testPeriod', 'test_period', 'testDatePeriod', 'test_date_period', 'testDateRange', 'test_date_range', 'testDate', 'test_date', 'executionDate', 'execution_date', 'performedDate', 'performed_date', '시험기간', '시험일자', '시험일', '수행일자', '수행일']);
      return raw ? formatIssuedDate(raw) : '-';
    })(),
    issuedAt: firstAnalysisRow ? formatIssuedDate(firstAnalysisRow.created_at) : '-',
    platform: summaryPlatform,
    mainTechField: summaryMainTechField,
    overview: summaryOverview,
    itemCount: hasAnalysisResults ? results!.length : '-'
  };
  const uploadedFileSummary = file
    ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    : '';
  const toAccumulatedCellText = (value: unknown, fallback = '-') => {
    const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
    if (!text || /^(?:null|undefined)$/i.test(text)) return fallback;
    return text;
  };
  const renderAccumulatedFixedColumnCell = (
    row: AnalysisResult,
    columnKey: AccumulatedFixedColumnKey,
    displayNum: number
  ) => {
    if (columnKey === 'no') return displayNum;
    if (columnKey === 'reportNo') return toAccumulatedCellText(row.Report_No);
    if (columnKey === 'companyName') return toAccumulatedCellText(row.company_name);
    if (columnKey === 'companyDomain') return toAccumulatedCellText(row.company_domain);
    if (columnKey === 'releaseDate') return formatIssuedDate(getAccumulatedIssuedDate(row));
    if (columnKey === 'productPlatform') return toAccumulatedCellText(row.productPlatform);
    if (columnKey === 'productName') {
      return (
        <div className="relative inline-block group/product">
          <span className="cursor-pointer">
            {toAccumulatedCellText(row.productName)}
          </span>
          <div className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 bottom-full mb-2 w-[30vw] rounded-md bg-sky-100 px-2 py-1 text-sm leading-snug text-black shadow-lg opacity-0 transition-opacity duration-150 group-hover/product:opacity-100">
            <div className="whitespace-pre-wrap break-words">{toAccumulatedCellText(row.overview, '개요 없음')}</div>
          </div>
        </div>
      );
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#eef4ff_32%,_#f8fafc_58%,_#ffffff_100%)] text-[#141414] font-['SUIT','Pretendard','Noto_Sans_KR',sans-serif] p-3 md:p-5">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#60a5fa]/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#22d3ee]/15 blur-3xl" />
      </div>
      <div className="w-[95vw] max-w-none mx-auto text-[#1e3a8a]">
        {/* Header */}
        <header className="mb-6 rounded-3xl border border-[#1e3a8a]/15 bg-white/80 backdrop-blur-sm shadow-xl shadow-[#93c5fd]/20 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-[#2563eb]/35">
                  <FileText className="w-6 h-6" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1e208a]">{activeTabLabel}</h1>
              </div>
              <p className="text-[#1e208a]/75 text-sm md:text-base font-medium ml-14">
                {activeTabDescription}
              </p>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex items-center gap-2 self-start md:self-auto">
                {loginId && (
                  <span className="text-sm px-1">
                    <b style={{ color: '#1d4ed8' }}>{loginId}</b> 님이 로그인하였습니다.
                  </span>
                )}
                | <button
                  onClick={handleLogout}
                  className="text-sm font-bold text-[#6b7280] hover:text-[#4b5563] transition-colors cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
<br></br>
              {/* Navigation Tabs */}
              <nav className="flex flex-wrap bg-[#eff6ff] p-1 rounded-2xl border border-[#bfdbfe]">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer
                    ${activeTab === 'summary' 
                      ? 'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/30' 
                      : 'text-[#1e40af]/75 hover:text-[#1e40af] hover:bg-white'}
                  `}
                >
                  <TableIcon className="w-4 h-4" />
                  시험 분석결과
                </button>
                <button
                  onClick={() => setActiveTab('accumulated')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all relative cursor-pointer
                    ${activeTab === 'accumulated' 
                      ? 'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/30' 
                      : 'text-[#1e40af]/75 hover:text-[#1e40af] hover:bg-white'}
                  `}
                >
                  <Database className="w-4 h-4" />
                  누적 결과 확인
                  {accumulatedResults.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#E4E3E0]">
                      {accumulatedResults.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('analyze')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer
                    ${activeTab === 'analyze' 
                      ? 'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/30' 
                      : 'text-[#1e40af]/75 hover:text-[#1e40af] hover:bg-white'}
                  `}
                >
                  <Search className="w-4 h-4" />
                  성적서 분석
                </button>
              </nav>
            </div>
          </div>


        </header>

        <main className="space-y-6">
          <AnimatePresence>
            {isPromptModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-[#141414]/10 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-[#141414]/10 bg-[#2563eb] text-white flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">분석 프롬프트 확인</h2>
                      <p className="text-sm text-white/70">내용을 수정한 뒤 분석을 실행할 수 있습니다.</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <textarea
                      value={promptDraft}
                      onChange={e => setPromptDraft(e.target.value)}
                      className="w-full min-h-[420px] rounded-xl border border-[#141414]/15 p-4 text-sm leading-6 text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div className="px-6 py-4 border-t border-[#141414]/10 bg-[#141414]/[0.02] flex items-center justify-end gap-3">
                    <button
                      onClick={() => setIsPromptModalOpen(false)}
                      disabled={loading}
                      className="px-5 py-3 rounded-lg border border-[#141414]/15 text-[#141414] font-bold hover:bg-[#141414]/5 transition-all disabled:opacity-50"
                    >
                      닫기
                    </button>
                    <button
                      onClick={runAnalysisWithPrompt}
                      disabled={loading || !promptDraft.trim()}
                      className={`px-5 py-3 rounded-lg font-bold text-white transition-all ${loading || !promptDraft.trim() ? 'bg-[#2563eb]/40 cursor-not-allowed' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'}`}
                    >
                      {loading ? '분석 중...' : '분석'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {isInsertQueryModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-[#141414]/10 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-[#141414]/10 bg-[#1e3a8a] text-white">
                    <h2 className="text-xl font-bold">누적 저장 쿼리 확인</h2>
                    <p className="text-sm text-white/80">결과 누적 시 실행될 INSERT 쿼리 미리보기입니다.</p>
                  </div>
                  <div className="p-6">
                    <pre className="w-full min-h-[320px] max-h-[460px] overflow-auto rounded-xl border border-[#141414]/15 bg-[#0f172a] text-[#e2e8f0] p-4 text-xs leading-6 whitespace-pre-wrap">
{insertQueryPreview || '-- 표시할 쿼리가 없습니다.'}
                    </pre>
                  </div>
                  <div className="px-6 py-4 border-t border-[#141414]/10 bg-[#141414]/[0.02] flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsInsertQueryModalOpen(false);
                        setInsertQueryPreview('');
                        setCopyQueryMessage('');
                        setPendingInsertPayload([]);
                        setPendingSummaryPayload(null);
                      }}
                      disabled={savingAccumulated}
                      className="px-5 py-3 rounded-lg border border-[#141414]/15 text-[#141414] font-bold hover:bg-[#141414]/5 transition-all disabled:opacity-50"
                    >
                      닫기
                    </button>
                    <button
                      onClick={copyInsertQueryPreview}
                      disabled={!insertQueryPreview.trim() || savingAccumulated}
                      className={`px-5 py-3 rounded-lg font-bold transition-all ${
                        !insertQueryPreview.trim() || savingAccumulated
                          ? 'bg-[#1e3a8a]/20 text-[#1e3a8a]/50 cursor-not-allowed'
                          : 'bg-[#1e3a8a] text-white hover:bg-[#172554]'
                      }`}
                    >
                      쿼리 복사
                    </button>
                    <button
                      onClick={confirmAddToAccumulated}
                      disabled={savingAccumulated || pendingInsertPayload.length === 0}
                      className={`px-5 py-3 rounded-lg font-bold text-white transition-all ${
                        savingAccumulated || pendingInsertPayload.length === 0
                          ? 'bg-[#2563eb]/40 cursor-not-allowed'
                          : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
                      }`}
                    >
                      {savingAccumulated ? '저장 중...' : '저장 실행'}
                    </button>
                  </div>
                  {copyQueryMessage && (
                    <div className="px-6 pb-4">
                      <p className="text-sm text-[#1e3a8a]">{copyQueryMessage}</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
            {isExcelPreviewModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="w-full max-w-[96vw] rounded-2xl bg-white shadow-2xl border border-[#141414]/10 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-[#141414]/10 bg-[#1e3a8a] text-white">
                    <h2 className="text-xl font-bold">엑셀 다운로드 미리보기</h2>
                    <p className="text-sm text-white/80">
                      생성 데이터 총 {excelPreviewRows.length.toLocaleString('ko-KR')}건
                      {excelPreviewRows.length > 200 ? ' (미리보기는 상위 200건 표시)' : ''}
                    </p>
                  </div>
                  <div className="p-4">
                    {excelPreviewNoticeMessage && (
                      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        {excelPreviewNoticeMessage}
                      </div>
                    )}
                    <div className="max-h-[62vh] overflow-auto rounded-xl border border-[#141414]/15">
                      {isPreparingExcelPreview ? (
                        <div className="flex min-h-[260px] items-center justify-center px-4 py-10 text-[#1e3a8a]">
                          엑셀 미리보기 데이터를 불러오는 중입니다...
                        </div>
                      ) : excelPreviewErrorMessage ? (
                        <div className="flex min-h-[260px] items-center justify-center px-4 py-10 text-center text-red-700">
                          {excelPreviewErrorMessage}
                        </div>
                      ) : (
                        <table className="min-w-full border-collapse text-sm text-[#141414]">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-[#eff6ff]">
                              {EXCEL_EXPORT_COLUMNS.map((column) => (
                                <th key={column.header} className="whitespace-nowrap border border-[#bfdbfe] px-2 py-2 text-left font-bold text-[#1e3a8a]">
                                  {column.header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {excelPreviewRows.slice(0, 200).map((row, index) => (
                              <tr key={`excel-preview-row-${index}`} className="odd:bg-white even:bg-[#f8fafc]">
                                {EXCEL_EXPORT_COLUMNS.map((column) => (
                                  <td key={`${index}-${column.header}`} className="border border-[#e2e8f0] px-2 py-1.5 align-top">
                                    {String(row[column.header] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#141414]/10 bg-[#141414]/[0.02] flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsExcelPreviewModalOpen(false);
                        setExcelPreviewErrorMessage('');
                        setExcelPreviewNoticeMessage('');
                        setExcelPreviewRows([]);
                      }}
                      className="px-5 py-3 rounded-lg border border-[#141414]/15 text-[#141414] font-bold hover:bg-[#141414]/5 transition-all"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => {
                        downloadExcelFile(excelPreviewRows);
                        setIsExcelPreviewModalOpen(false);
                        setExcelPreviewErrorMessage('');
                        setExcelPreviewNoticeMessage('');
                        setExcelPreviewRows([]);
                      }}
                      disabled={isPreparingExcelPreview || excelPreviewRows.length === 0 || Boolean(excelPreviewErrorMessage)}
                      className={`px-5 py-3 rounded-lg font-bold text-white transition-all ${
                        isPreparingExcelPreview || excelPreviewRows.length === 0 || Boolean(excelPreviewErrorMessage)
                          ? 'bg-[#2563eb]/40 cursor-not-allowed'
                          : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
                      }`}
                    >
                      엑셀 다운로드
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'analyze' ? (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Upload Section */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-2xl border border-[#bfdbfe] bg-white/85 shadow-lg shadow-[#bfdbfe]/20 p-3">
                    {canUseAnalysisModeToggle && (
                      <div className="mb-2 flex justify-end">
                        <button
                          onClick={() => setQuickAnalysisMode(prev => !prev)}
                          className={`shrink-0 h-10 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            quickAnalysisMode
                              ? 'bg-[#dbeafe] border-[#93c5fd] text-[#1e3a8a]'
                              : 'bg-white border-[#cbd5e1] text-[#475569]'
                          }`}
                        >
                          {quickAnalysisMode ? '빠른 분석 ON' : '정밀 분석 ON'}
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-10 items-stretch gap-2">
                      <div
                        {...getRootProps()}
                        className={`
                          col-span-6 min-w-0 self-stretch border-2 border-dashed rounded-xl transition-all cursor-pointer
                          flex ${file ? 'min-h-[72px] px-3 py-2 flex-col items-center justify-center gap-1' : 'min-h-[72px] px-3 py-2 flex-col items-center justify-center gap-1.5'}
                          ${isDragActive ? 'border-[#1e40af] bg-[#dbeafe]/45' : 'border-[#93c5fd] bg-white/80 hover:border-[#1d4ed8] hover:bg-[#eff6ff]/60'}
                          ${file ? 'border-solid border-[#1d4ed8]/40 bg-[#eff6ff]/65' : ''}
                        `}
                      >
                        <input {...getInputProps()} />
                        <div className="w-7 h-7 bg-gradient-to-br from-[#2563eb] to-[#1e3a8a] rounded-lg flex items-center justify-center text-white shadow-sm shadow-[#2563eb]/30 shrink-0">
                          {file ? (
                            file.type.includes('word') ? <FileCode className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </div>
                        {file ? (
                          <div className="min-w-0 text-center leading-tight">
                            <p className="font-bold text-[#1e3a8a] text-[1.05rem] truncate">
                              업로드 파일: {uploadedFileSummary}
                            </p>
                          </div>
                        ) : (
                          <div className="min-w-0  text-[#1e3a8a] text-center text-[1.05rem] leading-tight">
                            성적서 PDF / Word 업로드 (추가 또는 클릭)
                          </div>
                        )}
                      </div>

                      <button
                        onClick={analyzeReport}
                        disabled={!file || loading || preparingPrompt}
                        className={`
                          col-span-3 min-h-[72px] w-full px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer
                          ${!file || loading || preparingPrompt
                            ? 'bg-[#2563eb]/10 text-[#2563eb]/30 cursor-not-allowed'
                            : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md shadow-[#2563eb]/30'}
                        `}
                      >
                        {preparingPrompt ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            준비 중...
                          </>
                        ) : loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            분석 중...
                          </>
                        ) : (
                          '분석 시작'
                        )}
                      </button>

                      <button
                        onClick={resetAnalyzePage}
                        disabled={!file || loading || preparingPrompt}
                        className={`col-span-1 min-h-[72px] w-full px-2 border rounded-xl font-bold transition-all text-sm ${
                          !file || loading || preparingPrompt
                            ? 'border-[#cbd5e1] bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'
                            : 'border-[#93c5fd] bg-white text-[#1e3a8a] hover:bg-[#eff6ff] cursor-pointer'
                        }`}
                      >
                        초기화
                      </button>
                    </div>

                    {error && (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-xs leading-relaxed">{error}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl overflow-hidden shadow-lg shadow-[#2563eb]/20 border border-[#2563eb]/30">
                    <div className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white p-3 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <TableIcon className="w-4 h-4" />
                        <span className="font-bold uppercase tracking-widest text-m">분석 결과</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={openInsertQueryModal}
                          disabled={!results?.length || savingAccumulated}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all shadow-lg border outline-none focus:ring-2 focus:ring-[#14308a] ${
                            !results?.length || savingAccumulated
                              ? 'bg-white/30 text-white/70 border-white/40 cursor-not-allowed'
                              : 'cursor-pointer bg-white text-[#1e3a8a] border-white/70 hover:bg-[#eff6ff]'
                          }`}
                        >
                          <PlusCircle className="w-4 h-4" />
                          결과 누적하기
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-white/85 border-t border-[#bfdbfe]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs tracking-[0.12em] uppercase text-[#1e40af]/60 font-bold">기관 정보 요약</p>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-1.5 text-sm">
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">접수 번호</p>
                          <p className="font-semibold text-[#0f172a] truncate">{receiptNumber || '-'}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">시험성적서 번호</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.reportNo}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">시험성적서 구분</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.reportType}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">실무자</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.practitioner}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">기관명</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.company_name}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">기관 도메인</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.organizationDomain}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">제품명</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.productName}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">플랫폼</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.platform}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">주요 기술분야</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.mainTechField}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">신청일자</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.applicationDate}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">수행일자</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.executionDate}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">발급일자</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.issuedAt}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <p className="text-[11px] text-[#64748b]">시험항목 수</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.itemCount}</p>
                        </div>
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 md:col-span-3">
                          <p className="text-[11px] text-[#64748b]">개요</p>
                          <p className="font-semibold text-[#0f172a] truncate">{companySummary.overview}</p>
                        </div>
                      </div>
                      {isAdminMember && (
                        <div className="mt-3">
                          <p className="text-xs tracking-[0.12em] uppercase text-[#1e40af]/60 font-bold">추가 입력 사항</p>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 text-sm">
                            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                              <p className="text-[11px] text-[#64748b]">제출처</p>
                              <input
                                type="text"
                                value={submissionOffice}
                                onChange={(event) => setSubmissionOffice(event.target.value)}
                                placeholder="제출처 입력"
                                className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-2 py-1.5 text-sm font-semibold text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#bfdbfe]"
                              />
                            </div>
                            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                              <p className="text-[11px] text-[#64748b]">참여사업명</p>
                              <input
                                type="text"
                                value={participatingProjectName}
                                onChange={(event) => setParticipatingProjectName(event.target.value)}
                                placeholder="참여사업명 입력"
                                className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-2 py-1.5 text-sm font-semibold text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#bfdbfe]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                </div>

                {/* Result Section */}
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {results ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#141414]/10"
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[#141414] text-base">
                            <colgroup>
                              <col /> {/* NO */}
                              {ANALYZE_VISIBLE_FIELDS.map((key) => (
                                <col key={key} />
                              ))}
                            </colgroup>
                            <thead>
                              <tr className="bg-[#2563eb]/10 border-b border-[#2563eb]/30">
                                <th className="px-3 py-2.5 text-sm font-normal text-[#141414] bg-[#141414]/5 border-r border-[#141414]/10 text-center whitespace-nowrap">No</th>
                                {ANALYZE_VISIBLE_FIELDS.map((key) => (
                                  <th key={key} className="px-3 py-2.5 text-sm font-normal text-[#141414] bg-[#141414]/5 border-r border-[#141414]/10 last:border-r-0 text-center whitespace-nowrap">
                                    {RESULT_FIELD_LABELS[key]}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#141414]/10">
                              {results.map((row, idx) => (
                                <tr key={idx} className="hover:bg-[#141414]/5 transition-colors group">
                                  <td className="px-3 py-2 text-sm leading-snug border-r border-[#141414]/10 align-top">
                                    {HIDDEN_ROW_FIELDS.map((fieldKey) => (
                                      <input
                                        key={`${fieldKey}-${idx}`}
                                        type="hidden"
                                        name={`results[${idx}].${fieldKey}`}
                                        value={String(row[fieldKey] ?? '')}
                                        readOnly
                                      />
                                    ))}
                                    {idx + 1}
                                  </td>
                                  {ANALYZE_VISIBLE_FIELDS.map((key) => (
                                      <td key={key} className={`px-3 py-2 text-sm leading-snug border-r border-[#141414]/10 last:border-r-0 align-top ${key === 'overview' ? 'max-w-[280px]' : ''}`}>
                                        <div className="whitespace-pre-wrap">
                                          {key === 'testResult'
                                            ? formatTestResultForDisplay(row[key])
                                            : getListFieldDisplayValue(row, key)}
                                        </div>
                                      </td>
                                    ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full min-h-75 border-2 border-dashed border-[#bfdbfe] bg-white/70 rounded-2xl flex flex-col items-center justify-center text-[#1e3a8a]/40">
                        {loading ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[#bfdbfe] border-t-[#2563eb] rounded-full animate-spin" />
                            <p className="font-medium">데이터를 추출하고 있습니다...</p>
                          </div>
                        ) : (
                          <>
                            <TableIcon className="w-12 h-12 mb-4 opacity-30" />
                            
                          </>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>
            ) : activeTab === 'accumulated' ? (
              <motion.div
                key="accumulated"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="rounded-2xl border border-[#bfdbfe] bg-white/80 backdrop-blur-sm p-2.5 md:p-3">
                  <div className="mb-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff]/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#1e3a8a]">노출 항목 설정</p>
                      <button
                        type="button"
                        onClick={resetAccumulatedColumnVisibility}
                        className="rounded-lg border border-[#93c5fd] bg-white px-2.5 py-1 text-xs font-semibold text-[#1e3a8a] transition-colors hover:bg-[#dbeafe] cursor-pointer"
                      >
                        기본값 적용
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {ACCUMULATED_COLUMN_SELECTOR_OPTIONS.map((option) => (
                        <label
                          key={String(option.key)}
                          className="flex items-center gap-2 rounded-md border border-[#dbeafe] bg-white px-2 py-1 text-xs text-[#1e3a8a] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visibleAccumulatedColumnKeys.has(option.key)}
                            onChange={() => toggleAccumulatedColumnVisibility(option.key)}
                            className="h-3.5 w-3.5"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 보고서 종류 필터 */}
                    <select
                      className="border border-[#bfdbfe] bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={reportTypeFilter}
                      onChange={e => {
                        setReportTypeFilter(e.target.value as any);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">보고서 종류 (전체)</option>
                      <option value="AI">AI</option>
                      <option value="일반">일반</option>
                      <option value="KOLAS">KOLAS</option>
                      <option value="KOLAS AI">KOLAS AI</option>
                    </select>

                    {/* 발급년도 필터 */}
                    <select
                      className="border border-[#bfdbfe] bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={yearFilter}
                      onChange={e => {
                        setYearFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">발급년도 (전체)</option>
                      {Array.from({ length: new Date().getFullYear() - 2020 }, (_, i) => (2021 + i).toString()).map(year => (
                        <option key={year} value={year}>{year}년</option>
                      ))}
                    </select>
                    <input
                      className="border border-[#bfdbfe] bg-white rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      type="text"
                      placeholder="검색어를 입력하세요"
                      value={searchInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyAccumulatedSearch();
                        }
                      }}
                      onChange={e => {
                        setSearchInput(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={applyAccumulatedSearch}
                      className="border border-[#bfdbfe] bg-white rounded-xl px-3 py-2 text-sm font-medium text-[#1e3a8a] hover:bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    >
                      검색
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      {accumulatedResults.length > 0 && (
                        <>
                          <button
                            onClick={deleteSelected}
                            className={`px-4 py-2 border border-red-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed text-red-300 bg-white' : 'text-red-700 bg-red-50 hover:bg-red-100'}`}
                            disabled={selectedIds.size === 0}
                          >
                            <Trash2 className="w-4 h-4" />
                            선택 삭제
                          </button>
                          <button
                            onClick={exportToExcel}
                            disabled={isPreparingExcelPreview}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 ${
                              isPreparingExcelPreview
                                ? 'bg-emerald-300 text-white cursor-not-allowed'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                            {isPreparingExcelPreview ? '엑셀 준비 중...' : '엑셀 다운로드'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {accumulatedLoadError && (
                  <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed">{accumulatedLoadError}</p>
                  </div>
                )}
                {accumulatedResults.length > 0 ? (
                  <>
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#141414]/10">
                      <div className="bg-gradient-to-r from-[#1d4ed8] to-[#1e3a8a] text-white p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 right">
                          <TableIcon className="w-5 h-5" />
                          <span className="font-bold uppercase tracking-widest text-sm">
                            {hasActiveAccumulatedFilter
                              ? `총 ${filteredResults.length}개의 시험항목 데이터가 검색되었습니다.`
                              : `전체 : ${accumulatedResults.length}개`}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-hidden">
                          <table className="w-full table-fixed text-left border-collapse text-[#141414] text-base">
                            <colgroup>
                              <col style={{ width: ACCUMULATED_SELECT_COLUMN_WIDTH }} /> {/* 체크박스 */}
                              {visibleAccumulatedFixedColumns.map((column) => (
                                <col key={column.key} style={getAccumulatedFixedColumnWidthStyle(column.key)} />
                              ))}
                              {visibleAccumulatedListFields.map((key) => (
                                <col key={key} />
                              ))}
                            </colgroup>
                          <thead>
                            <tr className="bg-[#2563eb]/10 border-b border-[#2563eb]/30">
                              <th className="px-3 py-2.5 text-sm font-normal text-[#141414] bg-[#141414]/5 border-r border-[#141414]/10 text-center whitespace-normal break-words">
                                <input
                                  type="checkbox"
                                  checked={paginatedResults.length > 0 && paginatedResults.every(r => selectedIds.has(r.id))}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedIds(new Set(paginatedResults.map(r => r.id)));
                                    } else {
                                      setSelectedIds(new Set());
                                    }
                                  }}
                                />
                              </th>
                              {visibleAccumulatedFixedColumns.map((column) => (
                                <th key={column.key} className="px-3 py-2.5 text-sm font-normal text-[#141414] bg-[#141414]/5 border-r border-[#141414]/10 text-center whitespace-normal break-words">
                                  <span className="whitespace-pre-line leading-tight">{formatFieldLabelForDisplay(column.label)}</span>
                                </th>
                              ))}
                              {visibleAccumulatedListFields.map((key) => (
                                <th key={key} className="px-3 py-2.5 text-sm font-normal text-[#141414] bg-[#141414]/5 border-r border-[#141414]/10 last:border-r-0 text-center whitespace-normal break-words">
                                  {RESULT_FIELD_LABELS[key]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#141414]/10">
                            {paginatedResults.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={1 + visibleAccumulatedFixedColumns.length + visibleAccumulatedListFields.length}
                                  className="p-6 text-center align-middle text-sm text-[#141414]/50"
                                >
                                  데이터가 없습니다.
                                </td>
                              </tr>
                            ) : (
                              paginatedResults.map((row, idx) => {
                                const displayNum = accumulatedGroupNoByRowId[row.id];
                                const currentReportNo = typeof row.Report_No === 'string' ? row.Report_No.trim() : '';
                                const previousReportNo = idx > 0 && typeof paginatedResults[idx - 1]?.Report_No === 'string'
                                  ? paginatedResults[idx - 1].Report_No!.trim()
                                  : '';
                                const isGroupBoundary = idx > 0 && currentReportNo !== previousReportNo;
                                const groupBoundaryClass = isGroupBoundary ? 'border-t-[3px] border-t-[#94a3b8]' : '';
                                return (
                                <tr key={row.id} className="hover:bg-[#141414]/5 transition-colors group">
                                  <td className={`px-3 py-2 text-sm leading-snug border-r border-[#141414]/10 align-middle ${groupBoundaryClass}`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(row.id)}
                                      onChange={e => {
                                        setSelectedIds(prev => {
                                          const next = new Set(prev);
                                          if (e.target.checked) next.add(row.id);
                                          else next.delete(row.id);
                                          return next;
                                        });
                                      }}
                                    />
                                  </td>
                                  {visibleAccumulatedFixedColumns.map((column) => (
                                    <td key={column.key} className={`px-3 py-2 text-sm leading-snug border-r border-[#141414]/10 align-middle ${groupBoundaryClass}`}>
                                      {renderAccumulatedFixedColumnCell(row, column.key, displayNum)}
                                    </td>
                                  ))}
                                  {visibleAccumulatedListFields.map((key, fieldIndex) => (
                                      <td key={key} className={`px-3 py-2 text-sm leading-snug border-r border-[#141414]/10 last:border-r-0 align-middle ${key === 'overview' ? 'max-w-[280px]' : ''} ${groupBoundaryClass}`}>
                                        {fieldIndex === 0 && HIDDEN_ROW_FIELDS.map((fieldKey) => (
                                          <input
                                            key={`${fieldKey}-${row.id}`}
                                            type="hidden"
                                            name={`accumulated[${row.id}].${fieldKey}`}
                                            value={String(row[fieldKey] ?? '')}
                                            readOnly
                                          />
                                        ))}
                                        <div className="whitespace-pre-wrap">
                                          {key === 'testResult'
                                            ? formatTestResultForDisplay(row[key])
                                            : getListFieldDisplayValue(row, key)}
                                        </div>
                                      </td>
                                    ))}
                                </tr>
                              );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 0 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span
                        role="link"
                        tabIndex={currentPage === 1 ? -1 : 0}
                        onClick={() => {
                          if (currentPage !== 1) setCurrentPage(Math.max(1, currentPage - 1));
                        }}
                        onKeyDown={e => {
                          if (currentPage === 1) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setCurrentPage(Math.max(1, currentPage - 1));
                          }
                        }}
                        className={`px-2 py-1 text-sm transition-all ${currentPage === 1 ? 'text-[#9ca3af] cursor-default' : 'text-[#141414] cursor-pointer hover:underline'}`}
                      >
                        이전
                      </span>
                       
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <span
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setCurrentPage(page);
                              }
                            }}
                            role="link"
                            tabIndex={0}
                            className={`
                              px-2 py-1 text-sm font-bold transition-all
                              ${currentPage === page 
                                ? 'text-[#2563eb] underline' 
                                : 'text-[#141414] hover:underline cursor-pointer'}
                            `}
                          >
                            {page}
                          </span>
                        ))}
                      </div>
                       
                      <span
                        role="link"
                        tabIndex={currentPage === totalPages ? -1 : 0}
                        onClick={() => {
                          if (currentPage !== totalPages) setCurrentPage(Math.min(totalPages, currentPage + 1));
                        }}
                        onKeyDown={e => {
                          if (currentPage === totalPages) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setCurrentPage(Math.min(totalPages, currentPage + 1));
                          }
                        }}
                        className={`px-2 py-1 text-sm transition-all ${currentPage === totalPages ? 'text-[#9ca3af] cursor-default' : 'text-[#141414] cursor-pointer hover:underline'}`}
                      >
                        다음
                      </span>
                    </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#141414]/10">
                    <div className="bg-gradient-to-r from-[#1d4ed8] to-[#1e3a8a] text-white p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TableIcon className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-widest text-sm">
                          {hasActiveAccumulatedFilter
                            ? `총 ${filteredResults.length}개의 시험항목 데이터가 검색되었습니다.`
                            : `전체 : ${accumulatedResults.length}개`}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-hidden">
                      <table className="w-full table-fixed text-left border-collapse text-[#141414] text-base">
                        <colgroup>
                          {visibleAccumulatedFixedColumns.map((column) => (
                            <col key={column.key} style={getAccumulatedFixedColumnWidthStyle(column.key)} />
                          ))}
                          {visibleAccumulatedListFields.map((key) => (
                            <col key={key} />
                          ))}
                        </colgroup>
                        <thead>
                          <tr className="bg-[#2563eb]/10 border-b border-[#2563eb]/30">
                            {visibleAccumulatedFixedColumns.map((column) => (
                              <th key={column.key} className="px-3 py-2.5 text-sm font-normal text-[#141414] bg-[#141414]/5 border-r border-[#141414]/10 text-center whitespace-normal break-words">
                                <span className="whitespace-pre-line leading-tight">{formatFieldLabelForDisplay(column.label)}</span>
                              </th>
                            ))}
                            {visibleAccumulatedListFields.map((key) => (
                              <th key={key} className="px-3 py-2.5 text-sm font-normal text-[#141414] bg-[#141414]/5 border-r border-[#141414]/10 last:border-r-0 text-center whitespace-normal break-words">
                                {RESULT_FIELD_LABELS[key]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              colSpan={visibleAccumulatedFixedColumns.length + visibleAccumulatedListFields.length}
                              className="p-6 text-center align-middle text-sm text-[#141414]/50"
                            >
                              데이터가 없습니다.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'summary' ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <AnalysisSummary results={results} accumulatedResults={accumulatedResults} isAdminMember={isAdminMember} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-14 pt-6 border-t border-[#141414]/10 text-[10px] uppercase tracking-[0.2em] text-[#141414]/40 flex justify-between items-center">
          <span className="text-[#1e3a8a]/60"></span>
        </footer>
      </div>
    </div>
  );
}

// --- 분석결과 요약 컴포넌트 ---
type AnalysisSummaryProps = {
  results: AnalysisResult[] | null;
  accumulatedResults: AnalysisResult[];
  isAdminMember?: boolean;
  forcedMode?: 'organization' | 'testItem';
  sharedSelectedSections?: Record<ReportSectionKey, boolean>;
  onToggleSection?: (section: ReportSectionKey) => void;
  onRegisterSectionRef?: (section: ReportSectionKey, node: HTMLDivElement | null) => void;
  sharedYearFilter?: string;
  onSharedYearFilterChange?: (value: string) => void;
  hideTopBar?: boolean;
  onCardDragStart?: (mode: SummaryMode, section: ReportSectionKey, event: React.DragEvent<HTMLElement>) => void;
  queuedSectionKeys?: Set<string>;
};

type ReportSectionKey = 'yearly' | 'monthly' | 'domain' | 'platform' | 'mainTech' | 'aiTech';
type SummaryMode = 'organization' | 'testItem';
type AxisRangeSectionKey = 'yearly' | 'monthly';
type CustomChartKind = 'line' | 'bar' | 'doughnut';
type AxisRangeSetting = {
  chartType: 'line' | 'bar';
  xStart: string;
  xEnd: string;
  yStart: string;
  yEnd: string;
};

const createDefaultAxisRangeSetting = (): AxisRangeSetting => ({
  chartType: 'line',
  xStart: '',
  xEnd: '',
  yStart: '0',
  yEnd: '200'
});

const REPORT_SECTION_ORDER: ReportSectionKey[] = ['yearly', 'monthly', 'domain', 'platform', 'mainTech', 'aiTech'];

const REPORT_SECTION_PDF_LABELS: Record<ReportSectionKey, string> = {
  yearly: 'Yearly',
  monthly: 'Monthly',
  domain: 'Domain',
  platform: 'Platform',
  mainTech: 'Main Tech Field',
  aiTech: 'AI Tech Recommendation'
};

const SECTION_TITLE_BY_MODE: Record<SummaryMode, Record<ReportSectionKey, string>> = {
  organization: {
    yearly: '연도별 기관 수',
    monthly: '월별 기관 수',
    domain: '기관별 대표 도메인',
    platform: '기관별 플랫폼',
    mainTech: '기관별 주요기술 분야',
    aiTech: '적용기술(AI)추천별'
  },
  testItem: {
    yearly: '연도별 시험항목 수',
    monthly: '월별 시험항목 수',
    domain: '시험항목별 대표 도메인',
    platform: '시험항목별 플랫폼',
    mainTech: '시험항목별 주요기술 분야',
    aiTech: '시험항목별 적용기술(AI)추천'
  }
};

const SUMMARY_MODE_PDF_LABELS: Record<SummaryMode, string> = {
  organization: 'Organization Analysis',
  testItem: 'Test Item Analysis'
};

const CUSTOM_CHART_FIELD_OPTIONS_BY_MODE: Record<SummaryMode, Array<{ key: string; label: string }>> = {
  organization: [
    { key: 'Report_No', label: '보고서 번호' },
    { key: 'representativeDomain', label: '대표 도메인' },
    { key: 'platform', label: '플랫폼' },
    { key: 'mainTechField', label: '주요기술 분야' },
    { key: 'AI_Tech', label: '적용기술(AI)추천' }
  ],
  testItem: [
    { key: 'Test_Item', label: '시험항목' },
    { key: 'qualityCharacteristic', label: '시험항목별 품질특성' },
    { key: 'representativeDomain', label: '대표 도메인' },
    { key: 'platform', label: '플랫폼' },
    { key: 'mainTechField', label: '주요기술 분야' },
    { key: 'AI_Domain', label: '도메인(AI)추천' },
    { key: 'AI_Tech', label: '적용기술(AI)추천' },
    { key: 'company_domain', label: '기관 도메인' },
    { key: 'company_name', label: '기관명' },
    { key: 'productName', label: '제품명' }
  ]
};

type GeneratedCustomChartSpec = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  chartKind: CustomChartKind;
};

function AnalysisSummary({
  results,
  accumulatedResults,
  isAdminMember,
  forcedMode,
  sharedSelectedSections,
  onToggleSection,
  onRegisterSectionRef,
  sharedYearFilter,
  onSharedYearFilterChange,
  hideTopBar,
  onCardDragStart,
  queuedSectionKeys
}: AnalysisSummaryProps) {
  const [summaryYearFilter, setSummaryYearFilter] = React.useState<string>('all');
  const [summarySubTab, setSummarySubTab] = React.useState<'organization' | 'testItem'>(forcedMode || 'organization');
  const [selectedReportSections, setSelectedReportSections] = React.useState<Record<ReportSectionKey, boolean>>({
    yearly: true,
    monthly: true,
    domain: true,
    platform: true,
    mainTech: true,
    aiTech: true
  });
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const reportSectionRefs = React.useRef<Record<ReportSectionKey, HTMLDivElement | null>>({
    yearly: null,
    monthly: null,
    domain: null,
    platform: null,
    mainTech: null,
    aiTech: null
  });
  const isSplitRoot = !forcedMode;
  const isForcedMode = Boolean(forcedMode);
  const [splitReportQueue, setSplitReportQueue] = React.useState<Array<{ mode: SummaryMode; section: ReportSectionKey }>>([]);
  const [isSplitGeneratingReport, setIsSplitGeneratingReport] = React.useState(false);
  const [splitYearFilter, setSplitYearFilter] = React.useState<string>('all');
  const [splitCardTab, setSplitCardTab] = React.useState<SummaryMode>('organization');
  const splitCardTabRef = React.useRef<SummaryMode>('organization');
  const [axisRangeSettings, setAxisRangeSettings] = React.useState<Record<SummaryMode, Record<AxisRangeSectionKey, AxisRangeSetting>>>(() => ({
    organization: {
      yearly: createDefaultAxisRangeSetting(),
      monthly: createDefaultAxisRangeSetting()
    },
    testItem: {
      yearly: createDefaultAxisRangeSetting(),
      monthly: createDefaultAxisRangeSetting()
    }
  }));
  const [axisSettingModalTarget, setAxisSettingModalTarget] = React.useState<{ mode: SummaryMode; section: AxisRangeSectionKey } | null>(null);
  const [axisSettingDraft, setAxisSettingDraft] = React.useState<AxisRangeSetting>(createDefaultAxisRangeSetting());
  const [isSplitDropActive, setIsSplitDropActive] = React.useState(false);
  const splitReportSectionRefs = React.useRef<Record<SummaryMode, Record<ReportSectionKey, HTMLDivElement | null>>>({
    organization: {
      yearly: null,
      monthly: null,
      domain: null,
      platform: null,
      mainTech: null,
      aiTech: null
    },
    testItem: {
      yearly: null,
      monthly: null,
      domain: null,
      platform: null,
      mainTech: null,
      aiTech: null
    }
  });
  const [customChartSpecsByMode, setCustomChartSpecsByMode] = React.useState<Record<SummaryMode, GeneratedCustomChartSpec[]>>({
    organization: [],
    testItem: []
  });
  const [customChartDraftByMode, setCustomChartDraftByMode] = React.useState<Record<SummaryMode, { fieldKey: string; chartKind: CustomChartKind }>>(() => ({
    organization: {
      fieldKey: CUSTOM_CHART_FIELD_OPTIONS_BY_MODE.organization[0]?.key || '',
      chartKind: 'bar'
    },
    testItem: {
      fieldKey: CUSTOM_CHART_FIELD_OPTIONS_BY_MODE.testItem[0]?.key || '',
      chartKind: 'bar'
    }
  }));

  React.useEffect(() => {
    if (!forcedMode) return;
    setSummarySubTab(forcedMode);
  }, [forcedMode]);

  React.useEffect(() => {
    splitCardTabRef.current = splitCardTab;
  }, [splitCardTab]);

  const openAxisSettingModal = (mode: SummaryMode, section: AxisRangeSectionKey) => {
    setAxisSettingDraft({ ...axisRangeSettings[mode][section] });
    setAxisSettingModalTarget({ mode, section });
  };

  const closeAxisSettingModal = () => {
    setAxisSettingModalTarget(null);
  };

  const saveAxisSettingModal = () => {
    if (!axisSettingModalTarget) return;
    const { mode, section } = axisSettingModalTarget;
    setAxisRangeSettings((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [section]: { ...axisSettingDraft }
      }
    }));
    closeAxisSettingModal();
  };

  const effectiveYearFilter = sharedYearFilter ?? summaryYearFilter;
  const setEffectiveYearFilter = onSharedYearFilterChange ?? setSummaryYearFilter;

  const toTrimmedText = (...values: Array<string | undefined>) => {
    for (const value of values) {
      const text = (value || '').trim();
      if (text) return text;
    }
    return '';
  };

  const buildOrganizationRows = React.useCallback((sourceRows: AnalysisResult[]) => {
    const grouped = new Map<string, {
      id: number;
      reportNo: string;
      createdAt: string;
      representativeDomains: Set<string>;
      platforms: Set<string>;
      mainTechFields: Set<string>;
      aiTechs: Set<string>;
    }>();

    sourceRows.forEach((row) => {
      const reportNo = toTrimmedText(row.Report_No) || `미지정-${row.id}`;

      if (!grouped.has(reportNo)) {
        grouped.set(reportNo, {
          id: row.id,
          reportNo,
          createdAt: row.created_at || '',
          representativeDomains: new Set<string>(),
          platforms: new Set<string>(),
          mainTechFields: new Set<string>(),
          aiTechs: new Set<string>()
        });
      }

      const current = grouped.get(reportNo)!;
      current.id = Math.min(current.id, row.id);

      const representativeDomain = toTrimmedText(row.company_domain, row.representativeDomain);
      const platform = toTrimmedText(row.productPlatform, row.platform);
      const mainTechField = toTrimmedText(row.mainTechField);
      const aiTech = toTrimmedText(row.AI_Tech);

      if (representativeDomain) current.representativeDomains.add(representativeDomain);
      if (platform) current.platforms.add(platform);
      if (mainTechField) current.mainTechFields.add(mainTechField);
      if (aiTech) current.aiTechs.add(aiTech);

      const currentTime = current.createdAt ? new Date(current.createdAt).getTime() : Number.NEGATIVE_INFINITY;
      const nextTime = row.created_at ? new Date(row.created_at).getTime() : Number.NEGATIVE_INFINITY;
      if (Number.isFinite(nextTime) && nextTime > currentTime) {
        current.createdAt = row.created_at || current.createdAt;
      }
    });

    return Array.from(grouped.values())
      .map((row) => ({
        id: row.id,
        Report_No: row.reportNo,
        created_at: row.createdAt,
        representativeDomain: row.representativeDomains.size > 0 ? Array.from(row.representativeDomains).join(', ') : '기타',
        platform: row.platforms.size > 0 ? Array.from(row.platforms).join(', ') : '기타',
        mainTechField: row.mainTechFields.size > 0 ? Array.from(row.mainTechFields).join(', ') : '기타',
        AI_Tech: row.aiTechs.size > 0 ? Array.from(row.aiTechs).join(', ') : '기타'
      }))
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : Number.NEGATIVE_INFINITY;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : Number.NEGATIVE_INFINITY;
        return bTime - aTime;
      });
  }, []);

  const organizationRowsAll = React.useMemo(
    () => buildOrganizationRows(accumulatedResults),
    [accumulatedResults, buildOrganizationRows]
  );

  const filteredTestItemRows = React.useMemo(() => {
    if (effectiveYearFilter === 'all') {
      return accumulatedResults;
    }
    return accumulatedResults.filter((row) => {
      if (!row.created_at) return false;
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) return false;
      return String(date.getFullYear()) === effectiveYearFilter;
    });
  }, [accumulatedResults, effectiveYearFilter]);

  const filteredOrganizationRows = React.useMemo(() => {
    if (effectiveYearFilter === 'all') {
      return organizationRowsAll;
    }
    return organizationRowsAll.filter((row) => {
      if (!row.created_at) return false;
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) return false;
      return String(date.getFullYear()) === effectiveYearFilter;
    });
  }, [organizationRowsAll, effectiveYearFilter]);

  const activeRowsAll = summarySubTab === 'organization' ? organizationRowsAll : accumulatedResults;
  const activeRows = summarySubTab === 'organization' ? filteredOrganizationRows : filteredTestItemRows;
  const countLabel = summarySubTab === 'organization' ? '기관 수' : '시험항목 수';
  const activeSummaryMode: SummaryMode = summarySubTab === 'organization' ? 'organization' : 'testItem';
  const activeCustomFieldOptions = CUSTOM_CHART_FIELD_OPTIONS_BY_MODE[activeSummaryMode];
  const activeCustomChartSpecs = customChartSpecsByMode[activeSummaryMode];
  const activeCustomChartDraft = customChartDraftByMode[activeSummaryMode];
  const isOrganizationTab = activeSummaryMode === 'organization';
  const areaTitlePrefix = isOrganizationTab ? '기관별' : '시험항목별';
  const getSectionTitle = (section: ReportSectionKey) => SECTION_TITLE_BY_MODE[activeSummaryMode][section];
  const getYearPrefixedPieSectionTitle = (
    section: Extract<ReportSectionKey, 'domain' | 'platform' | 'mainTech' | 'aiTech'>
  ) => (
    effectiveYearFilter === 'all'
      ? getSectionTitle(section)
      : `${effectiveYearFilter}년 ${getSectionTitle(section)}`
  );
  const effectiveSelectedSections = sharedSelectedSections ?? selectedReportSections;
  const availableReportSections = React.useMemo(
    () => (
      summarySubTab === 'testItem'
        ? REPORT_SECTION_ORDER
        : REPORT_SECTION_ORDER.filter((section) => section !== 'aiTech')
    ),
    [summarySubTab]
  );
  const selectedSectionCount = availableReportSections.reduce(
    (count, section) => count + (effectiveSelectedSections[section] ? 1 : 0),
    0
  );

  React.useEffect(() => {
    const firstFieldKey = activeCustomFieldOptions[0]?.key || '';
    if (!firstFieldKey) return;
    if (activeCustomChartDraft?.fieldKey) return;
    setCustomChartDraftByMode((prev) => ({
      ...prev,
      [activeSummaryMode]: {
        ...prev[activeSummaryMode],
        fieldKey: firstFieldKey
      }
    }));
  }, [activeSummaryMode, activeCustomChartDraft?.fieldKey, activeCustomFieldOptions]);

  React.useEffect(() => {
    if (summarySubTab !== 'organization') return;
    setSelectedReportSections((prev) => (
      prev.aiTech
        ? { ...prev, aiTech: false }
        : prev
    ));
  }, [summarySubTab]);

  const handleToggleReportSection = (section: ReportSectionKey) => {
    if (onToggleSection) {
      onToggleSection(section);
      return;
    }
    setSelectedReportSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const setReportSectionRef = (section: ReportSectionKey, node: HTMLDivElement | null) => {
    if (onRegisterSectionRef) {
      onRegisterSectionRef(section, node);
      return;
    }
    reportSectionRefs.current[section] = node;
  };

  const renderSectionControl = (section: ReportSectionKey) => {
    if (isForcedMode && onCardDragStart) {
      const queueKey = `${activeSummaryMode}:${section}`;
      const isQueued = queuedSectionKeys?.has(queueKey) ?? false;
      return (
        <span
          draggable
          onDragStart={(event) => onCardDragStart(activeSummaryMode, section, event)}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold cursor-grab active:cursor-grabbing ${
            isQueued
              ? 'border-[#2563eb] bg-[#dbeafe] text-[#1e3a8a]'
              : 'border-[#cbd5e1] bg-white text-[#334155] hover:bg-[#eff6ff]'
          }`}
          title="리포트 생성 영역으로 추가"
        >
          추가
        </span>
      );
    }

    return (
      <label className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a8a] cursor-pointer">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-[#1d4ed8] cursor-pointer"
          checked={effectiveSelectedSections[section]}
          onChange={() => handleToggleReportSection(section)}
        />
        선택
      </label>
    );
  };

  type ReportExportTarget = { mode: SummaryMode; section: ReportSectionKey };
  type ReportSectionChartData = {
    title: string;
    countLabel: string;
    categoryLabel: string;
    chartType: 'line' | 'bar' | 'pie';
    labels: string[];
    values: number[];
    yMin?: number;
    yMax?: number;
    tableRows: Array<{ label: string; value: number }>;
  };

  const chartPalette = [
    '2563EB', '1E3A8A', 'A8C3FF', 'F59E42', '10B981',
    'F43F5E', '6366F1', 'FBBF24', '14B8A6', '64748B'
  ];

  const getRowsByModeAndYear = React.useCallback((mode: SummaryMode, yearFilterValue: string) => {
    const rowsAll = mode === 'organization' ? organizationRowsAll : accumulatedResults;
    if (yearFilterValue === 'all') {
      return rowsAll;
    }
    return rowsAll.filter((row) => {
      if (!row.created_at) return false;
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) return false;
      return String(date.getFullYear()) === yearFilterValue;
    });
  }, [organizationRowsAll, accumulatedResults]);

  const buildYearMonthStatsForRows = (rows: AnalysisResult[]) => {
    const yearMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    rows.forEach((row) => {
      if (!row.created_at) return;
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) return;
      const year = String(date.getFullYear());
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      yearMap[year] = (yearMap[year] || 0) + 1;
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    return { yearMap, monthMap };
  };

  const applyXAxisRange = (labels: string[], values: number[], setting: AxisRangeSetting) => {
    if (labels.length === 0) return { labels, values };
    const fallbackStart = labels[0];
    const fallbackEnd = labels[labels.length - 1];
    let start = labels.includes(setting.xStart) ? setting.xStart : fallbackStart;
    let end = labels.includes(setting.xEnd) ? setting.xEnd : fallbackEnd;
    let startIndex = labels.indexOf(start);
    let endIndex = labels.indexOf(end);
    if (startIndex > endIndex) {
      [startIndex, endIndex] = [endIndex, startIndex];
      [start, end] = [end, start];
    }
    return {
      labels: labels.slice(startIndex, endIndex + 1),
      values: values.slice(startIndex, endIndex + 1)
    };
  };

  const parseAxisYRange = (values: number[], setting: AxisRangeSetting) => {
    const defaultMin = 0;
    const defaultMax = Math.max(200, ...values, 1);
    const parsedMin = Number(setting.yStart);
    const parsedMax = Number(setting.yEnd);
    const yMin = Number.isFinite(parsedMin) ? parsedMin : defaultMin;
    const yMaxCandidate = Number.isFinite(parsedMax) ? parsedMax : defaultMax;
    const yMax = Math.max(yMaxCandidate, yMin + 1);
    return { yMin, yMax };
  };

  const buildCountMap = (rows: AnalysisResult[], pickLabel: (row: AnalysisResult) => string) => {
    const map: Record<string, number> = {};
    rows.forEach((row) => {
      const label = pickLabel(row).trim() || '기타';
      map[label] = (map[label] || 0) + 1;
    });
    return map;
  };

  const updateActiveCustomChartDraft = (patch: Partial<{ fieldKey: string; chartKind: CustomChartKind }>) => {
    setCustomChartDraftByMode((prev) => ({
      ...prev,
      [activeSummaryMode]: {
        ...prev[activeSummaryMode],
        ...patch
      }
    }));
  };

  const splitCustomFieldTokens = (value: unknown, fieldKey: string) => {
    const text = typeof value === 'string' ? value.trim() : String(value || '').trim();
    if (!text) return [];
    const baseTokens = text
      .split(/\n+|[;|]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
    if (baseTokens.length === 0) return [];

    const commaSplitFields = new Set([
      'representativeDomain',
      'platform',
      'mainTechField',
      'AI_Domain',
      'AI_Tech',
      'company_domain'
    ]);
    if (!commaSplitFields.has(fieldKey)) {
      return baseTokens;
    }

    return baseTokens
      .flatMap((token) => token.split(',').map((item) => item.trim()))
      .filter(Boolean);
  };

  const getCustomFieldRawValue = (row: AnalysisResult, fieldKey: string) => {
    switch (fieldKey) {
      case 'company_domain':
        return row.company_domain || row.representativeDomain || '';
      case 'company_name':
        return row.company_name || '';
      case 'productName':
        return row.productName || '';
      case 'qualityCharacteristic':
        return row.qualityCharacteristic || row.representativeDomain || '';
      default: {
        const raw = (row as unknown as Record<string, unknown>)[fieldKey];
        return raw === null || raw === undefined ? '' : raw;
      }
    }
  };

  const buildCustomChartAggregate = (spec: GeneratedCustomChartSpec) => {
    const counts: Record<string, number> = {};
    activeRows.forEach((row) => {
      const raw = getCustomFieldRawValue(row, spec.fieldKey);
      const tokens = splitCustomFieldTokens(raw, spec.fieldKey);
      if (tokens.length === 0) {
        counts['미기재'] = (counts['미기재'] || 0) + 1;
        return;
      }
      tokens.forEach((token) => {
        counts[token] = (counts[token] || 0) + 1;
      });
    });

    const sortedRows = Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    const topRows = sortedRows.slice(0, 12);
    const labels = topRows.map((row) => row.label);
    const values = topRows.map((row) => row.value);
    return {
      labels,
      values,
      total: values.reduce((sum, value) => sum + value, 0),
      rows: topRows
    };
  };

  const renderedCustomCharts = React.useMemo(() => (
    activeCustomChartSpecs
      .map((spec) => {
        const aggregate = buildCustomChartAggregate(spec);
        if (aggregate.labels.length === 0) return null;
        return { spec, ...aggregate };
      })
      .filter((entry): entry is {
        spec: GeneratedCustomChartSpec;
        labels: string[];
        values: number[];
        total: number;
        rows: Array<{ label: string; value: number }>;
      } => Boolean(entry))
  ), [activeCustomChartSpecs, activeRows]);

  const handleAddCustomChart = () => {
    const selectedFieldKey = (activeCustomChartDraft?.fieldKey || '').trim();
    const selectedChartKind = activeCustomChartDraft?.chartKind || 'bar';
    if (!selectedFieldKey) {
      window.alert('추가 그래프 항목을 선택해 주세요.');
      return;
    }

    const selectedFieldOption = activeCustomFieldOptions.find((option) => option.key === selectedFieldKey);
    const selectedFieldLabel = selectedFieldOption?.label || selectedFieldKey;
    const duplicate = activeCustomChartSpecs.some(
      (item) => item.fieldKey === selectedFieldKey && item.chartKind === selectedChartKind
    );
    if (duplicate) {
      window.alert('이미 같은 항목/그래프 유형으로 생성된 카드가 있습니다.');
      return;
    }

    const idToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCustomChartSpecsByMode((prev) => ({
      ...prev,
      [activeSummaryMode]: [
        ...prev[activeSummaryMode],
        {
          id: `custom-chart-${idToken}`,
          fieldKey: selectedFieldKey,
          fieldLabel: selectedFieldLabel,
          chartKind: selectedChartKind
        }
      ]
    }));
  };

  const handleRemoveCustomChart = (id: string) => {
    setCustomChartSpecsByMode((prev) => ({
      ...prev,
      [activeSummaryMode]: prev[activeSummaryMode].filter((item) => item.id !== id)
    }));
  };

  const toSortedRows = (labels: string[], values: number[]) => (
    labels
      .map((label, index) => ({ label, value: values[index] || 0 }))
      .sort((a, b) => b.value - a.value)
  );

  const buildSectionChartData = (mode: SummaryMode, section: ReportSectionKey, yearFilterValue: string): ReportSectionChartData => {
    const countLabel = mode === 'organization' ? '기관 수' : '시험항목 수';
    const allRows = mode === 'organization' ? organizationRowsAll : accumulatedResults;
    const filteredRows = getRowsByModeAndYear(mode, yearFilterValue);

    if (section === 'yearly' || section === 'monthly') {
      const stats = buildYearMonthStatsForRows(allRows);
      const nowDate = new Date();
      const currentYearValue = nowDate.getFullYear();
      const yearlyLabels = Array.from({ length: currentYearValue - 2021 + 1 }, (_, i) => String(2021 + i));
      const yearlyValues = yearlyLabels.map((label) => stats.yearMap[label] || 0);
      const monthlyLabels = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - 11 + i, 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      });
      const monthlyValues = monthlyLabels.map((label) => stats.monthMap[label] || 0);

      const axisSetting = axisRangeSettings[mode][section];
      const sourceLabels = section === 'yearly' ? yearlyLabels : monthlyLabels;
      const sourceValues = section === 'yearly' ? yearlyValues : monthlyValues;
      const ranged = applyXAxisRange(sourceLabels, sourceValues, axisSetting);
      const labels = ranged.labels.length > 0 ? ranged.labels : sourceLabels;
      const values = ranged.values.length > 0 ? ranged.values : sourceValues;
      const yRange = parseAxisYRange(values, axisSetting);

      return {
        title: SECTION_TITLE_BY_MODE[mode][section],
        countLabel,
        categoryLabel: section === 'yearly' ? '연도' : '월',
        chartType: axisSetting.chartType || 'line',
        labels,
        values,
        yMin: yRange.yMin,
        yMax: yRange.yMax,
        tableRows: labels.map((label, index) => ({ label, value: values[index] || 0 }))
      };
    }

    const labelPickers: Record<ReportSectionKey, (row: AnalysisResult) => string> = {
      yearly: () => '',
      monthly: () => '',
      domain: (row) => row.representativeDomain || '',
      platform: (row) => row.platform || '',
      mainTech: (row) => row.mainTechField || '',
      aiTech: (row) => row.AI_Tech || ''
    };
    const labelNames: Record<ReportSectionKey, string> = {
      yearly: '연도',
      monthly: '월',
      domain: '대표 도메인',
      platform: '플랫폼',
      mainTech: '주요기술 분야',
      aiTech: '적용기술(AI)추천'
    };
    const map = buildCountMap(filteredRows, labelPickers[section]);
    let labels = Object.keys(map);
    let values = labels.map((label) => map[label]);
    if (labels.length === 0) {
      labels = ['데이터 없음'];
      values = [0];
    }
    return {
      title:
        yearFilterValue === 'all'
          ? SECTION_TITLE_BY_MODE[mode][section]
          : `${yearFilterValue}년 ${SECTION_TITLE_BY_MODE[mode][section]}`,
      countLabel,
      categoryLabel: labelNames[section],
      chartType: 'pie',
      labels,
      values,
      tableRows: toSortedRows(labels, values)
    };
  };

  type ReportCardLayout = { x: number; y: number; w: number; h: number };
  const reportModeLabel = (mode: SummaryMode) => (mode === 'organization' ? '기관별 분석' : '시험항목별 분석');
  const REPORT_SLIDE_WIDTH = 13.333;
  const REPORT_SLIDE_HEIGHT = 7.5;
  const formatCount = (value: number) => value.toLocaleString('ko-KR');
  const toPercent = (part: number, total: number) => {
    if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return '0.0';
    return ((part / total) * 100).toFixed(1);
  };
  const getCardNarrative = (data: ReportSectionChartData, section: ReportSectionKey) => {
    const values = data.values.filter((value) => Number.isFinite(value));
    const total = values.reduce((sum, value) => sum + value, 0);
    if (values.length === 0 || total <= 0) {
      return [
        '요약: 현재 선택 조건에서 집계 가능한 데이터가 없습니다.',
        '필터 조건 또는 누적 데이터 상태를 확인해 주세요.'
      ];
    }

    if (section === 'yearly' || section === 'monthly') {
      let peakIndex = 0;
      for (let i = 1; i < data.values.length; i += 1) {
        if ((data.values[i] || 0) > (data.values[peakIndex] || 0)) peakIndex = i;
      }
      const firstValue = data.values[0] || 0;
      const lastValue = data.values[data.values.length - 1] || 0;
      const delta = lastValue - firstValue;
      const deltaText = delta === 0
        ? '변동이 거의 없습니다.'
        : `${delta > 0 ? '증가' : '감소'} 추세(변화량 ${delta > 0 ? '+' : ''}${formatCount(delta)}건)입니다.`;
      return [
        `요약: 기간 내 총 ${formatCount(total)}건이며, 최고 구간은 ${data.labels[peakIndex]} (${formatCount(data.values[peakIndex] || 0)}건)입니다.`,
        `추세: 시작 구간(${data.labels[0]}) 대비 종료 구간(${data.labels[data.labels.length - 1]})은 ${deltaText}`
      ];
    }

    const sorted = [...data.tableRows].sort((a, b) => b.value - a.value);
    const top1 = sorted[0];
    const top2 = sorted[1];
    const top1Share = toPercent(top1.value, total);
    const secondText = top2
      ? `다음은 ${top2.label} (${formatCount(top2.value)}건)입니다.`
      : '다음 순위 항목은 없습니다.';
    return [
      `요약: 총 ${formatCount(total)}건 중 ${top1.label}이(가) ${formatCount(top1.value)}건으로 ${top1Share}%를 차지합니다.`,
      `분포: ${secondText}`
    ];
  };

  const addReportHeaderToSlide = (pptx: PptxGenJS, slide: any, subtitle: string) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: REPORT_SLIDE_WIDTH,
      h: 0.55,
      fill: { color: '1D4ED8' },
      line: { color: '1D4ED8', pt: 0 }
    });
    slide.addText('KOLAS 분석 리포트', {
      x: 0.26,
      y: 0.12,
      w: 6.4,
      h: 0.3,
      bold: true,
      fontFace: '맑은 고딕',
      fontSize: 15,
      color: 'FFFFFF'
    });
    slide.addText(subtitle, {
      x: REPORT_SLIDE_WIDTH - 5.2,
      y: 0.14,
      w: 4.9,
      h: 0.24,
      align: 'right',
      fontFace: '맑은 고딕',
      fontSize: 9,
      color: 'DBEAFE'
    });
  };

  const addSectionCardToSlide = (
    pptx: PptxGenJS,
    slide: any,
    target: ReportExportTarget,
    yearFilterValue: string,
    cardLayout: ReportCardLayout
  ) => {
    const { mode, section } = target;
    const data = buildSectionChartData(mode, section, yearFilterValue);
    const isTrendSection = section === 'yearly' || section === 'monthly';
    const narrativeLines = getCardNarrative(data, section);

    slide.addShape(pptx.ShapeType.rect, {
      x: cardLayout.x,
      y: cardLayout.y,
      w: cardLayout.w,
      h: cardLayout.h,
      fill: { color: 'F8FAFF' },
      line: { color: '93C5FD', pt: 1.2 }
    });

    slide.addText(`[${reportModeLabel(mode)}] ${data.title}`, {
      x: cardLayout.x + 0.16,
      y: cardLayout.y + 0.12,
      w: cardLayout.w - 0.32,
      h: 0.26,
      bold: true,
      fontFace: '맑은 고딕',
      fontSize: 11,
      color: '1E3A8A'
    });
    slide.addText(`연도 필터: ${yearFilterValue === 'all' ? '전체' : `${yearFilterValue}년`}`, {
      x: cardLayout.x + 0.16,
      y: cardLayout.y + 0.38,
      w: cardLayout.w - 0.32,
      h: 0.2,
      fontFace: '맑은 고딕',
      fontSize: 8,
      color: '475569'
    });

    const summaryX = cardLayout.x + 0.16;
    const summaryY = cardLayout.y + 0.58;
    const summaryW = cardLayout.w - 0.32;
    const summaryH = 0.5;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: summaryX,
      y: summaryY,
      w: summaryW,
      h: summaryH,
      radius: 0.04,
      fill: { color: 'EEF2FF' },
      line: { color: 'C7D2FE', pt: 0.7 }
    });
    slide.addText(narrativeLines.join('\n'), {
      x: summaryX + 0.08,
      y: summaryY + 0.05,
      w: summaryW - 0.16,
      h: summaryH - 0.08,
      fontFace: '맑은 고딕',
      fontSize: 7,
      color: '334155',
      valign: 'mid',
      breakLine: true
    });

    const contentX = cardLayout.x + 0.16;
    const contentY = summaryY + summaryH + 0.1;
    const contentW = cardLayout.w - 0.32;
    const contentH = Math.max(1.9, cardLayout.y + cardLayout.h - contentY - 0.18);
    let chartX = contentX;
    let chartY = contentY;
    let chartW = contentW;
    let chartH = contentH * 0.55;
    let tableX = contentX;
    let tableY = chartY + chartH + 0.16;
    let tableW = contentW;
    let tableH = Math.max(1.2, cardLayout.y + cardLayout.h - tableY - 0.18);
    const chartSeries = [{ name: data.countLabel, labels: data.labels, values: data.values }];

    if (data.chartType === 'pie') {
      slide.addChart(pptx.ChartType.pie, chartSeries, {
        x: chartX,
        y: chartY,
        w: chartW,
        h: chartH,
        showLegend: true,
        showPercent: true,
        chartColors: chartPalette
      } as any);
    } else {
      // 선/막대 그래프는 표를 오른쪽에 배치해 카드 내 정보 밀도를 높입니다.
      chartW = contentW * 0.62;
      chartH = contentH;
      tableX = chartX + chartW + 0.16;
      tableY = contentY;
      tableW = Math.max(2.2, contentW - chartW - 0.16);
      tableH = contentH;
      const chartType = data.chartType === 'bar' ? pptx.ChartType.bar : pptx.ChartType.line;
      slide.addChart(chartType, chartSeries, {
        x: chartX,
        y: chartY,
        w: chartW,
        h: chartH,
        showLegend: false,
        chartColors: ['2563EB'],
        showCatAxisTitle: true,
        catAxisTitle: data.categoryLabel,
        showValAxisTitle: true,
        valAxisTitle: data.countLabel,
        catAxisLabelFontSize: 8,
        valAxisLabelFontSize: 8,
        ...(Number.isFinite(data.yMin) ? { valAxisMinVal: data.yMin } : {}),
        ...(Number.isFinite(data.yMax) ? { valAxisMaxVal: data.yMax } : {})
      } as any);
    }

    const maxRows = data.chartType === 'pie'
      ? (isTrendSection ? 10 : 9)
      : (isTrendSection ? 14 : 12);
    const visibleRows = data.tableRows.slice(0, maxRows);
    const tableHeader = isTrendSection
      ? [data.categoryLabel, data.countLabel]
      : ['순위', data.categoryLabel, data.countLabel];
    const tableRows = isTrendSection
      ? visibleRows.map((row) => [row.label, String(row.value)])
      : visibleRows.map((row, index) => [String(index + 1), row.label, String(row.value)]);

    const tableCellText = (text: string, isHeader = false) => ({
      text,
      options: {
        bold: isHeader,
        align: 'center',
        valign: 'middle',
        fill: { color: isHeader ? 'AFC7FA' : 'FFFFFF' },
        color: '0F172A'
      }
    });
    const tableDataForPpt = [
      tableHeader.map((text) => tableCellText(text, true)),
      ...tableRows.map((row) => row.map((cell) => tableCellText(cell)))
    ];
    slide.addTable(
      tableDataForPpt as any,
      {
        x: tableX,
        y: tableY,
        w: tableW,
        h: tableH,
        fontFace: '맑은 고딕',
        fontSize: 8.5,
        color: '0F172A',
        border: { pt: 0.8, color: '2563EB' },
        fill: 'FFFFFF',
        valign: 'middle',
        margin: 0.04,
        ...(isTrendSection
          ? { colW: [tableW * 0.72, tableW * 0.28] }
          : { colW: [tableW * 0.16, tableW * 0.6, tableW * 0.24] })
      } as any
    );

    if (data.tableRows.length > maxRows) {
      const noteY = Math.min(cardLayout.y + cardLayout.h - 0.2, tableY + tableH + 0.02);
      slide.addText(`* 표는 상위 ${maxRows}건만 표시`, {
        x: tableX,
        y: noteY,
        w: tableW,
        h: 0.16,
        align: 'right',
        fontFace: '맑은 고딕',
        fontSize: 7,
        color: '64748B'
      });
    }
  };

  const generatePptReport = async (
    targets: ReportExportTarget[],
    yearFilterValue: string
  ) => {
    if (targets.length === 0) {
      throw new Error('선택한 리포트 항목이 없습니다.');
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'KOLAS';
    pptx.company = 'KOLAS';
    pptx.subject = 'KOLAS Analysis Report';
    pptx.title = 'KOLAS Analysis Report';

    const generatedAt = new Date();
    const generatedAtText = generatedAt.toISOString().slice(0, 19).replace('T', ' ');

    const cover = pptx.addSlide();
    cover.background = { color: 'FFFFFF' };
    addReportHeaderToSlide(pptx, cover, '가로형 리포트');
    cover.addShape(pptx.ShapeType.rect, {
      x: 0.45,
      y: 0.95,
      w: REPORT_SLIDE_WIDTH - 0.9,
      h: 5.0,
      fill: { color: 'F8FAFF' },
      line: { color: 'BFDBFE', pt: 1.2 }
    });
    cover.addText('시험성적서 분석 결과 리포트', {
      x: 0.75,
      y: 1.45,
      w: REPORT_SLIDE_WIDTH - 1.5,
      h: 0.62,
      bold: true,
      fontFace: '맑은 고딕',
      fontSize: 26,
      color: '1E3A8A'
    });
    cover.addText(`생성일시: ${generatedAtText}`, {
      x: 0.76,
      y: 2.3,
      w: 8.8,
      h: 0.28,
      fontFace: '맑은 고딕',
      fontSize: 11,
      color: '475569'
    });
    cover.addText(
      `연도 필터: ${yearFilterValue === 'all' ? '전체' : `${yearFilterValue}년`}\n포함 항목: ${targets.map((target) => `[${target.mode === 'organization' ? '기관별' : '시험항목별'}] ${SECTION_TITLE_BY_MODE[target.mode][target.section]}`).join(', ')}`,
      {
        x: 0.76,
        y: 2.75,
        w: REPORT_SLIDE_WIDTH - 1.6,
        h: 2.6,
        fontFace: '맑은 고딕',
        fontSize: 11,
        color: '334155',
        valign: 'top'
      }
    );
    cover.addText('※ 본문은 슬라이드당 분석카드 1개로 구성됩니다.', {
      x: 0.76,
      y: 5.55,
      w: REPORT_SLIDE_WIDTH - 1.6,
      h: 0.25,
      fontFace: '맑은 고딕',
      fontSize: 9,
      color: '64748B'
    });

    const cardLayout: ReportCardLayout = {
      x: 0.45,
      y: 0.78,
      w: REPORT_SLIDE_WIDTH - 0.9,
      h: REPORT_SLIDE_HEIGHT - 1.15
    };
    for (let index = 0; index < targets.length; index += 1) {
      const slide = pptx.addSlide();
      addReportHeaderToSlide(pptx, slide, `분석 카드 ${index + 1}/${targets.length}`);
      addSectionCardToSlide(pptx, slide, targets[index], yearFilterValue, cardLayout);
    }

    const pad2 = (value: number) => String(value).padStart(2, '0');
    const timestampToken = [
      generatedAt.getFullYear(),
      pad2(generatedAt.getMonth() + 1),
      pad2(generatedAt.getDate()),
      pad2(generatedAt.getHours()),
      pad2(generatedAt.getMinutes()),
      pad2(generatedAt.getSeconds())
    ].join('');
    await pptx.writeFile({ fileName: `KOLAS 시험성적서 분석_${timestampToken}.pptx` });
  };

  const handleGeneratePdfReport = async () => {
    const selectedSections = availableReportSections.filter((section) => effectiveSelectedSections[section]);
    if (selectedSections.length === 0) {
      window.alert('리포트에 포함할 그래프를 1개 이상 선택해 주세요.');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const targets = selectedSections.map((section) => ({ mode: activeSummaryMode, section }));
      await generatePptReport(
        targets,
        effectiveYearFilter
      );
    } catch (error) {
      console.error('PPT report generation failed:', error);
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      window.alert(`리포트 PPT 생성 중 오류가 발생했습니다.\n${message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const domainStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    activeRows.forEach((row) => {
      const domain = (row.representativeDomain || '').trim() || '기타';
      map[domain] = (map[domain] || 0) + 1;
    });
    return map;
  }, [activeRows]);

  const techStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    activeRows.forEach((row) => {
      const tech = (row.mainTechField || '').trim() || '기타';
      map[tech] = (map[tech] || 0) + 1;
    });
    return map;
  }, [activeRows]);

  const aiTechStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    activeRows.forEach((row) => {
      const aiTech = (row.AI_Tech || '').trim() || '기타';
      map[aiTech] = (map[aiTech] || 0) + 1;
    });
    return map;
  }, [activeRows]);

  const platformStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    activeRows.forEach((row) => {
      const platform = (row.platform || '').trim() || '기타';
      map[platform] = (map[platform] || 0) + 1;
    });
    return map;
  }, [activeRows]);

  const domainLabels = Object.keys(domainStats);
  const domainData = domainLabels.map((label) => domainStats[label]);
  const domainChartData = {
    labels: domainLabels,
    datasets: [
      {
        data: domainData,
        backgroundColor: [
          '#2563eb', '#1e3a8a', '#a8c3ff', '#f59e42', '#10b981', '#f43f5e', '#6366f1', '#fbbf24', '#14b8a6', '#64748b', '#eab308', '#f472b6', '#a21caf', '#0ea5e9', '#e11d48', '#84cc16', '#facc15', '#f87171', '#a3e635', '#fcd34d'
        ]
      }
    ]
  };

  const techLabels = Object.keys(techStats);
  const techData = techLabels.map((label) => techStats[label]);
  const techChartData = {
    labels: techLabels,
    datasets: [
      {
        data: techData,
        backgroundColor: [
          '#10b981', '#6366f1', '#f59e42', '#2563eb', '#a8c3ff', '#1e3a8a', '#f43f5e', '#fbbf24', '#14b8a6', '#64748b', '#eab308', '#f472b6', '#a21caf', '#0ea5e9', '#e11d48', '#84cc16', '#facc15', '#f87171', '#a3e635', '#fcd34d'
        ]
      }
    ]
  };

  const aiTechLabels = Object.keys(aiTechStats);
  const aiTechData = aiTechLabels.map((label) => aiTechStats[label]);
  const aiTechChartData = {
    labels: aiTechLabels,
    datasets: [
      {
        data: aiTechData,
        backgroundColor: [
          '#6366f1', '#10b981', '#f59e42', '#2563eb', '#a8c3ff', '#1e3a8a', '#f43f5e', '#fbbf24', '#14b8a6', '#64748b', '#eab308', '#f472b6', '#a21caf', '#0ea5e9', '#e11d48', '#84cc16', '#facc15', '#f87171', '#a3e635', '#fcd34d'
        ]
      }
    ]
  };

  const platformLabels = Object.keys(platformStats);
  const platformData = platformLabels.map((label) => platformStats[label]);
  const platformChartData = {
    labels: platformLabels,
    datasets: [
      {
        data: platformData,
        backgroundColor: [
          '#2563eb', '#1e3a8a', '#a8c3ff', '#f59e42', '#10b981', '#f43f5e', '#6366f1', '#fbbf24', '#14b8a6', '#64748b', '#eab308', '#f472b6', '#a21caf', '#0ea5e9', '#e11d48', '#84cc16', '#facc15', '#f87171', '#a3e635', '#fcd34d'
        ]
      }
    ]
  };

  const aiTechColors = aiTechChartData.datasets[0].backgroundColor as string[];
  const techColors = techChartData.datasets[0].backgroundColor as string[];
  const domainColors = domainChartData.datasets[0].backgroundColor as string[];
  const platformColors = platformChartData.datasets[0].backgroundColor as string[];

  const yearMonthStats = React.useMemo(() => {
    const yearMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    activeRowsAll.forEach((row) => {
      if (!row.created_at) return;
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) return;
      const year = date.getFullYear().toString();
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      yearMap[year] = (yearMap[year] || 0) + 1;
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    return { yearMap, monthMap };
  }, [activeRowsAll]);

  const currentYear = new Date().getFullYear();
  const yearLabels = Array.from({ length: currentYear - 2021 + 1 }, (_, i) => (2021 + i).toString());
  const yearData = yearLabels.map((year) => yearMonthStats.yearMap[year] || 0);
  const parseNumberOrFallback = (value: string, fallback: number) => {
    if (value.trim() === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed;
  };
  const yearChartData = {
    labels: yearLabels,
    datasets: [
      {
        label: getSectionTitle('yearly'),
        data: yearData,
        borderColor: 'rgba(37, 99, 235, 0.9)',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.25,
        fill: false
      }
    ]
  };

  const now = new Date();
  const last12MonthLabels = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  const last12MonthData = last12MonthLabels.map((month) => yearMonthStats.monthMap[month] || 0);
  const monthChartData = {
    labels: last12MonthLabels,
    datasets: [
      {
        label: getSectionTitle('monthly'),
        data: last12MonthData,
        borderColor: 'rgba(30, 58, 138, 0.9)',
        backgroundColor: 'rgba(30, 58, 138, 0.15)',
        pointBackgroundColor: 'rgba(30, 58, 138, 1)',
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.25,
        fill: false
      }
    ]
  };

  const resolveAxisRange = (
    labels: string[],
    values: number[],
    setting: AxisRangeSetting
  ) => {
    const fallbackXMin = labels[0] ?? '';
    const fallbackXMax = labels[labels.length - 1] ?? fallbackXMin;
    let xStart = labels.includes(setting.xStart) ? setting.xStart : fallbackXMin;
    let xEnd = labels.includes(setting.xEnd) ? setting.xEnd : fallbackXMax;

    const xMinIndex = labels.indexOf(xStart);
    const xMaxIndex = labels.indexOf(xEnd);
    if (xMinIndex > xMaxIndex) {
      [xStart, xEnd] = [xEnd, xStart];
    }

    const fallbackYMin = 0;
    const fallbackYMax = Math.max(200, ...values, 1);
    const yStart = parseNumberOrFallback(setting.yStart, fallbackYMin);
    const parsedYMax = parseNumberOrFallback(setting.yEnd, fallbackYMax);
    const yEnd = Math.max(parsedYMax, yStart + 1);
    const stepSize = Math.max(1, Math.ceil((yEnd - yStart) / 10));

    return {
      xStart,
      xEnd,
      yStart,
      yEnd,
      stepSize
    };
  };

  const activeYearAxisRange = resolveAxisRange(
    yearLabels,
    yearData,
    axisRangeSettings[activeSummaryMode].yearly
  );
  const activeYearChartType = axisRangeSettings[activeSummaryMode].yearly.chartType || 'line';
  const activeMonthAxisRange = resolveAxisRange(
    last12MonthLabels,
    last12MonthData,
    axisRangeSettings[activeSummaryMode].monthly
  );
  const activeMonthChartType = axisRangeSettings[activeSummaryMode].monthly.chartType || 'line';

  const yearChartOptions = {
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: activeYearAxisRange.yStart,
        max: activeYearAxisRange.yEnd,
        ticks: {
          stepSize: activeYearAxisRange.stepSize
        },
        title: {
          display: true,
          text: countLabel
        }
      },
      x: {
        min: activeYearAxisRange.xStart,
        max: activeYearAxisRange.xEnd,
        title: {
          display: true,
          text: '년도'
        }
      }
    }
  };

  const monthChartOptions = {
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: activeMonthAxisRange.yStart,
        max: activeMonthAxisRange.yEnd,
        ticks: {
          stepSize: activeMonthAxisRange.stepSize
        },
        title: {
          display: true,
          text: countLabel
        }
      },
      x: {
        min: activeMonthAxisRange.xStart,
        max: activeMonthAxisRange.xEnd,
        title: {
          display: true,
          text: '월'
        }
      }
    }
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  const organizationDistributionYearOptions = Array.from(
    { length: currentYear - 2021 + 1 },
    (_, i) => (2021 + i).toString()
  ).reverse();
  const matrix = yearLabels.map((year) =>
    monthNames.map((_, monthIndex) => {
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      return yearMonthStats.monthMap[key] || 0;
    })
  );
  const yearTotals = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const monthTotals = monthNames.map((_, monthIndex) => matrix.reduce((sum, row) => sum + row[monthIndex], 0));
  const grandTotal = yearTotals.reduce((sum, value) => sum + value, 0);
  const donutChartSize = 224;
  const donutChartOptions = {
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: false
      }
    },
    cutout: '62%'
  } as any;

  const splitYearOptions = React.useMemo(() => {
    const years = new Set<string>();
    accumulatedResults.forEach((row) => {
      if (!row.created_at) return;
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) return;
      years.add(String(date.getFullYear()));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [accumulatedResults]);

  const selectedSplitTargets = splitReportQueue;
  const selectedSplitCount = selectedSplitTargets.length;
  const splitQueuedKeySet = React.useMemo(
    () => new Set(splitReportQueue.map((item) => `${item.mode}:${item.section}`)),
    [splitReportQueue]
  );

  const parseDraggedReportItem = (rawKey: string) => {
    const [mode, section] = (rawKey || '').split(':');
    if ((mode !== 'organization' && mode !== 'testItem') || !REPORT_SECTION_ORDER.includes(section as ReportSectionKey)) {
      return null;
    }
    return { mode: mode as SummaryMode, section: section as ReportSectionKey };
  };

  const parseDraggedQueueIndex = (rawIndex: string) => {
    if ((rawIndex || '').trim() === '') return null;
    const sourceIndex = Number(rawIndex);
    if (!Number.isInteger(sourceIndex) || sourceIndex < 0) return null;
    return sourceIndex;
  };

  const upsertSplitReportQueue = (
    item: { mode: SummaryMode; section: ReportSectionKey },
    targetIndex?: number
  ) => {
    setSplitReportQueue((prev) => {
      const filtered = prev.filter((entry) => !(entry.mode === item.mode && entry.section === item.section));
      const safeTargetIndex = targetIndex === undefined
        ? filtered.length
        : Math.max(0, Math.min(targetIndex, filtered.length));
      const next = [...filtered];
      next.splice(safeTargetIndex, 0, item);
      return next;
    });
  };

  const moveSplitQueueItemToIndex = (sourceIndex: number, targetIndex: number) => {
    setSplitReportQueue((prev) => {
      if (sourceIndex < 0 || sourceIndex >= prev.length) return prev;
      if (targetIndex < 0 || targetIndex > prev.length) return prev;
      if (sourceIndex === targetIndex || sourceIndex + 1 === targetIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjustedTargetIndex, 0, moved);
      return next;
    });
  };

  const handleSplitQueueDropByIndex = (targetIndex: number, event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const sourceIndex = parseDraggedQueueIndex(event.dataTransfer.getData('application/x-kolas-report-queue-index'));
    if (sourceIndex !== null) {
      moveSplitQueueItemToIndex(sourceIndex, targetIndex);
      return;
    }

    const item = parseDraggedReportItem(event.dataTransfer.getData('application/x-kolas-report-item'));
    if (!item) return;
    upsertSplitReportQueue(item, targetIndex);
  };

  const handleSplitCardDragStart = (mode: SummaryMode, section: ReportSectionKey, event: React.DragEvent<HTMLElement>) => {
    event.dataTransfer.setData('application/x-kolas-report-item', `${mode}:${section}`);
    event.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleSplitDropZoneDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const isQueueDrag = event.dataTransfer.types.includes('application/x-kolas-report-queue-index');
    event.dataTransfer.dropEffect = isQueueDrag ? 'move' : 'copy';
    setIsSplitDropActive(true);
  };

  const handleSplitDropZoneDragLeave = () => {
    setIsSplitDropActive(false);
  };

  const handleSplitDropZoneDrop = (event: React.DragEvent<HTMLDivElement>) => {
    setIsSplitDropActive(false);
    handleSplitQueueDropByIndex(splitReportQueue.length, event);
  };

  const handleSplitQueueItemDragStart = (index: number, event: React.DragEvent<HTMLLIElement>) => {
    event.dataTransfer.setData('application/x-kolas-report-queue-index', String(index));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSplitQueueItemDrop = (targetIndex: number, event: React.DragEvent<HTMLLIElement>) => {
    handleSplitQueueDropByIndex(targetIndex, event);
  };

  const removeSplitQueueItem = (index: number) => {
    setSplitReportQueue((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearSplitReportQueue = () => {
    setSplitReportQueue([]);
  };

  const registerSplitSectionRef = (mode: SummaryMode, section: ReportSectionKey, node: HTMLDivElement | null) => {
    splitReportSectionRefs.current[mode][section] = node;
  };

  const handleGenerateSplitPdfReport = async () => {
    if (selectedSplitTargets.length === 0) {
      window.alert('리포트에 포함할 그래프를 1개 이상 선택해 주세요.');
      return;
    }

    setIsSplitGeneratingReport(true);
    try {
      await generatePptReport(
        selectedSplitTargets,
        splitYearFilter
      );
    } catch (error) {
      console.error('Split PPT report generation failed:', error);
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      window.alert(`리포트 PPT 생성 중 오류가 발생했습니다.\n${message}`);
    } finally {
      setIsSplitGeneratingReport(false);
    }
  };

  const axisSettingLabelOptions = axisSettingModalTarget
    ? axisSettingModalTarget.section === 'yearly'
      ? yearLabels
      : last12MonthLabels
    : [];
  const axisSettingModal = axisSettingModalTarget ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#bfdbfe] bg-white p-4 shadow-xl">
        <p className="mt-1 text-sm text-[#334155] font-bold ">
          {SECTION_TITLE_BY_MODE[axisSettingModalTarget.mode][axisSettingModalTarget.section]}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-[#334155]">
              그래프 종류
              <select
                className="mt-1 w-full rounded-md border border-[#cbd5e1] px-2 py-1 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
                value={axisSettingDraft.chartType}
                onChange={(event) =>
                  setAxisSettingDraft((prev) => ({
                    ...prev,
                    chartType: event.target.value === 'bar' ? 'bar' : 'line'
                  }))
                }
              >
                <option value="line">선그래프</option>
                <option value="bar">막대그래프</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-sm text-[#334155]">
              X축 시작값
              <select
                className="mt-1 w-full rounded-md border border-[#cbd5e1] px-2 py-1 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
                value={axisSettingDraft.xStart}
                onChange={(event) => setAxisSettingDraft((prev) => ({ ...prev, xStart: event.target.value }))}
              >
                <option value="">자동</option>
                {axisSettingLabelOptions.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[#334155]">
              X축 종료값
              <select
                className="mt-1 w-full rounded-md border border-[#cbd5e1] px-2 py-1 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
                value={axisSettingDraft.xEnd}
                onChange={(event) => setAxisSettingDraft((prev) => ({ ...prev, xEnd: event.target.value }))}
              >
                <option value="">자동</option>
                {axisSettingLabelOptions.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-sm text-[#334155]">
              Y축 시작값
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-[#cbd5e1] px-2 py-1 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
                value={axisSettingDraft.yStart}
                onChange={(event) => setAxisSettingDraft((prev) => ({ ...prev, yStart: event.target.value }))}
              />
            </label>
            <label className="text-sm text-[#334155]">
              Y축 종료값
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-[#cbd5e1] px-2 py-1 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
                value={axisSettingDraft.yEnd}
                onChange={(event) => setAxisSettingDraft((prev) => ({ ...prev, yEnd: event.target.value }))}
              />
            </label>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setAxisSettingDraft(createDefaultAxisRangeSetting())}
            className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-sm font-semibold text-[#334155] hover:bg-[#eff6ff] cursor-pointer"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={closeAxisSettingModal}
            className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-sm font-semibold text-[#334155] hover:bg-[#eff6ff] cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={saveAxisSettingModal}
            className="rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#1e40af] cursor-pointer"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (isSplitRoot) {
    return (
      <>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="xl:order-2 xl:sticky xl:top-4 self-start rounded-xl border-2 border-[#93c5fd] bg-[#f8fbff] p-3 shadow-sm min-h-[48vh] xl:h-[calc(80vh-1.6rem)] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
            
            
            <div className="ml-auto flex items-center justify-end gap-2">
              {splitReportQueue.length > 0 && (
                <button
                  type="button"
                  onClick={clearSplitReportQueue}
                  className="rounded-lg px-3 py-2 text-sm font-bold transition-colors bg-white text-[#1e3a8a] border border-[#bfdbfe] hover:bg-[#eff6ff] cursor-pointer"
                >
                  목록 비우기
                </button>
              )}
            </div>
          </div>
            <div
              className={`mt-3 rounded-xl border-2 border-dashed p-3 transition-colors flex flex-col flex-1 min-h-0 ${
                isSplitDropActive ? 'border-[#2563eb] bg-[#dbeafe]/50' : 'border-[#bfdbfe] bg-white'
              }`}
              onDragOver={handleSplitDropZoneDragOver}
              onDragLeave={handleSplitDropZoneDragLeave}
              onDrop={handleSplitDropZoneDrop}
            >
              
              <div className="mt-1 flex-1 min-h-0 flex flex-col">
                {splitReportQueue.length === 0 ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-sm text-[#64748b] text-center">
                      <b style={{ color: '#1d4ed8' }}>리포트를 생성</b>하시려면<br></br>분석 카드의 <b style={{color: '#1d4ed8' }}>[추가] 버튼을 누른 후 드래그</b>하여<br></br>리포트 항목을 추가해주세요.
                      </p>
                  </div>
                ) : (
                  <ol className="space-y-2 overflow-y-auto pr-1">
                    {splitReportQueue.map((item, index) => (
                      <li
                        key={`${item.mode}:${item.section}`}
                        draggable
                        onDragStart={(event) => handleSplitQueueItemDragStart(index, event)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleSplitQueueItemDrop(index, event)}
                        className="flex items-center justify-between rounded-lg border border-[#bfdbfe] bg-[#f8fbff] px-3 py-2 text-sm text-[#1e3a8a] cursor-grab active:cursor-grabbing"
                      >
                        <span className="font-semibold flex items-center gap-2">
                          <span className="text-[#94a3b8]">::</span>
                          {index + 1}. {SECTION_TITLE_BY_MODE[item.mode][item.section]}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => removeSplitQueueItem(index)}
                            className="rounded-md border border-[#cbd5e1] px-2 py-1 text-xs text-[#334155] hover:bg-white cursor-pointer"
                          >
                            제거
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              {splitReportQueue.length > 0 && (
                <div className="mt-3 w-full">
                  <button
                    type="button"
                    onClick={handleGenerateSplitPdfReport}
                    disabled={isSplitGeneratingReport}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                      isSplitGeneratingReport
                        ? 'bg-[#94a3b8] text-white cursor-not-allowed'
                        : 'bg-[#1d4ed8] text-white hover:bg-[#1e40af] cursor-pointer'
                    }`}
                  >
                    {isSplitGeneratingReport ? '리포트 생성 중...' : '리포트 생성'}
                  </button>
                </div>
              )}
            </div>
        </div>

        <div className="xl:order-1 rounded-2xl overflow-hidden shadow-lg shadow-[#2563eb]/20 border border-[#2563eb]/30">
          
          <div className="bg-white/85 border-t border-[#bfdbfe] p-2">
            <div className="rounded-lg border border-[#dbeafe] bg-[#f1f5f9] p-1">
              <div className="grid w-full grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSplitCardTab('organization')}
                  role="tab"
                  aria-selected={splitCardTab === 'organization'}
                  className={`w-full rounded-md px-3 py-2 text-sm font-bold transition-colors cursor-pointer ${
                    splitCardTab === 'organization'
                      ? 'bg-[#1d4ed8] text-white'
                      : 'text-[#475569] hover:bg-white hover:text-[#1e40af]'
                  }`}
                >
                  기관별
                </button>
                <button
                  type="button"
                  onClick={() => setSplitCardTab('testItem')}
                  role="tab"
                  aria-selected={splitCardTab === 'testItem'}
                  className={`w-full rounded-md px-3 py-2 text-sm font-bold transition-colors cursor-pointer ${
                    splitCardTab === 'testItem'
                      ? 'bg-[#1d4ed8] text-white'
                      : 'text-[#475569] hover:bg-white hover:text-[#1e40af]'
                  }`}
                >
                  시험항목별
                </button>
              </div>
            </div>
            <div className="mt-2 pr-1">
            {splitCardTab === 'organization' ? (
              <AnalysisSummary
                results={results}
                accumulatedResults={accumulatedResults}
                isAdminMember={isAdminMember}
                forcedMode="organization"
                onRegisterSectionRef={(section, node) => registerSplitSectionRef('organization', section, node)}
                sharedYearFilter={splitYearFilter}
                onSharedYearFilterChange={setSplitYearFilter}
                hideTopBar
                onCardDragStart={handleSplitCardDragStart}
                queuedSectionKeys={splitQueuedKeySet}
              />
            ) : (
              <AnalysisSummary
                results={results}
                accumulatedResults={accumulatedResults}
                isAdminMember={isAdminMember}
                forcedMode="testItem"
                onRegisterSectionRef={(section, node) => registerSplitSectionRef('testItem', section, node)}
                sharedYearFilter={splitYearFilter}
                onSharedYearFilterChange={setSplitYearFilter}
                hideTopBar
                onCardDragStart={handleSplitCardDragStart}
                queuedSectionKeys={splitQueuedKeySet}
              />
            )}
            </div>
          </div>
        </div>
      </div>
      {axisSettingModal}
      </>
    );
  }

  return (
    <div>
      {!hideTopBar && (
      <div className="mt-2 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#bfdbfe] bg-white/80 p-2.5">
        {!isForcedMode && (
          <div className="flex items-center gap-2 rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-1">
            <button
              onClick={() => setSummarySubTab('organization')}
              className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer ${
                summarySubTab === 'organization'
                  ? 'bg-[#1d4ed8] text-white shadow'
                  : 'text-[#1e40af] hover:bg-white'
              }`}
            >
              기관별 분석
            </button>
            <button
              onClick={() => setSummarySubTab('testItem')}
              className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer ${
                summarySubTab === 'testItem'
                  ? 'bg-[#1d4ed8] text-white shadow'
                  : 'text-[#1e40af] hover:bg-white'
              }`}
            >
              시험항목별 분석
            </button>
          </div>
        )}
      </div>
      )}

      {!isForcedMode && (
        <div className="mb-4 rounded-xl border border-[#bfdbfe] bg-[#f8fbff] p-3">
          <div className="flex flex-wrap items-center gap-2">
            {availableReportSections.map((section) => (
              <label
                key={section}
                className="inline-flex items-center gap-2 rounded-md border border-[#bfdbfe] bg-white px-2.5 py-1.5 text-xs text-[#1e3a8a] cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 cursor-pointer accent-[#1d4ed8]"
                  checked={effectiveSelectedSections[section]}
                  onChange={() => handleToggleReportSection(section)}
                />
                <span className="font-semibold">{getSectionTitle(section)}</span>
              </label>
            ))}
            <button
              type="button"
              onClick={handleGeneratePdfReport}
              disabled={isGeneratingReport || selectedSectionCount === 0}
              className={`ml-auto rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                isGeneratingReport || selectedSectionCount === 0
                  ? 'bg-[#94a3b8] text-white cursor-not-allowed'
                  : 'bg-[#1d4ed8] text-white hover:bg-[#1e40af] cursor-pointer'
              }`}
            >
              {isGeneratingReport ? '리포트 생성 중...' : '리포트 생성'}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#1e3a8a]/80">
            체크한 그래프만 PDF 리포트로 다운로드됩니다.
          </p>
        </div>
      )}

      {isAdminMember && (
      <div className="mt-4 rounded-xl border border-[#bfdbfe] bg-[#f8fbff] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#1e3a8a]">■ 그래프 추가 생성</h3>
          <span className="text-xs text-[#1e3a8a]/70">
            생성된 그래프: {activeCustomChartSpecs.length}개
          </span>
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_170px_110px] gap-2">
          <select
            aria-label="추가 그래프 항목 선택"
            className="rounded-md border border-[#cbd5e1] bg-white px-2 py-2 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
            value={activeCustomChartDraft?.fieldKey || ''}
            onChange={(event) => updateActiveCustomChartDraft({ fieldKey: event.target.value })}
          >
            {activeCustomFieldOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="추가 그래프 유형 선택"
            className="rounded-md border border-[#cbd5e1] bg-white px-2 py-2 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
            value={activeCustomChartDraft?.chartKind || 'bar'}
            onChange={(event) => updateActiveCustomChartDraft({ chartKind: event.target.value as CustomChartKind })}
          >
            <option value="bar">막대 그래프</option>
            <option value="line">선 그래프</option>
            <option value="doughnut">원 그래프</option>
          </select>
          <button
            type="button"
            onClick={handleAddCustomChart}
            className="rounded-md bg-[#1d4ed8] px-3 py-2 text-sm font-bold text-white hover:bg-[#1e40af] cursor-pointer"
          >
            생성
          </button>
        </div>
        <p className="mt-2 text-xs text-[#1e3a8a]/75">
          항목과 그래프 유형을 선택하면 현재 필터 기준으로 추가 분석 그래프 카드를 생성합니다.
        </p>
      </div>
      )}

      {/* 년도별-월별 시험성적서 수 표 (행: 년도, 열: 월) */}
      <div className="hidden mt-6 bg-[#f3f6fd] rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-center border-collapse text-[#141414] text-base border border-[#2563eb]/40">
          <thead>
            <tr>
              <th className="p-1 border-[#2563eb]/40 bg-[#ffffff]">년도/월</th>
              {monthNames.map((month) => (
                <th key={month} className="p-1 border border-[#2563eb]/40 bg-[#afc7fa] font-normal">{month}</th>
              ))}
              <th className="p-1 border border-[#2563eb]/40 bg-[#afc7fa] font-normal">합계</th>
            </tr>
          </thead>
          <tbody>
            {yearLabels.map((year, yearIndex) => (
              <tr key={year}>
                <td className="p-1 border border-[#2563eb]/40 bg-[#afc7fa] font-normal">{year}</td>
                {matrix[yearIndex].map((value, monthIndex) => (
                  <td key={monthNames[monthIndex]} className="p-1 border border-[#2563eb]/40">{value}</td>
                ))}
                <td className="p-1 border border-[#2563eb]/40">{yearTotals[yearIndex]}</td>
              </tr>
            ))}
            <tr>
              <td className="p-1 border border-[#2563eb]/40 bg-[#afc7fa] font-normal">합계</td>
              {monthTotals.map((value, monthIndex) => (
                <td key={monthNames[monthIndex]} className="p-1 border border-[#2563eb]/40">{value}</td>
              ))}
              <td className="p-1 border border-[#2563eb]/40">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-6 rounded-xl bg-[#f8fbff] p-3">
        <h3 className="px-1 text-sm font-bold text-[#1e3a8a]">■ {areaTitlePrefix} 추이 영역</h3>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div
            ref={(node) => { setReportSectionRef('yearly', node); }}
            className="bg-[#f3f6fd] rounded-xl border border-[#bfdbfe] p-4"
            style={{ overflowY: 'auto', maxHeight: 400, minWidth: 0 }}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-[#1e3a8a]">{getSectionTitle('yearly')}</h3>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openAxisSettingModal(activeSummaryMode, 'yearly')}
                  className="rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs font-semibold text-[#334155] hover:bg-[#eff6ff] cursor-pointer"
                >
                  설정
                </button>
                {renderSectionControl('yearly')}
              </div>
            </div>
            <div style={{ minWidth: '60%' }}>
              {activeYearChartType === 'bar' ? (
                <Bar data={yearChartData} options={yearChartOptions} height={300} />
              ) : (
                <Line data={yearChartData} options={yearChartOptions} height={300} />
              )}
            </div>
          </div>
          <div
            ref={(node) => { setReportSectionRef('monthly', node); }}
            className="bg-[#f3f6fd] rounded-xl border border-[#bfdbfe] p-4"
            style={{ overflowY: 'auto', maxHeight: 400, minWidth: 0 }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-[#1e3a8a]">{getSectionTitle('monthly')}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAxisSettingModal(activeSummaryMode, 'monthly')}
                  className="rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs font-semibold text-[#334155] hover:bg-[#eff6ff] cursor-pointer"
                >
                  설정
                </button>
                {renderSectionControl('monthly')}
              </div>
            </div>
            <div style={{ minWidth: '60%' }}>
              {activeMonthChartType === 'bar' ? (
                <Bar data={monthChartData} options={monthChartOptions} height={300} />
              ) : (
                <Line data={monthChartData} options={monthChartOptions} height={300} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-[#f8fbff] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-bold text-[#1e3a8a]">■ {areaTitlePrefix} 분포 영역</h3>
          <select
            aria-label={`${areaTitlePrefix} 분포 연도 필터`}
            className="min-w-[150px] rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-sm text-[#141414] outline-none focus:border-[#2563eb]"
            value={effectiveYearFilter}
            onChange={(event) => setEffectiveYearFilter(event.target.value)}
          >
            <option value="all">전체 연도</option>
            {organizationDistributionYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div
          ref={(node) => { setReportSectionRef('domain', node); }}
          className="bg-[#f3f6fd] rounded-xl border border-[#bfdbfe] p-4 w-full"
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[#1e3a8a] text-center">{getYearPrefixedPieSectionTitle('domain')}</h3>
            <div className="mt-2 flex items-center justify-end gap-2">
              {renderSectionControl('domain')}
            </div>
          </div>
          <div className="mt-2 space-y-4">
            <div className="overflow-x-auto">
              <div className="mx-auto flex min-w-[420px] items-center justify-center gap-4">
                <div className="shrink-0" style={{ width: donutChartSize, height: donutChartSize }}>
                  <Doughnut data={domainChartData} options={donutChartOptions} />
                </div>
                <div className="min-w-[220px]">
                  <ul className="space-y-1 text-sm text-[#1e3a8a]">
                    {domainLabels.map((label, index) => (
                      <li key={`${label}-${index}`} className="flex items-start gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm mt-1 shrink-0" style={{ backgroundColor: domainColors[index] || '#64748b' }} />
                        <span className="text-left break-words">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              {(() => {
                const domainTableData = domainLabels.map((label, index) => ({
                  label,
                  count: domainData[index]
                }));
                const sorted = [...domainTableData].sort((a, b) => b.count - a.count);
                return (
                  <table className="w-full table-fixed text-center border-collapse text-[#141414] text-base border border-[#2563eb]/40 bg-white rounded-xl shadow">
                    <thead>
                      <tr>
                        <th className="w-[10%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">순위</th>
                        <th className="w-[70%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">대표 도메인</th>
                        <th className="w-[20%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">{countLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((row, index) => (
                        <tr key={row.label}>
                          <td className="w-[10%] p-2 border border-[#2563eb]/40">{index + 1}</td>
                          <td className="w-[70%] p-2 border border-[#2563eb]/40">{row.label}</td>
                          <td className="w-[20%] p-2 border border-[#2563eb]/40">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>

        <div
          ref={(node) => { setReportSectionRef('platform', node); }}
          className="bg-[#f3f6fd] rounded-xl border border-[#bfdbfe] p-4 w-full"
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[#1e3a8a] text-center">{getYearPrefixedPieSectionTitle('platform')}</h3>
            <div className="mt-2 flex items-center justify-end gap-2">
              {renderSectionControl('platform')}
            </div>
          </div>
          <div className="mt-2 space-y-4">
            <div className="overflow-x-auto">
              <div className="mx-auto flex min-w-[420px] items-center justify-center gap-4">
                <div className="shrink-0" style={{ width: donutChartSize, height: donutChartSize }}>
                  <Doughnut data={platformChartData} options={donutChartOptions} />
                </div>
                <div className="min-w-[220px]">
                  <ul className="space-y-1 text-sm text-[#1e3a8a]">
                    {platformLabels.map((label, index) => (
                      <li key={`${label}-${index}`} className="flex items-start gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm mt-1 shrink-0" style={{ backgroundColor: platformColors[index] || '#64748b' }} />
                        <span className="text-left break-words">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              {(() => {
                const platformTableData = platformLabels.map((label, index) => ({
                  label,
                  count: platformData[index]
                }));
                const sorted = [...platformTableData].sort((a, b) => b.count - a.count);
                return (
                  <table className="w-full table-fixed text-center border-collapse text-[#141414] text-base border border-[#2563eb]/40 bg-white rounded-xl shadow">
                    <thead>
                      <tr>
                        <th className="w-[10%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">순위</th>
                        <th className="w-[70%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">플랫폼</th>
                        <th className="w-[20%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">{countLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((row, index) => (
                        <tr key={row.label}>
                          <td className="w-[10%] p-2 border border-[#2563eb]/40">{index + 1}</td>
                          <td className="w-[70%] p-2 border border-[#2563eb]/40">{row.label}</td>
                          <td className="w-[20%] p-2 border border-[#2563eb]/40">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>

        <div
          ref={(node) => { setReportSectionRef('mainTech', node); }}
          className="bg-[#f3f6fd] rounded-xl border border-[#bfdbfe] p-4 w-full"
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[#1e3a8a] text-center">{getYearPrefixedPieSectionTitle('mainTech')}</h3>
            <div className="mt-2 flex items-center justify-end gap-2">
              {renderSectionControl('mainTech')}
            </div>
          </div>
          <div className="mt-2 space-y-4">
            <div className="overflow-x-auto">
              <div className="mx-auto flex min-w-[420px] items-center justify-center gap-4">
                <div className="shrink-0" style={{ width: donutChartSize, height: donutChartSize }}>
                  <Doughnut data={techChartData} options={donutChartOptions} />
                </div>
                <div className="min-w-[220px]">
                  <ul className="space-y-1 text-sm text-[#1e3a8a]">
                    {techLabels.map((label, index) => (
                      <li key={`${label}-${index}`} className="flex items-start gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm mt-1 shrink-0" style={{ backgroundColor: techColors[index] || '#64748b' }} />
                        <span className="text-left break-words">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              {(() => {
                const fieldTableData = techLabels.map((label, index) => ({
                  label,
                  count: techData[index]
                }));
                const sorted = [...fieldTableData].sort((a, b) => b.count - a.count);
                return (
                  <table className="w-full table-fixed text-center border-collapse text-[#141414] text-base border border-[#2563eb]/40 bg-white rounded-xl shadow">
                    <thead>
                      <tr>
                        <th className="w-[10%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">순위</th>
                        <th className="w-[70%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">주요기술 분야</th>
                        <th className="w-[20%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">{countLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((row, index) => (
                        <tr key={row.label}>
                          <td className="w-[10%] p-2 border border-[#2563eb]/40">{index + 1}</td>
                          <td className="w-[70%] p-2 border border-[#2563eb]/40">{row.label}</td>
                          <td className="w-[20%] p-2 border border-[#2563eb]/40">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>

        {summarySubTab === 'testItem' && (
          <div
            ref={(node) => { setReportSectionRef('aiTech', node); }}
            className="bg-[#f3f6fd] rounded-xl border border-[#bfdbfe] p-4 w-full"
          >
            <div className="mb-3">
              <h3 className="text-lg font-bold text-[#1e3a8a] text-center">{getYearPrefixedPieSectionTitle('aiTech')}</h3>
              <div className="mt-2 flex items-center justify-end gap-2">
                {renderSectionControl('aiTech')}
              </div>
            </div>
            <div className="mt-2 space-y-4">
              <div className="overflow-x-auto">
                <div className="mx-auto flex min-w-[420px] items-center justify-center gap-4">
                  <div className="shrink-0" style={{ width: donutChartSize, height: donutChartSize }}>
                    <Doughnut data={aiTechChartData} options={donutChartOptions} />
                  </div>
                  <div className="min-w-[220px]">
                    <ul className="space-y-1 text-sm text-[#1e3a8a]">
                      {aiTechLabels.map((label, index) => (
                        <li key={`${label}-${index}`} className="flex items-start gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm mt-1 shrink-0" style={{ backgroundColor: aiTechColors[index] || '#64748b' }} />
                          <span className="text-left break-words">{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                {(() => {
                  const aiTechTableData = aiTechLabels.map((label, index) => ({
                    label,
                    count: aiTechData[index]
                  }));
                  const sorted = [...aiTechTableData].sort((a, b) => b.count - a.count);
                  return (
                    <table className="w-full table-fixed text-center border-collapse text-[#141414] text-base border border-[#2563eb]/40 bg-white rounded-xl shadow">
                      <thead>
                        <tr>
                          <th className="w-[10%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">순위</th>
                          <th className="w-[70%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">적용기술(AI)추천</th>
                          <th className="w-[20%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">{countLabel}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((row, index) => (
                          <tr key={row.label}>
                            <td className="w-[10%] p-2 border border-[#2563eb]/40">{index + 1}</td>
                            <td className="w-[70%] p-2 border border-[#2563eb]/40">{row.label}</td>
                            <td className="w-[20%] p-2 border border-[#2563eb]/40">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      {renderedCustomCharts.length > 0 && (
        <div className="mt-6 rounded-xl bg-[#f8fbff] p-3">
          <h3 className="px-1 text-sm font-bold text-[#1e3a8a]">■ {areaTitlePrefix} 사용자 추가 그래프</h3>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {renderedCustomCharts.map(({ spec, labels, values, rows, total }) => {
              const chartData = {
                labels,
                datasets: [
                  {
                    label: `${spec.fieldLabel} (${countLabel})`,
                    data: values,
                    borderColor: 'rgba(37, 99, 235, 0.9)',
                    backgroundColor: spec.chartKind === 'doughnut'
                      ? labels.map((_, index) => chartPalette[index % chartPalette.length].startsWith('#')
                        ? chartPalette[index % chartPalette.length]
                        : `#${chartPalette[index % chartPalette.length]}`)
                      : 'rgba(37, 99, 235, 0.2)',
                    pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointRadius: 3,
                    borderWidth: 2,
                    tension: 0.25,
                    fill: false
                  }
                ]
              } as any;

              const lineBarOptions = {
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false
              } as any;

              return (
                <div
                  key={spec.id}
                  className="bg-[#f3f6fd] rounded-xl border border-[#bfdbfe] p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#1e3a8a]">{spec.fieldLabel} 추가 분석</h3>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomChart(spec.id)}
                      className="rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs font-semibold text-[#334155] hover:bg-[#eff6ff] cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                  <p className="mb-2 text-xs text-[#475569]">총 집계: {total.toLocaleString('ko-KR')}건</p>
                  <div style={{ minHeight: 260 }}>
                    {spec.chartKind === 'doughnut' ? (
                      <Doughnut data={chartData} options={donutChartOptions as any} />
                    ) : spec.chartKind === 'bar' ? (
                      <Bar data={chartData} options={lineBarOptions} height={260} />
                    ) : (
                      <Line data={chartData} options={lineBarOptions} height={260} />
                    )}
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full table-fixed text-center border-collapse text-[#141414] text-base border border-[#2563eb]/40 bg-white rounded-xl shadow">
                      <thead>
                        <tr>
                          <th className="w-[12%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">순위</th>
                          <th className="w-[64%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">{spec.fieldLabel}</th>
                          <th className="w-[24%] p-2 border border-[#2563eb]/40 bg-[#afc7fa] font-bold">{countLabel}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={`${spec.id}-${row.label}`}>
                            <td className="w-[12%] p-2 border border-[#2563eb]/40">{index + 1}</td>
                            <td className="w-[64%] p-2 border border-[#2563eb]/40">{row.label}</td>
                            <td className="w-[24%] p-2 border border-[#2563eb]/40">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {axisSettingModal}
    </div>
  );
}



