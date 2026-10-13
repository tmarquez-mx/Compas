// Detalles de celebración originales. El centro de la foto queda libre.
function celebrationArtwork(kind) {
  let drawing = "";
  if (kind === "velas") {
    drawing =
      '<g stroke="#aa805d" stroke-width="1"><path d="M7 168H48" stroke-width="2" stroke-linecap="round"/><rect x="10" y="135" width="18" height="32" rx="3" fill="#ead8af"/><path d="M10 140Q19 145 28 140" fill="none"/><rect x="32" y="145" width="12" height="22" rx="2" fill="#dca897"/><path d="M19 133V128M38 143V138" stroke="#6b5945"/><path d="M19 128Q10 124 19 111Q29 123 19 128ZM38 138Q31 134 38 124Q45 133 38 138Z" fill="#ecb34e" stroke="#cc9240"/><path d="M19 126Q16 121 20 117Q24 123 19 126ZM38 136Q36 131 39 129Q42 134 38 136Z" fill="#fff0b9" stroke="none"/></g><g fill="none" stroke="#d5b16d" stroke-width="1.3" stroke-linecap="round"><path d="M160 8V18M155 13H165M170 28V34M167 31H173"/></g>';
  } else if (kind === "copas") {
    const glass =
      '<path d="M8 0H29L26 24Q18.5 32 11 24Z" fill="#f4ecd7" fill-opacity=".82" stroke="#a88c5f" stroke-width="1.4"/><path d="M10 13H27L25 23Q18.5 28 12 23Z" fill="#d9b762" fill-opacity=".85"/><path d="M18.5 29V49M9 50H28" fill="none" stroke="#a88c5f" stroke-width="1.8" stroke-linecap="round"/>';
    drawing =
      '<g transform="translate(-1 121) rotate(-14 18 25)">' +
      glass +
      '</g><g transform="translate(27 112) rotate(14 18 25)">' +
      glass +
      '</g><g fill="none" stroke="#c7a25c" stroke-width="1.6" stroke-linecap="round"><path d="M26 111 23 105M33 109 35 102M160 9V21M154 15H166M171 29V35M168 32H174"/></g>';
  } else if (kind === "globos") {
    drawing =
      '<g fill="none" stroke="#9c8b70" stroke-width="1" stroke-linecap="round"><path d="M145 32Q126 58 142 78T153 107M167 39Q181 65 162 88"/></g><ellipse cx="145" cy="17" rx="13" ry="17" transform="rotate(-15 145 17)" fill="#7dafae" stroke="#4d8589" stroke-width="1.1"/><path d="m143 33-3 5 7-1Z" fill="#4d8589"/><ellipse cx="166" cy="24" rx="12" ry="16" transform="rotate(13 166 24)" fill="#e3a48d" stroke="#ba7c64" stroke-width="1.1"/><path d="m166 40-3 4 6 1Z" fill="#ba7c64"/><path d="M140 8Q136 13 139 19M162 16Q159 20 161 24" fill="none" stroke="#f5f0df" stroke-width="2" stroke-linecap="round" opacity=".8"/><path d="M8 155Q-2 160 9 166T8 176" fill="none" stroke="#b395bd" stroke-width="2"/>';
  } else if (kind === "cumpleanos") {
    drawing =
      '<path d="M13 1Q87 20 169 1" fill="none" stroke="#967d60" stroke-width="1"/><path d="m26 4 13 3-9 14Z" fill="#d08a73"/><path d="m53 9 13 2-8 14Z" fill="#6d9b97"/><path d="m82 11 13 0-7 15Z" fill="#d9b15d"/><path d="m111 9 13-2-4 15Z" fill="#b19bbb"/><path d="m139 5 13-3-2 15Z" fill="#6d9b97"/><path d="M4 171H57" stroke="#a28966" stroke-width="2" stroke-linecap="round"/><rect x="9" y="150" width="42" height="20" rx="3" fill="#dfaa92" stroke="#a98169" stroke-width="1"/><path d="M9 156V151Q12 145 18 150Q24 144 30 150Q36 144 42 150Q48 145 51 151V156Q47 162 43 156Q38 163 33 156Q28 162 23 156Q16 163 12 157Z" fill="#f5e8c9"/><path d="M21 147V139M38 147V139" stroke="#71999b" stroke-width="3"/><path d="M21 137Q15 134 21 127Q27 134 21 137ZM38 137Q32 134 38 127Q44 134 38 137Z" fill="#e9b654"/>';
  } else if (kind === "confeti") {
    drawing =
      '<g fill="none" stroke-linecap="round" stroke-width="2"><path d="M7 135Q-3 140 8 146T7 159" stroke="#ba9bbc"/><path d="M154 5Q148-1 146 8T137 10" stroke="#659da0"/><path d="M170 49 175 56M25 166 30 174M120 8 125 14" stroke="#d5ac52"/><path d="M13 112 8 118M154 28 149 34M46 164 50 158" stroke="#d28a73"/></g><g fill="#d5ac52"><circle cx="15" cy="152" r="2.5"/><circle cx="164" cy="11" r="2"/></g><g fill="#659da0"><path d="m32 147 6 3-4 5-6-3Z"/><path d="m168 34 5 2-3 5-5-2Z"/></g><g fill="#ba9bbc"><path d="m139 29 3 6 6 1-5 4 1 6-5-3-6 2 2-6-4-4 6-1Z"/></g>';
  }
  return drawing
    ? '<svg viewBox="0 0 180 180" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
        drawing +
        "</svg>"
    : "";
}
