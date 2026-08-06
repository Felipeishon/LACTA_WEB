export const formatRut = (value) => {
  let rut = value.replace(/[^\dkK]/g, "");
  if (rut.length < 2) return rut;
  let body = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${dv}`;
};

export const validarRut = (rut) => {
  if (!/^[0-9.]+[-|‐][0-9kK]{1}$/.test(rut)) return false;
  let tmp = rut.split('-');
  let digv = tmp[1].toLowerCase();
  let rutNum = tmp[0].replace(/\./g, '');
  let M = 0, S = 1;
  for (let t = parseInt(rutNum); t; t = Math.floor(t / 10))
    S = (S + t % 10 * (9 - M++ % 6)) % 11;
  let dvCalculado = S ? (S - 1).toString() : 'k';
  return dvCalculado === digv;
};