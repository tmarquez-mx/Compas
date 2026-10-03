"use strict";
const vm = require("node:vm");
const assert = require("node:assert/strict");

// Extrae una declaración completa del código entregado, sin depender de su formato
// ni de la función que aparece a continuación. El código sigue ejecutándose en VM.
function statementSource(source, index, label) {
  assert(index >= 0, "Falta el código real: " + label);
  let statement = "";
  for (const line of source.slice(index).trimStart().split("\n")) {
    statement += line + "\n";
    try {
      new vm.Script(statement);
      return statement;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  throw new Error("No se pudo extraer " + label);
}
function functionSource(source, name) {
  assert(/^[A-Za-z_$][\w$]*$/.test(name));
  const match = new RegExp(
    "^\\s*(?:async\\s+)?function\\s+" + name + "\\s*\\(",
    "m",
  ).exec(source);
  assert(match, "Falta la función real: " + name);
  return statementSource(source, match.index, name);
}
module.exports = { statementSource, functionSource };
