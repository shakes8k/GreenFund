// Allow build scripts for native/prisma packages
function readPackage(pkg) {
  return pkg;
}

module.exports = { hooks: { readPackage } };
