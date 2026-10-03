function xml(v) {
  return String(v == null ? "" : v)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    );
}
function zipStore(files) {
  const enc = new TextEncoder();
  let offset = 0;
  const pieces = [],
    centrals = [];
  const crc = (b) => {
    let c = 0xffffffff;
    for (const x of b) {
      c ^= x;
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
  };
  const header = (n) => new Uint8Array(n);
  for (const [name, content] of files) {
    const fn = enc.encode(name),
      data = enc.encode(content),
      sum = crc(data);
    const h = header(30),
      v = new DataView(h.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(10, 0, true);
    v.setUint16(12, 33, true);
    v.setUint32(14, sum, true);
    v.setUint32(18, data.length, true);
    v.setUint32(22, data.length, true);
    v.setUint16(26, fn.length, true);
    pieces.push(h, fn, data);
    const c = header(46),
      cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(14, 33, true);
    cv.setUint32(16, sum, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, fn.length, true);
    cv.setUint32(42, offset, true);
    centrals.push(c, fn);
    offset += h.length + fn.length + data.length;
  }
  const size = centrals.reduce((n, x) => n + x.length, 0),
    end = header(22),
    ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, size, true);
  ev.setUint32(16, offset, true);
  const all = [...pieces, ...centrals, end];
  const result = new Uint8Array(all.reduce((n, x) => n + x.length, 0));
  let n = 0;
  for (const x of all) {
    result.set(x, n);
    n += x.length;
  }
  return result;
}
function excelBytes(r) {
  const projectLabels = {
    level: "Nivel",
    title: "Título de la tesis",
    student: "Tesista",
    director: "Dirección de tesis",
    program: "Programa",
    generation: "Generación",
    semester: "Semestre",
    line: "Línea de investigación",
    question: "Pregunta de investigación",
    objectives: "Objetivos",
    approach: "Enfoque metodológico",
    scope: "Alcance y límites",
    milestone: "Próximo hito",
    milestoneDate: "Fecha del próximo hito",
  };
  const sheets = [
    [
      "Rumbo",
      [
        ["Campo", "Contenido"],
        ["Reporte", r.title],
        ["Fecha de corte", r.to || today()],
        ["Generado", r.generatedAt],
        [
          "Aviso",
          "Copia de los registros seleccionados; no se actualiza automáticamente.",
        ],
        ...(r.project
          ? Object.entries(r.project).map(([k, v]) => [
              projectLabels[k] || k,
              k === "level" ? LEVELS[v] || "" : v,
            ])
          : []),
        ["Institución", FOOTER],
      ],
    ],
    [
      "Compromisos",
      [
        [
          "Compromiso",
          "Origen",
          "Comentario",
          "Decisión",
          "Justificación",
          "Responsable",
          "Fecha",
          "Prioridad",
          "Estado",
          "Evidencia",
          "Respuesta",
        ],
        ...r.actions.map((a) => [
          a.description,
          a.sourceLabel,
          a.comment,
          DISPOSITIONS[a.disposition],
          a.rationale,
          a.owner || "",
          a.due,
          a.priority,
          STATES[a.status],
          a.evidence,
          a.response,
        ]),
      ],
    ],
    [
      "Decisiones",
      [
        [
          "Fecha",
          "Decisión",
          "Antes",
          "Ahora",
          "Motivo",
          "Alternativas",
          "Consecuencias",
          "Pregunta",
          "Fundamento",
          "Viabilidad",
          "Ética",
          "Revisar",
        ],
        ...r.decisions.map((d) => [
          d.date,
          d.title,
          d.previous,
          d.current,
          d.reason,
          d.alternatives,
          d.impact,
          d.questionCheck,
          d.basisCheck,
          d.feasibilityCheck,
          d.ethicsCheck,
          d.reviewDate,
        ]),
      ],
    ],
    [
      "Sesiones",
      [
        [
          "Fecha",
          "Tipo",
          "Sesión",
          "Participantes",
          "Avance presentado",
          "Agenda",
          "Avances",
          "Síntesis",
          "Revisión registrada por tesista",
          "Próxima fecha",
        ],
        ...r.sessions.map((s) => [
          s.date,
          s.type === "coloquio" ? "Coloquio" : "Asesoría de tesis",
          s.title,
          s.participants || "",
          s.presented,
          s.agenda,
          s.advances,
          s.summary,
          s.reviewed === "revisado"
            ? "Revisada con dirección; sin firma verificada"
            : "Pendiente de revisión",
          s.nextDate,
        ]),
      ],
    ],
  ];
  sheets.push([
    "Mi ruta",
    [
      [
        "Nivel",
        "Producto",
        "Semestre de referencia",
        "Semestre en mi plan",
        "Fecha planeada",
        "Estado",
        "Versión del producto",
        "Referencia de avance",
        "Motivo del ajuste",
        "Revisión registrada por tesista",
        "Persona que revisó",
        "Fecha de revisión",
        "Último registro",
        "Versión del borrador",
        "Aviso",
      ],
      ...(r.route || []).map((x) => [
        x.level,
        x.title,
        x.referenceSemester,
        x.planSemester,
        x.due,
        ROUTE_STATES[x.status],
        x.versionLabel,
        x.evidence,
        x.adjustmentReason,
        REVIEWS[x.reviewState],
        x.reviewBy || "",
        x.reviewDate,
        x.updatedAt,
        x.templateVersion,
        "Ruta de referencia en borrador. Registro del tesista; sin firma ni VoBo verificado. No mide porcentaje de avance de tesis.",
      ]),
    ],
  ]);
  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const files = [
    [
      "[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets
          .map(
            (_, i) =>
              '<Override PartName="/xl/worksheets/sheet' +
              (i + 1) +
              '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
          )
          .join("") +
        "</Types>",
    ],
    [
      "_rels/.rels",
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ],
    [
      "xl/workbook.xml",
      '<workbook xmlns="' +
        ns +
        '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        sheets
          .map(
            ([name], i) =>
              '<sheet name="' +
              xml(name) +
              '" sheetId="' +
              (i + 1) +
              '" r:id="rId' +
              (i + 1) +
              '"/>',
          )
          .join("") +
        "</sheets></workbook>",
    ],
    [
      "xl/_rels/workbook.xml.rels",
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets
          .map(
            (_, i) =>
              '<Relationship Id="rId' +
              (i + 1) +
              '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' +
              (i + 1) +
              '.xml"/>',
          )
          .join("") +
        '<Relationship Id="rId' +
        (sheets.length + 1) +
        '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    ],
    [
      "xl/styles.xml",
      '<styleSheet xmlns="' +
        ns +
        '"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE00034"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    ],
  ];
  sheets.forEach(([, rows], i) =>
    files.push([
      "xl/worksheets/sheet" + (i + 1) + ".xml",
      '<worksheet xmlns="' +
        ns +
        '"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' +
        rows[0]
          .map(
            (_, n) =>
              '<col min="' +
              (n + 1) +
              '" max="' +
              (n + 1) +
              '" width="' +
              (i === 0 && n === 1 ? 90 : 32) +
              '" customWidth="1"/>',
          )
          .join("") +
        "</cols><sheetData>" +
        rows
          .map(
            (row, j) =>
              '<row r="' +
              (j + 1) +
              '"' +
              (j === 0 ? ' ht="30" customHeight="1"' : "") +
              ">" +
              row
                .map(
                  (value, k) =>
                    '<c r="' +
                    String.fromCharCode(65 + k) +
                    (j + 1) +
                    '" t="inlineStr" s="' +
                    (j === 0 ? 1 : 0) +
                    '"><is><t xml:space="preserve">' +
                    xml(value) +
                    "</t></is></c>",
                )
                .join("") +
              "</row>",
          )
          .join("") +
        '</sheetData><autoFilter ref="A1:' +
        String.fromCharCode(64 + rows[0].length) +
        rows.length +
        '"/></worksheet>',
    ]),
  );
  return zipStore(files);
}
// Local ToDo import. These helpers run in the CompasCore scope; no network or storage.
