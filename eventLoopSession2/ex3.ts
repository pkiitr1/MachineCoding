

import crypto from "node:crypto";
import dns from "node:dns";

const start=Date.now();

crypto.pbkdf2("pass", "salt", 500_000, 64, "sha512", (err, key) => console.log("crypto",Date.now()-start));

dns.lookup("google.com",(err,addr)=>console.log("lookup",Date.now()-start));



dns.resolve4("google.com",(err,addr)=>console.log("resolve4",Date.now()-start));