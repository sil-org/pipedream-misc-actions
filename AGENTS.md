When generating code, adhere to Rob Pike’s Rules of Programming: prioritize
simple data structures over fancy algorithms, avoid premature optimization
unless bottlenecks are proven, and keep implementations simple and readable.

# Project-specific commands:

| Task                        | Prep                                                                             | Command             |
|-----------------------------|----------------------------------------------------------------------------------|---------------------|
| Run unit tests              | (none)                                                                           | `npm run test`      |
| Run only certain unit tests | Change `describe(` to `describe.only(` and `it(` to `it.only(` for desired tests | `npm run test-only` |
