# Project Conventions — Template (fill in once real code exists)

_Last updated: not yet populated._

## Folder structure

_Fill in once the first module/route/service is written — e.g.:_
```
src/
  routes/
  services/
  repositories/
  migrations/
  tests/
```

## Naming conventions

- File naming: _TBD_
- Variable/function casing: _TBD_
- DB table naming (singular/plural, snake_case): _TBD_
- DB column naming: _TBD_

## Error handling pattern

_TBD — how does an error raised in a service reach the HTTP response?
What shape does the client see? Does it match `backend-api-design`'s
generic standard error shape, or differ intentionally?_

## Auth pattern

_TBD — session or JWT? Where does the auth check happen (middleware,
decorator, manual check per handler)? What's the role/permission model?_

## Lint / format

_TBD — ESLint config, Prettier config, any project-specific rules._

## Libraries in use

| Concern | Library | Notes |
|---|---|---|
| Web framework | Express (pinned) | see `nodejs-postgres-stack` |
| DB access | _TBD_ | |
| Validation | _TBD_ (zod expected) | |
| Logging | _TBD_ (pino expected) | |
| Testing | _TBD_ (Vitest expected) | |
| Migration tool | _TBD_ | |

## Deviations from the generic stack skill

_List anything this project does differently from
`nodejs-postgres-stack`'s defaults, and why._
