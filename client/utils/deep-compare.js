export default function deepCompare(obj1, obj2) {
  const original = JSON.stringify(obj1);
  const other = JSON.stringify(obj2);

  return original === other;
}
