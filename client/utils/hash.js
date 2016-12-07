const memory = {};

export default function hash(obj) {
  const objString = JSON.stringify(obj);

  // cached hash
  if (memory.hasOwnProperty(objString)) {
    return memory[objString];
  }

  let foundHash = 0;

  if (objString.length) {
    let char;
    let i;

    for (i = 0; i < objString.length; i++) {
      char = objString.charCodeAt(i);
      foundHash = ((foundHash << 5) - foundHash) + char;
      foundHash &= foundHash; // Convert to 32bit integer
    }
  }
  return foundHash;
}

export function compare(base, fork) {
  const baseHash = hash(base);
  const forkHash = hash(fork);

  return baseHash === forkHash;
}
