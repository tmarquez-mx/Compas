// Referencia fechada en borrador; no es una normativa oficial.
const ROUTE_VERSION = "borrador-2026-09-10";
const LEVELS = { maestria: "Maestría", doctorado: "Doctorado" };
const ROUTE_STATES = {
  pendiente: "Por trabajar",
  "en-proceso": "En desarrollo",
  bloqueado: "Necesita ajuste",
  resuelto: "Realizado",
};
const REVIEWS = {
  "sin-revision": "Sin revisión registrada",
  "por-revisar": "Para revisión",
  revisado: "Revisión registrada",
  aprobado: "Aprobación registrada",
};
const ROUTES = {
  maestria: [
    {
      semester: 1,
      title: "Plantear el proyecto",
      spaces: "Metodología de la investigación",
      note: "Proyecto aprobado y desarrollo de habilidades de investigación. Si cambia el tema, el borrador indica entregar el nuevo proyecto al finalizar el semestre para obtener calificación aprobatoria. Compás no asigna calificaciones.",
      products: [
        [
          "m1-protocolo",
          "protocolo",
          "Protocolo de investigación",
          "Protocolo con revisión de literatura. Registrar la aprobación del proyecto cuando corresponda.",
        ],
      ],
    },
    {
      semester: 2,
      title: "Construir el diseño",
      spaces:
        "Métodos cualitativos de la investigación social / Métodos cuantitativos de la investigación social",
      note: "Diseño metodológico y técnicas de recolección y análisis (codificación y sistematización), revisados por la dirección de tesis.",
      products: [
        [
          "m2-metodo",
          "metodo",
          "Capítulo metodológico e instrumento",
          "Capítulo metodológico con diseño del instrumento; documentar su revisión con la dirección.",
        ],
      ],
    },
    {
      semester: 3,
      title: "Presentar y construir datos",
      spaces: "Coloquio de tesistas · Seminario de investigación 1",
      note: "El borrador pide presentar el 50% de la tesis: planteamiento y diseño, incluidos los instrumentos de recopilación. Es una referencia textual; Compás no calcula ese porcentaje.",
      products: [
        [
          "m3-coloquio",
          "coloquio",
          "Presentación de avances en coloquio",
          "Planteamiento y diseño, incluidos los instrumentos de recopilación de datos.",
        ],
        [
          "m3-datos",
          "datos",
          "Recolección y sistematización",
          "El borrador menciona transcripciones, bases de datos analizadas y notas de campo. Registra aquí solo una descripción del avance, sin adjuntar esos datos.",
        ],
      ],
    },
    {
      semester: 4,
      title: "Analizar e integrar el borrador",
      spaces: "Seminario de investigación 2 · Seminario de análisis de datos",
      note: "Ambos productos se indican como “subido en BS”. El borrador no fija un mes ni una fecha de defensa.",
      products: [
        [
          "m4-borrador",
          "tesis",
          "Borrador de tesis",
          "Integrar el borrador y registrar su entrega en BS.",
        ],
        [
          "m4-analisis",
          "analisis",
          "Análisis de datos",
          "Documentar el avance del análisis y su entrega en BS, sin cargar datos de investigación en Compás.",
        ],
      ],
    },
  ],
  doctorado: [
    {
      semester: 1,
      title: "Fundamentar el proyecto",
      spaces: "Metodología de la investigación social",
      note: "Proyecto aprobado y habilidades de investigación. El borrador no especifica quién aprueba el proyecto.",
      products: [
        [
          "d1-proyecto",
          "proyecto",
          "Proyecto de investigación",
          "Registrar el proyecto y su aprobación cuando corresponda.",
        ],
        [
          "d1-estado",
          "literatura",
          "Estado del arte",
          "Formas de construcción y contenido del estado del arte.",
        ],
      ],
    },
    {
      semester: 2,
      title: "Desarrollar con supervisión",
      spaces:
        "Métodos cualitativos de la investigación social / Métodos cuantitativos de la investigación social · Coloquio de Tesistas (verano)",
      note: "Productos con la supervisión de la directora o director. En este semestre no se establece todavía su aprobación.",
      products: [
        [
          "d2-teoria",
          "teoria",
          "Marco teórico",
          "Desarrollar el marco teórico con supervisión.",
        ],
        [
          "d2-metodo",
          "metodo",
          "Diseño metodológico e instrumentos",
          "Desarrollar el diseño metodológico y los instrumentos con supervisión.",
        ],
        [
          "d2-coloquio",
          "coloquio",
          "Coloquio de Tesistas de verano",
          "Registrar la participación o presentación en el coloquio; verano es la referencia del borrador.",
        ],
      ],
    },
    {
      semester: 3,
      title: "Revisar y obtener aprobación",
      spaces: "Seminario de investigación 1",
      note: "El borrador pide aprobación del marco teórico, diseño metodológico e instrumentos por la dirección. Continúa el trabajo del semestre 2; conserva sus versiones.",
      products: [
        [
          "d3-teoria",
          "teoria",
          "Marco teórico: etapa de aprobación",
          "Registrar la versión aprobada por la dirección.",
        ],
        [
          "d3-metodo",
          "metodo",
          "Diseño e instrumentos: etapa de aprobación",
          "Registrar la versión del diseño metodológico y los instrumentos aprobada por la dirección.",
        ],
      ],
    },
    {
      semester: 4,
      title: "Integrar y presentar candidatura",
      spaces:
        "Seminario de investigación 2 · Examen de candidatura como parte del Coloquio de Tesistas",
      note: "El examen de candidatura corresponde a este semestre. Registrar su realización no equivale a registrar un resultado aprobatorio.",
      products: [
        [
          "d4-planteamiento",
          "proyecto",
          "Planteamiento",
          "Integrar el planteamiento de la investigación.",
        ],
        [
          "d4-literatura",
          "literatura",
          "Revisión de literatura",
          "Integrar la revisión de literatura para esta etapa.",
        ],
        [
          "d4-teoria",
          "teoria",
          "Marco teórico integrado",
          "Integrar la versión del marco teórico para esta etapa.",
        ],
        [
          "d4-metodo",
          "metodo",
          "Descripción de métodos e instrumentos",
          "Integrar la descripción de métodos y el diseño de instrumentos.",
        ],
        [
          "d4-candidatura",
          "candidatura",
          "Examen de candidatura",
          "Registrar la realización del examen y, por separado, el resultado comunicado.",
        ],
      ],
    },
    {
      semester: 5,
      title: "Construir y sistematizar",
      spaces: "Seminario de investigación 3",
      note: "Recolección y sistematización de datos. Registra decisiones y revisiones de avance, sin cargar los datos.",
      products: [
        [
          "d5-datos",
          "datos",
          "Recolección y sistematización",
          "Documentar el avance de la construcción y organización de datos.",
        ],
      ],
    },
    {
      semester: 6,
      title: "Continuar y presentar avances",
      spaces: "Seminario de investigación 4 · Coloquio de Tesistas",
      note: "El borrador incluye “habilitación para construcción de datos” y presentar el 70% de la tesis en el coloquio. Se conserva esa formulación; no define cómo calcular el porcentaje.",
      products: [
        [
          "d6-datos",
          "datos",
          "Recolección y sistematización: continuidad",
          "Continuar el producto del semestre 5 y registrar la versión o corte del avance.",
        ],
        [
          "d6-coloquio",
          "coloquio",
          "Presentación de avances en coloquio",
          "Referencia del borrador: presentar el 70% de la tesis. Compás no estima ese porcentaje.",
        ],
      ],
    },
    {
      semester: 7,
      title: "Interpretar y analizar",
      spaces: "Seminario de titulación 1 · Seminario de análisis de datos",
      note: "Interpretación y análisis de datos.",
      products: [
        [
          "d7-analisis",
          "analisis",
          "Interpretación y análisis",
          "Documentar el desarrollo de la interpretación y el análisis, mediante referencias generales a versiones.",
        ],
      ],
    },
    {
      semester: 8,
      title: "Integrar el borrador de tesis",
      spaces: "Seminario de titulación 2",
      note: "El borrador indica “Subir en BS — mayo”. No especifica día, año ni fecha de defensa.",
      products: [
        [
          "d8-borrador",
          "tesis",
          "Borrador de tesis",
          "Integrar el borrador y registrar su entrega en BS; mayo es la referencia del documento.",
        ],
      ],
    },
  ],
};
const MILESTONES = Object.entries(ROUTES).flatMap(([level, stages]) =>
  stages.flatMap((s) =>
    s.products.map(([id, work, title, expected]) => ({
      id,
      workId: level + "-" + work,
      title,
      expected,
      level,
      semester: s.semester,
      spaces: s.spaces,
      note: s.note,
      templateVersion: ROUTE_VERSION,
    })),
  ),
);
const milestonesById = new Map(
  MILESTONES.map((product) => [product.id, product]),
);
const milestone = (id) => milestonesById.get(id);
