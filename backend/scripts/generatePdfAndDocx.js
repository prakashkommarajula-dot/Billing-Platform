const fs = require('fs');
const path = require('path');
const os = require('os');
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
  ImageRun,
} = require('docx');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOC_DIR = path.join(__dirname, '../../documentation');
const SCREENSHOT_DIR = path.join(DOC_DIR, 'screenshots');
const MD_PATH = path.join(DOC_DIR, 'BILLFLOW_PROJECT_REPORT.md');
const HTML_PATH = path.join(DOC_DIR, 'report_template.html');
const PDF_PATH = path.join(DOC_DIR, 'BILLFLOW_PROJECT_REPORT.pdf');
const DOCX_PATH = path.join(DOC_DIR, 'BILLFLOW_PROJECT_REPORT.docx');

// Custom Markdown to HTML Converter with Academic A4 Styling
function markdownToHtml(md) {
  let lines = md.split('\n');
  let html = [];
  let inCode = false;
  let codeLang = '';
  let inTable = false;
  let tableRows = [];

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      let tableHtml = '<table class="report-table"><thead><tr>';
      tableRows[0].forEach(h => { tableHtml += `<th>${formatInline(h)}</th>`; });
      tableHtml += '</tr></thead><tbody>';
      for (let i = 1; i < tableRows.length; i++) {
        tableHtml += '<tr>';
        tableRows[i].forEach(c => { tableHtml += `<td>${formatInline(c)}</td>`; });
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table>';
      html.push(tableHtml);
      inTable = false;
      tableRows = [];
    }
  }

  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx];

    // Page break
    if (line.includes('\\newpage')) {
      flushTable();
      html.push('<div class="page-break"></div>');
      continue;
    }
    if (line.includes('\\vspace')) {
      flushTable();
      html.push('<div style="height: 35px;"></div>');
      continue;
    }

    // Code blocks
    if (line.startsWith('```')) {
      flushTable();
      if (!inCode) {
        inCode = true;
        codeLang = line.replace('```', '').trim();
        html.push(`<pre class="code-block" data-lang="${codeLang}"><code>`);
      } else {
        inCode = false;
        html.push('</code></pre>');
      }
      continue;
    }
    if (inCode) {
      html.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      if (line.includes('---')) continue; // separator row
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
      // Do not continue! Process this line.
    }

    // Raw HTML blocks (cover page, custom tables, divs)
    if (line.trim().startsWith('<') || line.trim().startsWith('</') || line.trim().endsWith('>')) {
      html.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      html.push(`<h1>${formatInline(line.replace('# ', ''))}</h1>`);
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${formatInline(line.replace('## ', ''))}</h2>`);
    } else if (line.startsWith('### ')) {
      html.push(`<h3>${formatInline(line.replace('### ', ''))}</h3>`);
    } else if (line.startsWith('#### ')) {
      html.push(`<h4>${formatInline(line.replace('#### ', ''))}</h4>`);
    } else if (line.startsWith('![')) {
      // Image: ![alt](src)
      const m = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (m) {
        const alt = m[1];
        const src = m[2];
        html.push(`<div class="figure-container"><img src="${src}" alt="${alt}" class="figure-img" /><div class="figure-caption">${alt}</div></div>`);
      }
    } else if (line.startsWith('*Figure ')) {
      // Standalone italic caption
      html.push(`<div class="figure-caption">${line.replace(/^\*|\*$/g, '')}</div>`);
    } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
      html.push(`<li>${formatInline(line.replace(/^[-•*]\s+/, ''))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      html.push(`<div class="numbered-item">${formatInline(line)}</div>`);
    } else if (line.trim() === '---') {
      html.push('<hr class="divider" />');
    } else if (line.trim().length > 0) {
      html.push(`<p>${formatInline(line)}</p>`);
    }
  }

  flushTable();
  return html.join('\n');
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\$\$(.*?)\$\$/g, '<div class="math-block">$$$1$$</div>')
    .replace(/\$(.*?)\$/g, '<span class="inline-math">$1</span>');
}

