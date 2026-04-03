export function getChoiceByIndex(choices, index) {
  if (!Array.isArray(choices) || index < 0 || index >= choices.length) {
    return null;
  }

  return choices[index] ?? null;
}
