export const randStringGen = (len, res = '') => {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  if (res.length >= len) {
    return res;
  }
  const charc = chars[Math.floor(Math.random() * chars.length)];
  res += Math.random() > 0.5 ? charc.toUpperCase() : charc;
  return randStringGen(len, res);
};

export const pins = (count, len = 24, res = []) => {
  if (res.length >= count) {
    return res;
  }
  res.push({ pin: randStringGen(len) });
  return pins(count, len, res);
};
