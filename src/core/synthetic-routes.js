// Propuestas de trabajo, no planes institucionales. Cada versión tendrá un identificador propio.
const SYNTHETIC_PROGRAMS = [
  ["sociologia", "maestria", "Maestría en Sociología", "empirical"],
  [
    "csp",
    "doctorado",
    "Doctorado en Ciencias Sociales y Políticas",
    "empirical",
  ],
  [
    "antropologia",
    "maestria",
    "Maestría en Antropología Social",
    "anthropology",
  ],
  [
    "antropologia",
    "doctorado",
    "Doctorado en Antropología Social",
    "anthropology",
  ],
  [
    "derechos-humanos",
    "doctorado",
    "Doctorado Interinstitucional en Derechos Humanos",
    "humanities",
  ],
  [
    "ingenieria",
    "doctorado",
    "Doctorado en Ciencias de la Ingeniería",
    "engineering",
  ],
  ["comunicacion", "doctorado", "Doctorado en Comunicación", "empirical"],
  ["filosofia", "doctorado", "Doctorado en Filosofía", "humanities"],
  ["historia", "doctorado", "Doctorado en Historia", "humanities"],
  [
    "historia-arte",
    "doctorado",
    "Doctorado en Historia y Teoría Crítica del Arte",
    "humanities",
  ],
  [
    "psicologia",
    "doctorado",
    "Doctorado en Investigación Psicológica",
    "health",
  ],
  [
    "educacion",
    "doctorado",
    "Doctorado Interinstitucional en Educación",
    "empirical",
  ],
  ["letras", "doctorado", "Doctorado en Letras Modernas", "humanities"],
  [
    "ingenieria",
    "maestria",
    "Maestría en Ciencias de la Ingeniería",
    "engineering",
  ],
  ["arte", "maestria", "Maestría en Estudios del Arte", "humanities"],
  ["historia", "maestria", "Maestría en Historia", "humanities"],
  ["nutriologia", "maestria", "Maestría en Nutriología Aplicada", "health"],
  ["obesidad", "maestria", "Maestría en Obesidad y Comorbilidades", "health"],
  [
    "genero",
    "doctorado",
    "Doctorado en Estudios Críticos de Género",
    "empirical",
  ],
];
const SYNTHETIC_PROFILES = {
  empirical: {
    design: "Diseño de investigación y estrategia de análisis",
    material: "Datos, fuentes o materiales organizados",
    analysis: "Análisis y discusión de hallazgos",
    description:
      "Define cómo responderás la pregunta mediante fuentes documentales, datos cualitativos, cuantitativos u otra estrategia pertinente.",
  },
  anthropology: {
    design: "Diseño del trabajo de campo o investigación documental",
    material: "Materiales de campo o corpus documental organizados",
    analysis: "Interpretación y argumento antropológico",
    description:
      "Delimita los materiales, contextos y estrategia de investigación. Revisa con tu dirección las condiciones de acceso y las consideraciones éticas que correspondan.",
  },
  humanities: {
    design: "Corpus y estrategia de lectura, comparación o interpretación",
    material: "Corpus, fuentes, textos u obras organizados",
    analysis: "Argumento y análisis del corpus",
    description:
      "Selecciona las fuentes, textos, documentos u obras pertinentes y explica cómo construirás y sostendrás el argumento. Adapta esta propuesta al enfoque de tu tesis.",
  },
  engineering: {
    design: "Diseño técnico y plan de validación",
    material: "Modelo, desarrollo, experimento o prototipo documentado",
    analysis: "Resultados de validación y discusión técnica",
    description:
      "Define el desarrollo o estudio que realizarás, cómo lo documentarás y con qué criterios contrastarás sus resultados. Un prototipo no es obligatorio: adapta el producto a tu proyecto.",
  },
  health: {
    design: "Protocolo, método y consideraciones éticas",
    material: "Estudio, revisión o intervención documentada",
    analysis: "Resultados y discusión de la investigación",
    description:
      "Define el tipo de estudio, revisión o intervención y la estrategia de análisis. Consulta con tu dirección qué autorizaciones y revisiones éticas requiere tu proyecto; esta ruta no las sustituye.",
  },
};
function syntheticTemplates() {
  return SYNTHETIC_PROGRAMS.map(([slug, level, program, field]) => {
    const id = "sintetica-" + slug + "-" + level,
      profile = SYNTHETIC_PROFILES[field];
    const stages =
      level === "maestria"
        ? [
            {
              title: "Delimitar el proyecto",
              products: [
                [
                  "proyecto",
                  "Propuesta de investigación",
                  "Delimita problema, pregunta, alcance y antecedentes con tu dirección.",
                ],
                [
                  "literatura",
                  "Revisión de antecedentes",
                  "Organiza bibliografía o fuentes relevantes y explica la aportación buscada.",
                ],
              ],
            },
            {
              title: "Diseñar la investigación",
              products: [["diseno", profile.design, profile.description]],
            },
            {
              title: "Desarrollar e interpretar",
              products: [
                [
                  "materiales",
                  profile.material,
                  "Documenta el avance y las decisiones. Conserva datos y materiales de investigación fuera de Compás.",
                ],
                [
                  "analisis",
                  profile.analysis,
                  "Relaciona los resultados o interpretaciones con la pregunta y el marco del proyecto.",
                ],
              ],
            },
            {
              title: "Integrar y revisar",
              products: [
                [
                  "tesis",
                  "Borrador integrado y revisado",
                  "Integra la tesis, registra las revisiones y acuerda la entrega con tu dirección según los requisitos del programa.",
                ],
              ],
            },
          ]
        : [
            {
              title: "Delimitar problema y aportación",
              products: [
                [
                  "proyecto",
                  "Propuesta doctoral",
                  "Delimita problema, pregunta, alcance y aportación original buscada.",
                ],
              ],
            },
            {
              title: "Construir los fundamentos",
              products: [
                [
                  "literatura",
                  "Antecedentes y marco de referencia",
                  "Relaciona literatura, fuentes o debates con la aportación de tu proyecto.",
                ],
              ],
            },
            {
              title: "Diseñar y revisar la estrategia",
              products: [["diseno", profile.design, profile.description]],
            },
            {
              title: "Revisar viabilidad y primeros avances",
              products: [
                [
                  "diseno",
                  "Diseño revisado y primeros avances",
                  "Contrasta la viabilidad del diseño con tu dirección y registra ajustes. No equivale a una candidatura o aprobación institucional.",
                ],
              ],
            },
            {
              title: "Desarrollar la investigación",
              products: [
                [
                  "materiales",
                  profile.material,
                  "Documenta avances y decisiones; conserva los materiales y datos de investigación fuera de Compás.",
                ],
              ],
            },
            {
              title: "Analizar y construir el argumento",
              products: [
                [
                  "analisis",
                  profile.analysis,
                  "Explica cómo tus resultados, interpretaciones o validaciones sostienen la aportación doctoral.",
                ],
              ],
            },
            {
              title: "Integrar la tesis",
              products: [
                [
                  "tesis",
                  "Borrador completo de tesis",
                  "Integra capítulos, argumento, límites y aportación para revisión con tu dirección.",
                ],
              ],
            },
            {
              title: "Revisar y preparar la entrega",
              products: [
                [
                  "tesis",
                  "Versión revisada y preparación de la entrega",
                  "Registra revisiones y prepara la entrega conforme a los requisitos reales del programa. No se presupone una fecha de defensa.",
                ],
              ],
            },
          ];
    return {
      id,
      level,
      title: program,
      program,
      department: "",
      status: "synthetic",
      version: "sintetica-2026-10-12",
      date: "2026-10-12",
      source:
        "Propuesta orientativa de Compás; pendiente de cotejo con la documentación del posgrado. La duración y los entregables no son requisitos oficiales.",
      stages: stages.map((s, i) => ({
        semester: i + 1,
        title: s.title,
        spaces: "",
        note: "",
        products: s.products.map(([work, title, expected], j) => [
          id + "-s" + (i + 1) + "-p" + (j + 1),
          work,
          title,
          expected,
        ]),
      })),
    };
  });
}
