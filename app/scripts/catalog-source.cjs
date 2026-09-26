const fs = require("fs"),
  vm = require("vm");
const html = fs.readFileSync("../index.html", "utf8");
const s = html.slice(
  html.indexOf("const PKGS ="),
  html.indexOf("function packageForGuests"),
);
console.log(
  JSON.stringify(
    vm.runInNewContext(s + ";({packages:PKGS,prices:PRICE_ESTIMATES})"),
  ),
);
