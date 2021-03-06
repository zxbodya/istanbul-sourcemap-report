function remapBranch(genItem, getMapping) {
  const locations = [];
  let source;

  for (let i = 0; i < genItem.locations.length; ++i) {
    const mapping = getMapping(genItem.locations[i]);
    if (!mapping) {
      return null;
    }

    if (!source) {
      source = mapping.source;
    } else {
      if (source !== mapping.source) {
        return null;
      }
    }
    locations.push(mapping.loc);
  }

  const srcItem = {
    line: locations[0].start.line,
    type: genItem.type,
    locations,
  };

  return { source, srcItem };
}

module.exports = remapBranch;
