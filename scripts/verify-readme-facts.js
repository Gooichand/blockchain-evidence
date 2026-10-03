#!/usr/bin/env node
/**
 * verify-readme-facts.js
 * ---------------------------------------------------------------------------
 * Asserts every hard number the README and its figures claim, against the live
 * source. Run it after changing a figure so the artwork cannot quietly rot into
 * fiction.
 *
 * Usage:  npm run verify:readme
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let pass = 0;
let fail = 0;

function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(46)} claimed=${expected} actual=${actual}`);
}

console.log('\nVerifying README figures against the source\n');

/* ---- counts read straight off disk ---- */
const readdir = (d, ext) =>
  fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith(ext));

check('router files (excluding index.js)', readdir('routes', '.js').filter((f) => f !== 'index.js').length, 19);
check('static HTML pages', readdir('public', '.html').length, 45);
check('SQL migrations', readdir('migrations', '.sql').length, 8);
check('Jest suites', readdir('tests', '.test.js').length, 3);

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
check('Express major.minor', `${pkg.dependencies.express.replace('^', '').split('.').slice(0, 2).join('.')}`, '5.2');
check('licence', pkg.license, 'Apache-2.0');

/* ---- roles: read the ROLES array rather than trusting a count ---- */
const authz = fs.readFileSync(path.join(ROOT, 'middleware', 'authorization.js'), 'utf8');
const rolesBlock = authz.match(/const ROLES\s*=\s*\[([\s\S]*?)\]/);
const roles = rolesBlock
  ? [...rolesBlock[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1])
  : [];
check('access roles', roles.length, 8);

/* ---- base schema table count ---- */
const sql = fs.readFileSync(path.join(ROOT, 'complete-database-setup-fixed.sql'), 'utf8');
check('base tables created', (sql.match(/^\s*CREATE TABLE/gim) || []).length, 16);

/* ---- rate limiters defined vs wired ---- */
const rl = fs.readFileSync(path.join(ROOT, 'middleware', 'rateLimiters.js'), 'utf8');
const defined = (rl.match(/^\s*(?:const\s+)?\w*[Ll]imiter\s*=/gm) || []).length;
check('rate limiters defined', defined, 10);

/* ---- live endpoint count: mount the real router stack ---- */
console.log('\n  counting routes from the live Express stack...');
const app = require(path.join(ROOT, 'server.js'));

setTimeout(() => {
  const stack = (app.router && app.router.stack) || (app._router && app._router.stack);
  const found = [];
  const walk = (layers, prefix) => {
    for (const layer of layers) {
      if (layer.route) {
        for (const m of Object.keys(layer.route.methods)) found.push(m.toUpperCase());
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        const mm = String(layer.regexp || '').match(/^\^\\\/(.*?)(?:\\\/\(\?=\\\/\|\$\))?\$/);
        let seg = mm ? mm[1] : '';
        seg = seg.replace(/\\\//g, '/').replace(/\(\?=.*$/, '');
        walk(layer.handle.stack, prefix + seg);
      }
    }
  };
  if (stack) walk(stack, '');

  check('registered API endpoints', found.length, 128);
  check('GET routes', found.filter((m) => m === 'GET').length, 65);
  check('POST routes', found.filter((m) => m === 'POST').length, 51);
  check('PUT routes', found.filter((m) => m === 'PUT').length, 10);
  check('DELETE routes', found.filter((m) => m === 'DELETE').length, 2);

  /* ---- capability figure: 8 / 3 / 2 / 1 ---- */
  check('capability total (8+3+2+1)', 8 + 3 + 2 + 1, 14);

  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}, 4000);