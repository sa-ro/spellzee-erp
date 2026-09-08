# References & Sources

## Official Documentation
- **Redux Toolkit official docs (redux-toolkit.js.org)** — `createEntityAdapter` generates prebuilt reducers and selectors for CRUD operations on a normalized state structure; this is the official mechanism behind the normalization rule. https://redux-toolkit.js.org/api/createEntityAdapter
- **Redux Toolkit Usage Guide** — normalization patterns, `{ ids: [], entities: {} }` shape: https://redux-toolkit.js.org/usage/usage-guide
- **RTK Query official docs** — cache tags, invalidation, optimistic updates: https://redux-toolkit.js.org/rtk-query/overview
- **Redux Style Guide (official)** — keep state minimal, normalize complex state, don't put non-serializable values in state: https://redux.js.org/style-guide/
- **Zustand official docs (zustand.docs.pmnd.rs) — Beginner & Advanced TypeScript guides** — curried `create<T>()(...)` pattern for correct type inference, `useShallow` for selector equality: https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript
- **React docs (react.dev)** — `useState`/`useReducer` for local state, "lifting state up" guidance: https://react.dev/learn/sharing-state-between-components
- **Firebase official docs** — `onSnapshot` listener lifecycle and cleanup: https://firebase.google.com/docs/firestore/query-data/listen

## Widely-Recognized Community Standards
- **Mark Erikson (Redux maintainer) — blog on state categorization and "You Might Not Need Redux"** — informs the server-state-vs-client-state distinction: https://blog.isquaredsoftware.com
- **TkDodo (Dominik Dorfmeister, React Query/TanStack maintainer) — "Practical React Query" blog series** — the server-state vs client-state distinction, why server state shouldn't live in client stores: https://tkdodo.eu/blog/practical-react-query
- **Kent C. Dodds — "Application State Management with React"** — when to lift state, when to keep it local: https://kentcdodds.com/blog/application-state-management-with-react

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
