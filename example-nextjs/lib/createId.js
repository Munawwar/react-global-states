function createId() {
  return `${(Math.random() * 100000) | 0}`;
}

export default createId;
