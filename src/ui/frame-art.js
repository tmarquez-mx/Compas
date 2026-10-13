// Ornamentos originales en los bordes; Graduado añade un birrete sobre el retrato.
function frameArtwork(kind) {
  let drawing = "";
  if (kind === "mexicano") {
    const tile = (x, y) =>
      '<g transform="translate(' +
      x +
      " " +
      y +
      ')"><path d="M0-7C-7-9-10-2-3 0C-10 2-7 9 0 7C7 9 10 2 3 0C10-2 7-9 0-7Z" fill="#f2f0df"/><path d="M0-6V6M-6 0H6" stroke="#136a96" stroke-width="1.2"/><circle r="2" fill="#e6ae36"/></g>';
    for (const n of [10, 42, 74, 106, 138, 170])
      drawing += tile(n, 9) + tile(n, 171);
    for (const n of [42, 74, 106, 138]) drawing += tile(9, n) + tile(171, n);
    drawing +=
      '<path d="M22 17H158M22 163H158M17 22V158M163 22V158" fill="none" stroke="#e6ae36" stroke-width="1.6"/>';
  } else if (kind === "nemo") {
    drawing =
      '<g fill="none" stroke="#a2d7d6" stroke-width="1.5" opacity=".85"><circle cx="8" cy="38" r="3"/><circle cx="11" cy="64" r="2"/><circle cx="170" cy="90" r="3.8"/><circle cx="170" cy="119" r="2"/><path d="M25 7Q37 15 49 7T73 7T97 7T121 7T145 7M34 173Q46 164 58 173T82 173T106 173T130 173"/></g><path d="M10 168V136M10 152 4 145M10 145 17 136M10 162 20 151M165 12V38M165 24 157 18M165 30 174 21" fill="none" stroke="#f49458" stroke-width="3" stroke-linecap="round"/>';
  } else if (kind === "cubista") {
    drawing =
      '<g fill="none" stroke="#192b31" stroke-width="1.8"><path d="M2 30 28 2M152 2 178 35M2 140 33 178M145 178 178 145"/><path d="M1 80 16 94 1 109M179 65 164 80 179 98"/></g><path d="M5 3H35L16 18Z" fill="#e8c163"/><path d="M178 149V177H150Z" fill="#bc6046"/>';
  } else if (kind === "graduado") {
    drawing =
      '<path d="M9 27V156Q9 171 25 171H155Q171 171 171 155V27" fill="none" stroke="#cba862" stroke-width="1.3"/><g class="graduation-cap"><path d="M54 3V24Q90 39 126 24V3Z" fill="#182331" stroke="#dab979" stroke-width="1.4"/><path d="M18-3 90-30 162-3 90 23Z" fill="#121c2a" stroke="#e0bc70" stroke-width="1.6" stroke-linejoin="round"/><path d="M18-3 90 19 162-3M90-27 157-3" fill="none" stroke="#526176" stroke-width="1.3"/><path d="M90-3Q116-2 140 7V38" fill="none" stroke="#dfb954" stroke-width="2.2" stroke-linecap="round"/><circle cx="90" cy="-3" r="3" fill="#e1c784"/><path d="M137 36H143L147 48Q140 52 133 48Z" fill="#d9ac48" stroke="#a57c32" stroke-width=".8"/><path d="M137 40 136 48M140 40V49M143 40 144 48" stroke="#f4d78c" stroke-width=".8"/></g>';
  } else if (kind === "memphis") {
    drawing =
      '<path d="m24 8 7 6 7-6 7 6 7-6 7 6M129 173l7-6 7 6 7-6 7 6" fill="none" stroke="#24283d" stroke-width="2.6"/><g fill="#24283d"><circle cx="10" cy="37" r="2"/><circle cx="10" cy="57" r="2"/><circle cx="170" cy="104" r="2"/><circle cx="170" cy="124" r="2"/></g><circle cx="170" cy="42" r="5" fill="none" stroke="#ece9d7" stroke-width="2.5"/><path d="M3 144 15 133 15 158Z" fill="#f0c343"/>';
  } else if (kind === "botanico") {
    drawing =
      '<g fill="none" stroke="#c2b774" stroke-width="1.2"><path d="M7 162Q18 131 10 90M171 16Q158 51 172 87"/></g><g fill="#8cb793" stroke="#173e34" stroke-width=".6"><path d="M10 124Q-1 118 4 108Q16 114 10 124ZM12 143Q25 137 21 127Q9 129 12 143ZM167 35Q154 28 158 19Q169 20 167 35ZM167 61Q180 50 176 42Q164 47 167 61Z"/></g><path d="M25 8H146M34 172H154" stroke="#c2b774" stroke-width="1"/>';
  }
  return drawing
    ? '<svg viewBox="0 0 180 180" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
        drawing +
        "</svg>"
    : "";
}
