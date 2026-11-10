/** "Sírio-Libanês" → "sirio-libanes": compara textos sem diferenciar acentos e maiúsculas */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
