// Word (.docx) export — mirrors the compiled report document.

import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { allIcamFactors, fmtDate, ICAM_KINDS, ICAM_ORDER } from './model.js';

const INK = '1F1C18';
const MUTED = '8B8378';
const ACCENT = 'B5431D';

const sortKey = (t) => `${t.date || '9999-99-99'}T${t.time || '99:99'}`;

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, color: INK })],
  });

const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, color: INK })],
  });

const para = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        color: opts.muted ? MUTED : INK,
        italics: opts.italics,
        bold: opts.bold,
      }),
    ],
  });

// multi-line text → one Paragraph per line
const multiline = (text, placeholder) => {
  if (!text || !text.trim()) return [para(placeholder, { muted: true, italics: true })];
  return text
    .split('\n')
    .filter((l) => l.trim().length)
    .map((l) => para(l));
};

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'D8D3C8' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D8D3C8' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'D8D3C8' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'D8D3C8' },
};

const cell = (text, { header = false, width } = {}) =>
  new TableCell({
    borders: cellBorders,
    shading: header ? { fill: 'EFECE5' } : undefined,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || '—', bold: header, size: 19, color: INK })],
      }),
    ],
  });

const table = (headers, rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((h) => cell(h, { header: true })), tableHeader: true }),
      ...rows.map((r) => new TableRow({ children: r.map((v) => cell(v)) })),
    ],
  });

export const exportDocx = async (inv) => {
  const r = inv.report;
  const d = inv.details;
  const timeline = [...inv.timeline].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const factors = allIcamFactors(inv);
  const evRefs = (ids) =>
    ids.map((id) => inv.evidence.find((e) => e.id === id)?.ref).filter(Boolean).join(', ');

  const children = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'INCIDENT INVESTIGATION REPORT',
          color: ACCENT,
          bold: true,
          size: 18,
          characterSpacing: 30,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 60 },
      children: [new TextRun({ text: inv.title, color: INK })],
    }),
    para(`${inv.ref} · ${inv.status}`, { muted: true }),

    table(
      ['Field', 'Value', 'Field', 'Value'],
      [
        [
          'Date occurred',
          `${fmtDate(d.occurredOn) || '—'}${d.occurredTime ? `, ${d.occurredTime}` : ''}`,
          'Type',
          d.type,
        ],
        ['Site', d.site, 'Severity', d.severity],
        ['Location', d.location, 'Lead investigator', d.lead],
        ['Reported by', d.reportedBy, 'Report date', fmtDate(new Date().toISOString())],
      ]
    ),

    h2('1. Executive summary'),
    ...multiline(r.summary, 'No summary written.'),

    h2('2. The incident'),
    ...multiline(d.description, 'No description recorded.'),
  ];

  if (d.immediateActions.trim()) {
    children.push(h3('Immediate actions taken'), ...multiline(d.immediateActions));
  }

  children.push(h2('3. Sequence of events'));
  children.push(
    timeline.length
      ? table(
          ['Date', 'Time', 'Event', 'Evidence'],
          timeline.map((t) => [fmtDate(t.date), t.time, t.text, evRefs(t.evidenceIds)])
        )
      : para('No timeline entries.', { muted: true, italics: true })
  );

  children.push(h2('4. Evidence register'));
  children.push(
    inv.evidence.length
      ? table(
          ['Ref', 'Type', 'Item', 'Source'],
          inv.evidence.map((e) => [
            e.ref,
            e.type,
            e.description ? `${e.title} — ${e.description}` : e.title,
            e.source,
          ])
        )
      : para('No evidence logged.', { muted: true, italics: true })
  );

  let section = 5;
  if (inv.interviews.length) {
    children.push(h2(`${section}. Interviews`));
    section += 1;
    inv.interviews.forEach((iv) => {
      children.push(
        h3(
          `${iv.interviewee}${iv.role ? ` — ${iv.role}` : ''}${
            iv.conductedOn ? ` · ${fmtDate(iv.conductedOn)}` : ''
          }`
        ),
        ...multiline(iv.keyPoints, 'No key points recorded.')
      );
    });
  }

  children.push(h2(`${section}. Analysis`));
  section += 1;

  children.push(h3('5 Whys'));
  if (inv.fiveWhys.problem.trim()) {
    const rows = [['Problem', inv.fiveWhys.problem]];
    inv.fiveWhys.whys
      .filter((w) => w.answer.trim())
      .forEach((w, i) => {
        rows.push([
          `Why ${i + 1}`,
          w.evidenceIds.length ? `${w.answer} [${evRefs(w.evidenceIds)}]` : w.answer,
        ]);
      });
    if (inv.fiveWhys.rootCause.trim()) rows.push(['Root cause', inv.fiveWhys.rootCause]);
    children.push(table(['Step', 'Statement'], rows));
  } else {
    children.push(para('5 Whys not completed.', { muted: true, italics: true }));
  }

  children.push(h3('ICAM contributing factors'));
  children.push(
    factors.length
      ? table(
          ['Category', 'Factor', 'Classification', 'Evidence'],
          ICAM_ORDER.flatMap((k) =>
            inv.icam[k].map((f) => [ICAM_KINDS[k].short, f.text, f.rating, evRefs(f.evidenceIds)])
          )
        )
      : para('No ICAM factors recorded.', { muted: true, italics: true })
  );

  if (inv.hfat.length) {
    children.push(h3('Human factors (mini-HFAT)'));
    inv.hfat.forEach((h, i) => {
      children.push(
        para(
          `Analysis ${i + 1}${h.actionError.type ? ` — ${h.actionError.type}` : ''}${
            h.actionError.description ? `: ${h.actionError.description}` : ''
          }`,
          { bold: true }
        )
      );
      if (h.conditions.length) {
        children.push(
          para(
            `Performance-shaping conditions: ${h.conditions
              .map((c) => `${c.condition} (${c.level.toLowerCase()})`)
              .join(', ')}`,
            { muted: true }
          )
        );
      }
      if (h.summary.trim()) children.push(...multiline(h.summary));
    });
  }

  children.push(h2(`${section}. Key findings`));
  section += 1;
  children.push(...multiline(r.keyFindings, 'No findings written.'));

  children.push(h2(`${section}. Corrective actions`));
  section += 1;
  children.push(
    inv.actions.length
      ? table(
          ['Action', 'Owner', 'Due', 'Control', 'Status'],
          inv.actions.map((a) => [
            a.detail ? `${a.title} — ${a.detail}` : a.title,
            a.owner,
            fmtDate(a.due),
            a.hierarchy,
            a.status,
          ])
        )
      : para('No corrective actions recorded.', { muted: true, italics: true })
  );

  children.push(h2(`${section}. Conclusions`));
  children.push(...multiline(r.conclusions, 'No conclusions written.'));

  children.push(
    new Paragraph({ spacing: { before: 360 }, children: [] }),
    table(
      ['Prepared by', 'Approved by'],
      [[r.preparedBy || '—', r.approvedBy || '—']]
    )
  );

  const doc = new Document({
    creator: 'Incident Portal',
    title: `${inv.ref} — ${inv.title}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 21, color: INK } },
        heading1: { run: { font: 'Cambria', size: 40, bold: true } },
        heading2: { run: { font: 'Cambria', size: 26, bold: true } },
        heading3: { run: { font: 'Calibri', size: 22, bold: true } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${inv.ref} ${inv.title}.docx`.replace(/[/\\:*?"<>|]/g, '-');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
