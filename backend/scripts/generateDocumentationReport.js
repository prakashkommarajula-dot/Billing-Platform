const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  UnderlineType,
  ImageRun,
} = require('docx');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOC_DIR = path.join(__dirname, '../../documentation');
const SCREENSHOT_DIR = path.join(DOC_DIR, 'screenshots');

if (!fs.existsSync(DOC_DIR)) fs.mkdirSync(DOC_DIR, { recursive: true });

console.log('[Report Generator] Initializing Full-Stack B.Tech Project Documentation Generator...');
