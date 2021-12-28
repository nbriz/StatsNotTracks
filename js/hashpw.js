#!/usr/bin/env node
/*
  hashpw
  -----------
  by Nick Briz <nickbriz@protonmail.com>
  GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
  2019

  -----------
      info
  -----------

  simple cli for hashing passwords && comparing passwords to hashes

  -----------
      usage
  -----------

  // returns hashed password
  $ node hashpw 'password'

  // returns ERROR or SCUCCESS message
  $ node hashpw 'password' 'hash'

*/
const password = process.argv[2]
const hash = process.argv[3]
const bcrypt = require('bcryptjs')

async function hashIt (pw) {
  const salt = await bcrypt.genSalt(10)
  const hashPw = await bcrypt.hash(pw, salt)
  return hashPw
}

async function main () {
  if (hash) {
    const valid = await bcrypt.compare(password, hash)
    if (!valid) console.log('ERROR: password does not match hash')
    else console.log('SUCCESS: password matches hash')
  } else {
    const hasshedPw = await hashIt(password)
    console.log(`hashed password:\n${hasshedPw}`)
  }
}

main()