const reportCss = `
  @page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  .page-break { page-break-after: always; height: 0; }
  
  h1 {
    color: #0f172a;
    font-size: 19pt;
    font-weight: 800;
    margin-top: 22pt;
    margin-bottom: 10pt;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 5pt;
    page-break-after: avoid;
  }

  h2 {
    color: #1e3a8a;
    font-size: 14pt;
    font-weight: 700;
    margin-top: 16pt;
    margin-bottom: 8pt;
    page-break-after: avoid;
  }

  h3 {
    color: #1e40af;
    font-size: 12pt;
    font-weight: 600;
    margin-top: 12pt;
    margin-bottom: 6pt;
    page-break-after: avoid;
  }

  h4 {
    color: #334155;
    font-size: 11pt;
    font-weight: 600;
    margin-top: 10pt;
    margin-bottom: 4pt;
    page-break-after: avoid;
  }

  p {
    margin-top: 0;
    margin-bottom: 9pt;
    text-align: justify;
  }

  li {
    margin-bottom: 4pt;
    margin-left: 20pt;
  }

  .numbered-item {
    margin-bottom: 4pt;
    margin-left: 10pt;
  }

  pre.code-block {
    background: #0f172a;
    color: #f8fafc;
    padding: 9pt 12pt;
    border-radius: 5pt;
    font-family: "Cascadia Code", Consolas, Monaco, monospace;
    font-size: 9pt;
    line-height: 1.45;
    overflow-x: auto;
    margin: 9pt 0;
    page-break-inside: avoid;
  }

  code.inline-code {
    background: #f1f5f9;
    color: #0958d9;
    padding: 1pt 4pt;
    border-radius: 3pt;
    font-family: Consolas, monospace;
    font-size: 9pt;
    border: 1px solid #e2e8f0;
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }

  .report-table th {
    background: #1e3a8a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 6pt 8pt;
    border: 1px solid #1e3a8a;
  }

  .report-table td {
    padding: 5pt 8pt;
    border: 1px solid #cbd5e1;
  }

  .report-table tr:nth-child(even) {
    background: #f8fafc;
  }

  .figure-container {
    text-align: center;
    margin: 14pt 0;
    page-break-inside: avoid;
  }

  .figure-img {
    max-width: 95%;
    height: auto;
    border: 1px solid #cbd5e1;
    border-radius: 5pt;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .figure-caption {
    font-size: 9pt;
    font-weight: 600;
    color: #475569;
    margin-top: 5pt;
    text-align: center;
    font-style: italic;
  }

  .divider {
    border: 0;
    height: 1px;
    background: #e2e8f0;
    margin: 16pt 0;
  }

  .math-block {
    text-align: center;
    font-family: "Cambria Math", "Times New Roman", serif;
    font-size: 11pt;
    margin: 8pt 0;
    font-style: italic;
    background: #f8fafc;
    padding: 6pt;
    border-radius: 4pt;
  }

  .inline-math {
    font-family: "Cambria Math", "Times New Roman", serif;
    font-style: italic;
  }

  /* Cover Page Styling */
  .cover-page {
    text-align: center;
    padding: 20pt 5pt;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
`;

async function main() {
  console.log('[1/4] Reading Markdown source file...');
  const mdContent = fs.readFileSync(MD_PATH, 'utf8');

  console.log('[2/4] Generating styled HTML template...');
  const bodyHtml = markdownToHtml(mdContent);
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>BillFlow – B.Tech Course Project Report (SR University)</title>
<style>${reportCss}</style>
</head>
<body>
${bodyHtml}
</body>
</html>
  `;
  fs.writeFileSync(HTML_PATH, fullHtml, 'utf8');
  console.log('✓ Created report_template.html (' + fullHtml.length + ' bytes)');

  console.log('[3/4] Compiling to PDF via Chrome Headless Engine...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('file:///' + HTML_PATH.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 20mm;">SR University – DevOps & Full Stack Development (23CS102PE405)</div>',
    footerTemplate: '<div style="font-size: 8pt; color: #94a3b8; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  });
  await browser.close();
  console.log('✓ Successfully compiled BILLFLOW_PROJECT_REPORT.pdf');

  // Verify PDF page count
  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const pageMatches = pdfBuffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  const pageCount = pageMatches ? pageMatches.length : 0;
  console.log(`✓ Official PDF Page Count: ${pageCount} pages (Requirement: Minimum 45 pages)`);

  console.log('[4/4] Generating Microsoft Word (.docx) Document...');
  await generateDocx();
  console.log('✓ Successfully generated BILLFLOW_PROJECT_REPORT.docx');

  console.log('\n======================================================');
  console.log('ALL DOCUMENTATION DELIVERABLES CREATED SUCCESSFULLY!');
  console.log('1. Markdown:  ' + MD_PATH);
  console.log(`2. PDF:       ${PDF_PATH} (${pageCount} Pages)`);
  console.log('3. Word Doc:  ' + DOCX_PATH);
  console.log('4. HTML:      ' + HTML_PATH);
  console.log('======================================================\n');
}

async function generateDocx() {
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const lines = md.split('\n');
  const children = [];

  let inTable = false;
  let tableRows = [];

  function flushDocxTable() {
    if (inTable && tableRows.length > 0) {
      const docxRows = tableRows.map((row, rowIndex) => {
        const isHeader = rowIndex === 0;
        return new TableRow({
          children: row.map(cellText => {
            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText.replace(/[*_`]/g, ''),
                      bold: isHeader,
                      color: isHeader ? 'FFFFFF' : '0F172A',
                      size: isHeader ? 19 : 18,
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              shading: isHeader ? { fill: '1E3A8A' } : (rowIndex % 2 === 0 ? { fill: 'F8FAFC' } : { fill: 'FFFFFF' }),
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            });
          }),
        });
      });

      children.push(
        new Table({
          rows: docxRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      inTable = false;
      tableRows = [];
    }
  }

  for (let line of lines) {
    if (line.includes('\\newpage')) {
      flushDocxTable();
      children.push(new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true }));
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      if (line.includes('---')) continue;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushDocxTable();
    }

    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (line.startsWith('![')) {
      const m = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (m) {
        const alt = m[1];
        const src = path.join(DOC_DIR, m[2]);
        if (fs.existsSync(src)) {
          try {
            const imgBuffer = fs.readFileSync(src);
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imgBuffer,
                    transformation: { width: 550, height: 320 },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 60 },
              })
            );
            children.push(
              new Paragraph({
                children: [new TextRun({ text: alt, italics: true, size: 18, color: '475569' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
              })
            );
          } catch (e) {
            console.warn('Docx image embedding warning:', e.message);
          }
        }
      }
    } else if (line.trim().length > 0 && !line.startsWith('<') && !line.startsWith('```')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/[*_`]/g, ''), size: 21 })],
          spacing: { after: 90 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
  }

  flushDocxTable();

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(DOCX_PATH, buffer);
}

main().catch(err => {
  console.error('Fatal error during documentation compilation:', err);
  process.exit(1);
});
