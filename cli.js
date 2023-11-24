#!/usr/bin/env node
import pkg from './package.json' with { type: "json" }

console.log(`sign-gen v${pkg.version}`)
