const memory = {};

export default function (obj) {
  const objString = JSON.stringify(obj);

  // cached hash
  if (memory.hasOwnProperty(objString)) {
    return memory[objString];
  }

  let hash = 0;

  if (objString.length) {
    let char;
    let i;

    for (i = 0; i < objString.length; i++) {
      char = objString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash; // Convert to 32bit integer
    }
  }
  return hash;
}
