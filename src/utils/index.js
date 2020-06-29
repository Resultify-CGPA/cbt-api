export const randStringGen = (len, res = '') => {
  const chars = '1234567890';
  if (res.length >= len) {
    return res;
  }
  const charc = chars[Math.floor(Math.random() * chars.length)];
  res += charc;
  return randStringGen(len, res);
};

export const pins = (count, len = 10, res = []) => {
  if (res.length >= count) {
    return res;
  }
  res.push({ pin: randStringGen(len) });
  return pins(count, len, res);
};
